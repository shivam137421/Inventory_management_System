package com.stockpilot.service;

import com.stockpilot.dto.ProductRequest;
import com.stockpilot.dto.ProductResponse;
import com.stockpilot.dto.StockAdjustmentRequest;
import com.stockpilot.dto.StockRequest;
import com.stockpilot.entity.Product;
import com.stockpilot.entity.StockTransaction;
import com.stockpilot.entity.TransactionType;
import com.stockpilot.exception.ConflictException;
import com.stockpilot.exception.ResourceNotFoundException;
import com.stockpilot.repository.BusinessRepository;
import com.stockpilot.repository.ProductRepository;
import com.stockpilot.repository.StockTransactionRepository;
import com.stockpilot.security.TenantContext;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final BusinessRepository businessRepository;

    public ProductService(
            ProductRepository productRepository,
            StockTransactionRepository stockTransactionRepository,
            BusinessRepository businessRepository) {
        this.productRepository = productRepository;
        this.stockTransactionRepository = stockTransactionRepository;
        this.businessRepository = businessRepository;
    }

    private Long resolveBusinessId() {
        Long bid = TenantContext.getCurrentBusinessId();
        return bid != null ? bid : 1L;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        Long businessId = resolveBusinessId();
        return productRepository.findAllByBusinessIdOrderByCreatedAtDesc(businessId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Long businessId = resolveBusinessId();
        Product product = productRepository.findByIdAndBusinessId(id, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));
        return mapToResponse(product);
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Long businessId = resolveBusinessId();
        String cleanSku = request.getSku() != null ? request.getSku().trim().toUpperCase() : "";
        if (productRepository.existsByBusinessIdAndSkuIgnoreCase(businessId, cleanSku)) {
            throw new ConflictException("SKU already exists.");
        }

        com.stockpilot.entity.Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found."));

        Product product = new Product(
                business,
                cleanSku,
                request.getName().trim(),
                request.getCategory().trim(),
                request.getUnit(),
                request.getQuantity(),
                request.getReorderLevel(),
                request.getUnitPrice(),
                request.getPurchasePrice(),
                request.getDescription(),
                true
        );

        Product savedProduct = productRepository.save(product);

        if (request.getQuantity() > 0) {
            StockTransaction openingTransaction = new StockTransaction(
                    business,
                    savedProduct,
                    TransactionType.IN,
                    request.getQuantity(),
                    "Opening stock",
                    "INITIAL",
                    null,
                    request.getQuantity()
            );
            stockTransactionRepository.save(openingTransaction);
        }

        return mapToResponse(savedProduct);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Long businessId = resolveBusinessId();
        Product product = productRepository.findByIdAndBusinessId(id, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));

        String cleanSku = request.getSku() != null ? request.getSku().trim().toUpperCase() : "";
        if (productRepository.existsByBusinessIdAndSkuIgnoreCaseAndIdNot(businessId, cleanSku, id)) {
            throw new ConflictException("SKU already exists.");
        }

        product.setSku(cleanSku);
        product.setName(request.getName().trim());
        product.setCategory(request.getCategory().trim());
        if (request.getUnit() != null && !request.getUnit().trim().isEmpty()) {
            product.setUnit(request.getUnit());
        }
        product.setReorderLevel(request.getReorderLevel());
        product.setUnitPrice(request.getUnitPrice());
        product.setPurchasePrice(request.getPurchasePrice());
        product.setDescription(request.getDescription());
        // Note: quantity is ignored on edit per business rules

        Product updatedProduct = productRepository.save(product);
        return mapToResponse(updatedProduct);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Long businessId = resolveBusinessId();
        Product product = productRepository.findByIdAndBusinessId(id, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));

        if (stockTransactionRepository.existsByProductIdAndBusinessId(id, businessId)) {
            product.setIsActive(false);
            productRepository.save(product);
            return;
        }

        productRepository.delete(product);
    }

    @Transactional
    public ProductResponse stockIn(Long id, StockRequest request) {
        Long businessId = resolveBusinessId();
        Product product = productRepository.findByIdAndBusinessIdWithLock(id, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));

        long newQuantity = (long) product.getQuantity() + request.getQuantity();
        if (newQuantity > Integer.MAX_VALUE) {
            throw new ConflictException("Quantity exceeds maximum capacity.");
        }

        int finalQty = (int) newQuantity;
        product.setQuantity(finalQty);
        Product savedProduct = productRepository.save(product);

        StockTransaction transaction = new StockTransaction(
                product.getBusiness(),
                savedProduct,
                TransactionType.IN,
                request.getQuantity(),
                request.getNote() != null ? request.getNote().trim() : null,
                "MANUAL_STOCK_IN",
                null,
                finalQty
        );
        stockTransactionRepository.save(transaction);

        return mapToResponse(savedProduct);
    }

    @Transactional
    public ProductResponse stockOut(Long id, StockRequest request) {
        Long businessId = resolveBusinessId();
        Product product = productRepository.findByIdAndBusinessIdWithLock(id, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));

        if (request.getQuantity() > product.getQuantity()) {
            throw new ConflictException("Insufficient stock available.");
        }

        int finalQty = product.getQuantity() - request.getQuantity();
        product.setQuantity(finalQty);
        Product savedProduct = productRepository.save(product);

        StockTransaction transaction = new StockTransaction(
                product.getBusiness(),
                savedProduct,
                TransactionType.OUT,
                request.getQuantity(),
                request.getNote() != null ? request.getNote().trim() : null,
                "MANUAL_STOCK_OUT",
                null,
                finalQty
        );
        stockTransactionRepository.save(transaction);

        return mapToResponse(savedProduct);
    }

    @Transactional
    public ProductResponse adjustStock(Long id, StockAdjustmentRequest request) {
        Long businessId = resolveBusinessId();
        Product product = productRepository.findByIdAndBusinessIdWithLock(id, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));

        if (request.getQuantityChange() == null || request.getQuantityChange() == 0) {
            throw new ConflictException("Quantity change cannot be zero.");
        }

        int change = request.getQuantityChange();
        long newQuantity = (long) product.getQuantity() + change;

        if (newQuantity < 0) {
            throw new ConflictException("Adjustment would result in negative stock.");
        }
        if (newQuantity > Integer.MAX_VALUE) {
            throw new ConflictException("Quantity exceeds maximum capacity.");
        }

        int finalQty = (int) newQuantity;
        product.setQuantity(finalQty);
        Product savedProduct = productRepository.save(product);

        TransactionType type = change > 0 ? TransactionType.ADJUSTMENT_IN : TransactionType.ADJUSTMENT_OUT;
        int absQty = Math.abs(change);

        StockTransaction transaction = new StockTransaction(
                product.getBusiness(),
                savedProduct,
                type,
                absQty,
                request.getReason() != null ? request.getReason().trim() : "Stock adjustment",
                "MANUAL_ADJUSTMENT",
                null,
                finalQty
        );
        stockTransactionRepository.save(transaction);

        return mapToResponse(savedProduct);
    }

    public ProductResponse mapToResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getSku(),
                product.getName(),
                product.getCategory(),
                product.getUnit(),
                product.getQuantity(),
                product.getReorderLevel(),
                product.getUnitPrice(),
                product.getPurchasePrice(),
                product.getDescription(),
                product.getIsActive(),
                product.getDerivedStatus(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
