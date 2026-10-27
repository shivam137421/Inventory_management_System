package com.stockpilot.service;

import com.stockpilot.dto.SaleItemRequest;
import com.stockpilot.dto.SaleItemResponse;
import com.stockpilot.dto.SaleRequest;
import com.stockpilot.dto.SaleResponse;
import com.stockpilot.entity.Business;
import com.stockpilot.entity.PaymentMethod;
import com.stockpilot.entity.PaymentStatus;
import com.stockpilot.entity.Product;
import com.stockpilot.entity.Sale;
import com.stockpilot.entity.SaleItem;
import com.stockpilot.entity.StockTransaction;
import com.stockpilot.entity.TransactionType;
import com.stockpilot.exception.BadRequestException;
import com.stockpilot.exception.ConflictException;
import com.stockpilot.exception.ResourceNotFoundException;
import com.stockpilot.repository.BusinessRepository;
import com.stockpilot.repository.ProductRepository;
import com.stockpilot.repository.SaleItemRepository;
import com.stockpilot.repository.SaleRepository;
import com.stockpilot.repository.StockTransactionRepository;
import com.stockpilot.security.TenantContext;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SaleService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final ProductRepository productRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final BusinessRepository businessRepository;

    public SaleService(
            SaleRepository saleRepository,
            SaleItemRepository saleItemRepository,
            ProductRepository productRepository,
            StockTransactionRepository stockTransactionRepository,
            BusinessRepository businessRepository) {
        this.saleRepository = saleRepository;
        this.saleItemRepository = saleItemRepository;
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
    public List<SaleResponse> getAllSales() {
        Long businessId = resolveBusinessId();
        List<Sale> sales = saleRepository.findAllByBusinessIdOrderByCreatedAtDesc(businessId);
        return sales.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SaleResponse getSaleById(Long id) {
        Long businessId = resolveBusinessId();
        Sale sale = saleRepository.findByIdAndBusinessId(id, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Sale invoice not found."));
        return mapToResponse(sale);
    }

    @Transactional(readOnly = true)
    public SaleResponse getSaleByBillNumber(String billNumber) {
        Long businessId = resolveBusinessId();
        Sale sale = saleRepository.findByBusinessIdAndBillNumber(businessId, billNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Sale invoice " + billNumber + " not found."));
        return mapToResponse(sale);
    }

    @Transactional
    public SaleResponse createSale(SaleRequest request) {
        Long businessId = resolveBusinessId();
        Long userId = resolveUserId();

        Business business = businessRepository.findByIdWithLock(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found."));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Sale must contain at least one line item.");
        }

        // Sort items by product ID to acquire pessimistic locks in a consistent order and prevent database deadlocks
        List<SaleItemRequest> sortedItemRequests = new ArrayList<>(request.getItems());
        sortedItemRequests.sort(Comparator.comparing(SaleItemRequest::getProductId));

        // Generate sequential atomic bill number: INV-000001
        long count = saleRepository.countSalesForBusiness(businessId);
        String billNumber;
        long candidateIndex = count + 1;
        do {
            billNumber = String.format("INV-%06d", candidateIndex);
            candidateIndex++;
        } while (saleRepository.existsByBusinessIdAndBillNumber(businessId, billNumber));

        PaymentMethod paymentMethod = request.getPaymentMethod() != null ? request.getPaymentMethod() : PaymentMethod.CASH;
        PaymentStatus paymentStatus = request.getPaymentStatus() != null ? request.getPaymentStatus() : PaymentStatus.PAID;
        BigDecimal requestedDiscount = request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO;

        Sale sale = new Sale(
                business,
                billNumber,
                request.getCustomerName() != null ? request.getCustomerName().trim() : null,
                request.getCustomerPhone() != null ? request.getCustomerPhone().trim() : null,
                paymentMethod,
                paymentStatus,
                BigDecimal.ZERO,
                requestedDiscount,
                BigDecimal.ZERO,
                request.getNotes() != null ? request.getNotes().trim() : null,
                userId
        );

        BigDecimal subtotal = BigDecimal.ZERO;
        List<Product> productsToSave = new ArrayList<>();
        List<StockTransaction> transactionsToSave = new ArrayList<>();

        for (SaleItemRequest itemReq : sortedItemRequests) {
            Product product = productRepository.findByIdAndBusinessIdWithLock(itemReq.getProductId(), businessId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product with ID " + itemReq.getProductId() + " not found."));

            if (Boolean.FALSE.equals(product.getIsActive())) {
                throw new ConflictException("Product '" + product.getName() + "' (" + product.getSku() + ") is inactive and cannot be sold.");
            }

            if (product.getQuantity() < itemReq.getQuantity()) {
                throw new ConflictException("Insufficient stock for product '" + product.getName() + "' (" + product.getSku() +
                        "). Requested: " + itemReq.getQuantity() + " " + product.getUnit() +
                        ", Available: " + product.getQuantity() + " " + product.getUnit() + ".");
            }

            // Snapshot unit price: use requested price if provided and non-negative, otherwise product catalog unit price
            BigDecimal unitPrice = itemReq.getUnitPrice() != null && itemReq.getUnitPrice().compareTo(BigDecimal.ZERO) >= 0
                    ? itemReq.getUnitPrice()
                    : product.getUnitPrice();

            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(lineTotal);

            // Deduct stock in real-time
            int newQuantity = product.getQuantity() - itemReq.getQuantity();
            product.setQuantity(newQuantity);
            productsToSave.add(product);

            SaleItem saleItem = new SaleItem(sale, product, itemReq.getQuantity(), unitPrice, lineTotal);
            sale.addItem(saleItem);

            // Prepare audit ledger outflow transaction
            StockTransaction transaction = new StockTransaction(
                    business,
                    product,
                    TransactionType.SALE,
                    itemReq.getQuantity(),
                    "Sale bill " + billNumber,
                    "SALE_BILL",
                    null, // set below after sale persist
                    newQuantity
            );
            transactionsToSave.add(transaction);
        }

        if (requestedDiscount.compareTo(subtotal) > 0) {
            throw new BadRequestException("Discount (" + requestedDiscount + ") cannot exceed subtotal (" + subtotal + ").");
        }

        BigDecimal grandTotal = subtotal.subtract(requestedDiscount);
        sale.setSubtotal(subtotal);
        sale.setDiscount(requestedDiscount);
        sale.setGrandTotal(grandTotal);

        // 1. Save all locked product updates
        productRepository.saveAll(productsToSave);

        // 2. Save sale and sale items
        Sale savedSale = saleRepository.save(sale);

        // 3. Link sale ID and save all audit transactions
        for (StockTransaction tx : transactionsToSave) {
            tx.setReferenceId(savedSale.getId());
        }
        stockTransactionRepository.saveAll(transactionsToSave);

        return mapToResponse(savedSale);
    }

    public SaleResponse mapToResponse(Sale sale) {
        List<SaleItemResponse> itemResponses = sale.getItems().stream()
                .map(item -> new SaleItemResponse(
                        item.getId(),
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getProduct().getSku(),
                        item.getProduct().getUnit(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getLineTotal()
                ))
                .collect(Collectors.toList());

        return new SaleResponse(
                sale.getId(),
                sale.getBillNumber(),
                sale.getCustomerName(),
                sale.getCustomerPhone(),
                sale.getPaymentMethod(),
                sale.getPaymentStatus(),
                sale.getSubtotal(),
                sale.getDiscount(),
                sale.getGrandTotal(),
                sale.getNotes(),
                sale.getCreatedBy(),
                sale.getCreatedAt(),
                sale.getUpdatedAt(),
                itemResponses
        );
    }
}
