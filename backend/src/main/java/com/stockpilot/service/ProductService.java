package com.stockpilot.service;

import com.stockpilot.dto.ProductRequest;
import com.stockpilot.dto.ProductResponse;
import com.stockpilot.dto.StockRequest;
import com.stockpilot.entity.Product;
import com.stockpilot.entity.StockTransaction;
import com.stockpilot.entity.TransactionType;
import com.stockpilot.exception.ConflictException;
import com.stockpilot.exception.ResourceNotFoundException;
import com.stockpilot.repository.ProductRepository;
import com.stockpilot.repository.StockTransactionRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final StockTransactionRepository stockTransactionRepository;

    public ProductService(ProductRepository productRepository, StockTransactionRepository stockTransactionRepository) {
        this.productRepository = productRepository;
        this.stockTransactionRepository = stockTransactionRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));
        return mapToResponse(product);
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        String cleanSku = request.getSku() != null ? request.getSku().trim().toUpperCase() : "";
        if (productRepository.existsBySkuIgnoreCase(cleanSku)) {
            throw new ConflictException("SKU already exists.");
        }

        Product product = new Product(
                cleanSku,
                request.getName().trim(),
                request.getCategory().trim(),
                request.getQuantity(),
                request.getReorderLevel(),
                request.getUnitPrice()
        );

        Product savedProduct = productRepository.save(product);

        if (request.getQuantity() > 0) {
            StockTransaction openingTransaction = new StockTransaction(
                    savedProduct,
                    TransactionType.IN,
                    request.getQuantity(),
                    "Opening stock"
            );
            stockTransactionRepository.save(openingTransaction);
        }

        return mapToResponse(savedProduct);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));

        String cleanSku = request.getSku() != null ? request.getSku().trim().toUpperCase() : "";
        if (productRepository.existsBySkuIgnoreCaseAndIdNot(cleanSku, id)) {
            throw new ConflictException("SKU already exists.");
        }

        product.setSku(cleanSku);
        product.setName(request.getName().trim());
        product.setCategory(request.getCategory().trim());
        product.setReorderLevel(request.getReorderLevel());
        product.setUnitPrice(request.getUnitPrice());
        // Note: quantity is ignored on edit per business rules

        Product updatedProduct = productRepository.save(product);
        return mapToResponse(updatedProduct);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));

        if (stockTransactionRepository.existsByProductId(id)) {
            throw new ConflictException("This product has stock history and cannot be deleted.");
        }

        productRepository.delete(product);
    }

    @Transactional
    public ProductResponse stockIn(Long id, StockRequest request) {
        Product product = productRepository.findByIdWithLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));

        long newQuantity = (long) product.getQuantity() + request.getQuantity();
        if (newQuantity > Integer.MAX_VALUE) {
            throw new ConflictException("Quantity exceeds maximum capacity.");
        }

        product.setQuantity((int) newQuantity);
        Product savedProduct = productRepository.save(product);

        StockTransaction transaction = new StockTransaction(
                savedProduct,
                TransactionType.IN,
                request.getQuantity(),
                request.getNote() != null ? request.getNote().trim() : null
        );
        stockTransactionRepository.save(transaction);

        return mapToResponse(savedProduct);
    }

    @Transactional
    public ProductResponse stockOut(Long id, StockRequest request) {
        Product product = productRepository.findByIdWithLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));

        if (request.getQuantity() > product.getQuantity()) {
            throw new ConflictException("Insufficient stock available.");
        }

        product.setQuantity(product.getQuantity() - request.getQuantity());
        Product savedProduct = productRepository.save(product);

        StockTransaction transaction = new StockTransaction(
                savedProduct,
                TransactionType.OUT,
                request.getQuantity(),
                request.getNote() != null ? request.getNote().trim() : null
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
                product.getQuantity(),
                product.getReorderLevel(),
                product.getUnitPrice(),
                product.getDerivedStatus(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
