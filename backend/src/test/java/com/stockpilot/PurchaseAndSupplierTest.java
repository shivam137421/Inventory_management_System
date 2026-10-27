package com.stockpilot;

import com.stockpilot.dto.ProductRequest;
import com.stockpilot.dto.ProductResponse;
import com.stockpilot.dto.PurchaseItemRequest;
import com.stockpilot.dto.PurchaseRequest;
import com.stockpilot.dto.PurchaseResponse;
import com.stockpilot.dto.SupplierRequest;
import com.stockpilot.dto.SupplierResponse;
import com.stockpilot.entity.Business;
import com.stockpilot.entity.PurchaseStatus;
import com.stockpilot.entity.StockTransaction;
import com.stockpilot.entity.TransactionType;
import com.stockpilot.exception.ConflictException;
import com.stockpilot.repository.BusinessRepository;
import com.stockpilot.repository.StockTransactionRepository;
import com.stockpilot.security.TenantContext;
import com.stockpilot.service.ProductService;
import com.stockpilot.service.PurchaseService;
import com.stockpilot.service.SupplierService;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PurchaseAndSupplierTest {

    @Autowired
    private SupplierService supplierService;

    @Autowired
    private PurchaseService purchaseService;

    @Autowired
    private ProductService productService;

    @Autowired
    private StockTransactionRepository stockTransactionRepository;

    @Autowired
    private BusinessRepository businessRepository;

    private Long testBusinessId;

    @BeforeEach
    void setUp() {
        Business business = businessRepository.save(new Business("CP4 Test Store", "45 Market Rd", "9876543222", "cp4@example.com", "27BBBBB1111B1Z2"));
        testBusinessId = business.getId();
        TenantContext.setCurrentTenant(testBusinessId, 888L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Create supplier and enforce duplicate name check per business")
    void testSupplierCreationAndUniqueness() {
        SupplierRequest req1 = new SupplierRequest("Ramesh Wholesalers", "Ramesh Kumar", "9876512345", "ramesh@example.com", "Sector 18, Noida", "Primary grain distributor");
        SupplierResponse s1 = supplierService.createSupplier(req1);

        assertNotNull(s1.getId());
        assertEquals("Ramesh Wholesalers", s1.getName());
        assertTrue(s1.getIsActive());

        // Attempt duplicate name for same business
        SupplierRequest dupReq = new SupplierRequest("Ramesh Wholesalers", "Another Person", "9876500000", null, null, null);
        assertThrows(ConflictException.class, () -> supplierService.createSupplier(dupReq));
    }

    @Test
    @DisplayName("Purchase workflow: DRAFT creation -> Receive Goods increments stock and audit ledger")
    void testPurchaseCreationAndReceiving() {
        // 1. Create Supplier
        SupplierResponse supplier = supplierService.createSupplier(
                new SupplierRequest("Agro Foods Ltd", "Amit Sharma", "9876543210", "agro@example.com", "Mandi Yard", null));

        // 2. Create Product with initial stock 10
        ProductResponse product = productService.createProduct(
                new ProductRequest("CP4-RICE-01", "Basmati Rice 1kg", "Grains", "kg", 10, 5, new BigDecimal("120.00"), new BigDecimal("90.00"), null));
        assertEquals(10, product.getQuantity());

        // 3. Create Draft Purchase Order for 30 units @ 85.00
        PurchaseRequest purchaseReq = new PurchaseRequest(
                supplier.getId(),
                "INV-AGRO-789",
                "Weekly restocking delivery",
                List.of(new PurchaseItemRequest(product.getId(), 30, new BigDecimal("85.00")))
        );
        PurchaseResponse draft = purchaseService.createPurchase(purchaseReq);

        assertNotNull(draft.getId());
        assertEquals(PurchaseStatus.DRAFT, draft.getStatus());
        assertEquals(new BigDecimal("2550.00"), draft.getTotalAmount()); // 30 * 85.00
        assertTrue(draft.getPurchaseNumber().startsWith("PUR-"));

        // Product stock should still be 10 before receiving
        ProductResponse beforeReceive = productService.getProductById(product.getId());
        assertEquals(10, beforeReceive.getQuantity());

        // 4. Receive Goods
        PurchaseResponse received = purchaseService.receivePurchase(draft.getId());
        assertEquals(PurchaseStatus.RECEIVED, received.getStatus());
        assertNotNull(received.getReceivedAt());

        // Product stock must now be 10 + 30 = 40
        ProductResponse afterReceive = productService.getProductById(product.getId());
        assertEquals(40, afterReceive.getQuantity());
        assertEquals(new BigDecimal("85.00"), afterReceive.getPurchasePrice());

        // 5. Verify StockTransaction ledger
        List<StockTransaction> txs = stockTransactionRepository.findByBusinessIdAndProductIdOrderByCreatedAtDesc(testBusinessId, product.getId());
        assertEquals(2, txs.size()); // 1 opening + 1 purchase receipt

        StockTransaction receiptTx = txs.get(0);
        assertEquals(TransactionType.PURCHASE_RECEIPT, receiptTx.getTransactionType());
        assertEquals(30, receiptTx.getQuantity());
        assertEquals(40, receiptTx.getResultingQuantity());
        assertEquals("PURCHASE_ORDER", receiptTx.getReferenceType());
        assertEquals(draft.getId(), receiptTx.getReferenceId());

        // Invariant check: ledger balance matches product quantity: 10 + 30 = 40
        Integer ledgerSum = stockTransactionRepository.calculateLedgerBalanceByProductIdAndBusinessId(product.getId(), testBusinessId);
        assertEquals(40, ledgerSum);
    }

    @Test
    @DisplayName("Duplicate receiving is impossible (idempotency enforcement)")
    void testDuplicateReceivingThrowsConflict() {
        SupplierResponse supplier = supplierService.createSupplier(new SupplierRequest("Supplier X", null, null, null, null, null));
        ProductResponse product = productService.createProduct(
                new ProductRequest("CP4-IDEM-01", "Item X", "General", "pcs", 5, 2, new BigDecimal("50.00"), new BigDecimal("35.00"), null));

        PurchaseResponse draft = purchaseService.createPurchase(
                new PurchaseRequest(supplier.getId(), null, null, List.of(new PurchaseItemRequest(product.getId(), 10, new BigDecimal("35.00")))));

        // First receive succeeds
        purchaseService.receivePurchase(draft.getId());

        // Second receive attempt must throw ConflictException
        assertThrows(ConflictException.class, () -> purchaseService.receivePurchase(draft.getId()));

        // Stock must not be double-incremented (5 + 10 = 15, not 25)
        ProductResponse finalProd = productService.getProductById(product.getId());
        assertEquals(15, finalProd.getQuantity());
    }

    @Test
    @DisplayName("Cancel draft purchase, and prevent cancellation of received purchase")
    void testPurchaseCancellationRules() {
        SupplierResponse supplier = supplierService.createSupplier(new SupplierRequest("Supplier Y", null, null, null, null, null));
        ProductResponse product = productService.createProduct(
                new ProductRequest("CP4-CANCEL-01", "Item Y", "General", "pcs", 5, 2, new BigDecimal("50.00"), new BigDecimal("35.00"), null));

        PurchaseResponse draft = purchaseService.createPurchase(
                new PurchaseRequest(supplier.getId(), null, null, List.of(new PurchaseItemRequest(product.getId(), 5, new BigDecimal("30.00")))));

        // Cancel draft purchase succeeds
        PurchaseResponse cancelled = purchaseService.cancelPurchase(draft.getId());
        assertEquals(PurchaseStatus.CANCELLED, cancelled.getStatus());

        // Cannot receive cancelled purchase
        assertThrows(ConflictException.class, () -> purchaseService.receivePurchase(draft.getId()));

        // Cannot cancel already received purchase
        PurchaseResponse draft2 = purchaseService.createPurchase(
                new PurchaseRequest(supplier.getId(), null, null, List.of(new PurchaseItemRequest(product.getId(), 5, new BigDecimal("30.00")))));
        purchaseService.receivePurchase(draft2.getId());

        assertThrows(ConflictException.class, () -> purchaseService.cancelPurchase(draft2.getId()));
    }
}
