package com.stockpilot.service;

import com.stockpilot.dto.PurchaseItemRequest;
import com.stockpilot.dto.PurchaseItemResponse;
import com.stockpilot.dto.PurchaseRequest;
import com.stockpilot.dto.PurchaseResponse;
import com.stockpilot.entity.Business;
import com.stockpilot.entity.Product;
import com.stockpilot.entity.Purchase;
import com.stockpilot.entity.PurchaseItem;
import com.stockpilot.entity.PurchaseStatus;
import com.stockpilot.entity.StockTransaction;
import com.stockpilot.entity.Supplier;
import com.stockpilot.entity.TransactionType;
import com.stockpilot.exception.ConflictException;
import com.stockpilot.exception.ResourceNotFoundException;
import com.stockpilot.repository.BusinessRepository;
import com.stockpilot.repository.ProductRepository;
import com.stockpilot.repository.PurchaseRepository;
import com.stockpilot.repository.StockTransactionRepository;
import com.stockpilot.repository.SupplierRepository;
import com.stockpilot.security.TenantContext;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final BusinessRepository businessRepository;

    public PurchaseService(
            PurchaseRepository purchaseRepository,
            SupplierRepository supplierRepository,
            ProductRepository productRepository,
            StockTransactionRepository stockTransactionRepository,
            BusinessRepository businessRepository) {
        this.purchaseRepository = purchaseRepository;
        this.supplierRepository = supplierRepository;
        this.productRepository = productRepository;
        this.stockTransactionRepository = stockTransactionRepository;
        this.businessRepository = businessRepository;
    }

    private Long resolveBusinessId() {
        Long bid = TenantContext.getCurrentBusinessId();
        return bid != null ? bid : 1L;
    }

    private Long resolveUserId() {
        return TenantContext.getCurrentUserId();
    }

    @Transactional(readOnly = true)
    public List<PurchaseResponse> getAllPurchases(PurchaseStatus status) {
        Long businessId = resolveBusinessId();
        List<Purchase> purchases = status != null
                ? purchaseRepository.findAllByBusinessIdAndStatusOrderByCreatedAtDesc(businessId, status)
                : purchaseRepository.findAllByBusinessIdOrderByCreatedAtDesc(businessId);

        return purchases.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PurchaseResponse getPurchaseById(Long id) {
        Long businessId = resolveBusinessId();
        Purchase purchase = purchaseRepository.findByIdAndBusinessId(id, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase not found."));
        return mapToResponse(purchase);
    }

    @Transactional
    public PurchaseResponse createPurchase(PurchaseRequest request) {
        Long businessId = resolveBusinessId();
        Long userId = resolveUserId();

        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found."));

        Supplier supplier = supplierRepository.findByIdAndBusinessId(request.getSupplierId(), businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found."));

        // Generate sequential document number PUR-000001
        long count = purchaseRepository.countPurchasesForBusiness(businessId);
        String purchaseNumber = String.format("PUR-%06d", count + 1);

        Purchase purchase = new Purchase(
                business,
                supplier,
                purchaseNumber,
                request.getSupplierInvoiceNo() != null ? request.getSupplierInvoiceNo().trim() : null,
                request.getNotes() != null ? request.getNotes().trim() : null,
                userId
        );

        for (PurchaseItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findByIdAndBusinessId(itemReq.getProductId(), businessId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product with ID " + itemReq.getProductId() + " not found."));

            PurchaseItem item = new PurchaseItem(
                    purchase,
                    product,
                    itemReq.getQuantity(),
                    itemReq.getUnitPrice()
            );
            purchase.addItem(item);
        }

        purchase.recalculateTotal();
        Purchase saved = purchaseRepository.save(purchase);
        return mapToResponse(saved);
    }

    @Transactional
    public PurchaseResponse receivePurchase(Long id) {
        Long businessId = resolveBusinessId();
        Purchase purchase = purchaseRepository.findByIdAndBusinessId(id, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase not found."));

        if (purchase.getStatus() == PurchaseStatus.RECEIVED) {
            throw new ConflictException("Purchase has already been received.");
        }
        if (purchase.getStatus() == PurchaseStatus.CANCELLED) {
            throw new ConflictException("Cannot receive a cancelled purchase.");
        }

        // Lock and update products, recording audit ledger transactions
        for (PurchaseItem item : purchase.getItems()) {
            Product product = productRepository.findByIdAndBusinessIdWithLock(item.getProduct().getId(), businessId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found."));

            long newQty = (long) product.getQuantity() + item.getQuantity();
            if (newQty > Integer.MAX_VALUE) {
                throw new ConflictException("Quantity exceeds maximum capacity for " + product.getName());
            }

            int finalQty = (int) newQty;
            product.setQuantity(finalQty);
            product.setPurchasePrice(item.getUnitPrice()); // Update cost price to latest received price
            Product savedProduct = productRepository.save(product);

            StockTransaction transaction = new StockTransaction(
                    product.getBusiness(),
                    savedProduct,
                    TransactionType.PURCHASE_RECEIPT,
                    item.getQuantity(),
                    "Received against " + purchase.getPurchaseNumber(),
                    "PURCHASE_ORDER",
                    purchase.getId(),
                    finalQty
            );
            stockTransactionRepository.save(transaction);
        }

        purchase.setStatus(PurchaseStatus.RECEIVED);
        purchase.setReceivedAt(LocalDateTime.now());
        Purchase updated = purchaseRepository.save(purchase);
        return mapToResponse(updated);
    }

    @Transactional
    public PurchaseResponse cancelPurchase(Long id) {
        Long businessId = resolveBusinessId();
        Purchase purchase = purchaseRepository.findByIdAndBusinessId(id, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase not found."));

        if (purchase.getStatus() == PurchaseStatus.RECEIVED) {
            throw new ConflictException("Cannot cancel an already received purchase.");
        }

        purchase.setStatus(PurchaseStatus.CANCELLED);
        Purchase updated = purchaseRepository.save(purchase);
        return mapToResponse(updated);
    }

    public PurchaseResponse mapToResponse(Purchase purchase) {
        List<PurchaseItemResponse> itemResponses = purchase.getItems() != null
                ? purchase.getItems().stream().map(item -> new PurchaseItemResponse(
                        item.getId(),
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getProduct().getSku(),
                        item.getProduct().getUnit(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getLineTotal()
                )).collect(Collectors.toList())
                : List.of();

        return new PurchaseResponse(
                purchase.getId(),
                purchase.getPurchaseNumber(),
                purchase.getSupplier().getId(),
                purchase.getSupplier().getName(),
                purchase.getSupplierInvoiceNo(),
                purchase.getStatus(),
                purchase.getTotalAmount(),
                purchase.getNotes(),
                purchase.getReceivedAt(),
                purchase.getCreatedAt(),
                purchase.getUpdatedAt(),
                itemResponses
        );
    }
}
