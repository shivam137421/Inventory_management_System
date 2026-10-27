package com.stockpilot;

import com.stockpilot.dto.ProductRequest;
import com.stockpilot.dto.ProductResponse;
import com.stockpilot.dto.SaleItemRequest;
import com.stockpilot.dto.SaleRequest;
import com.stockpilot.dto.SaleResponse;
import com.stockpilot.entity.Business;
import com.stockpilot.entity.PaymentMethod;
import com.stockpilot.entity.PaymentStatus;
import com.stockpilot.entity.StockTransaction;
import com.stockpilot.entity.TransactionType;
import com.stockpilot.exception.BadRequestException;
import com.stockpilot.exception.ConflictException;
import com.stockpilot.repository.BusinessRepository;
import com.stockpilot.repository.StockTransactionRepository;
import com.stockpilot.security.TenantContext;
import com.stockpilot.service.ProductService;
import com.stockpilot.service.SaleService;
import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
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
class SaleAndConcurrencyTest {

    @Autowired
    private SaleService saleService;

    @Autowired
    private ProductService productService;

    @Autowired
    private StockTransactionRepository stockTransactionRepository;

    @Autowired
    private BusinessRepository businessRepository;

    private Long testBusinessId;

    @BeforeEach
    void setUp() {
        Business business = businessRepository.save(new Business("CP5 POS Store", "12 Bazaar St", "9876500000", "pos@example.com", "27AAAAA0000A1Z5"));
        testBusinessId = business.getId();
        TenantContext.setCurrentTenant(testBusinessId, 999L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Record sale successfully: stock deducted, price snapshotted, and ledger entry created")
    void testRecordSaleAndStockDeduction() {
        // 1. Create product with initial stock 30
        ProductResponse product = productService.createProduct(
                new ProductRequest("CP5-TEA-01", "Assam Gold Tea 500g", "Beverages", "packet", 30, 5, new BigDecimal("250.00"), new BigDecimal("180.00"), null));
        assertEquals(30, product.getQuantity());

        // 2. Record sale of 8 units with Rs. 50 discount
        SaleItemRequest itemReq = new SaleItemRequest(product.getId(), 8, null); // unit price auto-snapshotted from catalog
        SaleRequest saleReq = new SaleRequest(
                "Rohit Sharma",
                "9811223344",
                PaymentMethod.UPI,
                PaymentStatus.PAID,
                new BigDecimal("50.00"),
                "Diwali gift pack purchase",
                List.of(itemReq)
        );

        SaleResponse sale = saleService.createSale(saleReq);

        // 3. Verify sale totals
        assertNotNull(sale.getId());
        assertTrue(sale.getBillNumber().startsWith("INV-"));
        assertEquals("Rohit Sharma", sale.getCustomerName());
        assertEquals(PaymentMethod.UPI, sale.getPaymentMethod());
        assertEquals(new BigDecimal("2000.00"), sale.getSubtotal()); // 8 * 250.00
        assertEquals(new BigDecimal("50.00"), sale.getDiscount());
        assertEquals(new BigDecimal("1950.00"), sale.getGrandTotal()); // 2000 - 50

        // 4. Verify product stock deducted: 30 - 8 = 22
        ProductResponse updatedProduct = productService.getProductById(product.getId());
        assertEquals(22, updatedProduct.getQuantity());

        // 5. Verify stock transaction ledger record
        List<StockTransaction> txs = stockTransactionRepository.findByBusinessIdAndProductIdOrderByCreatedAtDesc(testBusinessId, product.getId());
        assertEquals(2, txs.size()); // 1 opening + 1 sale

        StockTransaction saleTx = txs.get(0);
        assertEquals(TransactionType.SALE, saleTx.getTransactionType());
        assertEquals(8, saleTx.getQuantity());
        assertEquals(22, saleTx.getResultingQuantity());
        assertEquals("SALE_BILL", saleTx.getReferenceType());
        assertEquals(sale.getId(), saleTx.getReferenceId());

        // 6. Invariant check: ledger balance matches product quantity: 30 - 8 = 22
        Integer ledgerSum = stockTransactionRepository.calculateLedgerBalanceByProductIdAndBusinessId(product.getId(), testBusinessId);
        assertEquals(22, ledgerSum);
    }

    @Test
    @DisplayName("Reject sale when requested quantity exceeds available stock")
    void testInsufficientStockRejection() {
        ProductResponse product = productService.createProduct(
                new ProductRequest("CP5-SUGAR-01", "Refined Sugar 1kg", "Groceries", "kg", 5, 2, new BigDecimal("45.00"), new BigDecimal("35.00"), null));
        assertEquals(5, product.getQuantity());

        // Attempt to sell 6 units when only 5 exist
        SaleRequest saleReq = new SaleRequest(
                "Anita Desai",
                "9876543210",
                PaymentMethod.CASH,
                PaymentStatus.PAID,
                BigDecimal.ZERO,
                null,
                List.of(new SaleItemRequest(product.getId(), 6, null))
        );

        ConflictException ex = assertThrows(ConflictException.class, () -> saleService.createSale(saleReq));
        assertTrue(ex.getMessage().contains("Insufficient stock"));

        // Product stock must remain unchanged at 5
        ProductResponse productAfter = productService.getProductById(product.getId());
        assertEquals(5, productAfter.getQuantity());
    }

    @Test
    @DisplayName("Enforce atomic sequential bill numbering per business (INV-000001, INV-000002)")
    void testSequentialBillNumbering() {
        ProductResponse product = productService.createProduct(
                new ProductRequest("CP5-SOAP-01", "Bathing Soap", "Toiletries", "pcs", 50, 10, new BigDecimal("35.00"), new BigDecimal("25.00"), null));

        SaleResponse sale1 = saleService.createSale(new SaleRequest(null, null, PaymentMethod.CASH, PaymentStatus.PAID, BigDecimal.ZERO, null,
                List.of(new SaleItemRequest(product.getId(), 1, null))));

        SaleResponse sale2 = saleService.createSale(new SaleRequest(null, null, PaymentMethod.CASH, PaymentStatus.PAID, BigDecimal.ZERO, null,
                List.of(new SaleItemRequest(product.getId(), 1, null))));

        assertEquals("INV-000001", sale1.getBillNumber());
        assertEquals("INV-000002", sale2.getBillNumber());
    }

    @Test
    @DisplayName("Price snapshotting: altering product catalog price does not affect past sale bills")
    void testPriceSnapshotting() {
        ProductResponse product = productService.createProduct(
                new ProductRequest("CP5-GHEE-01", "Pure Desi Ghee 1L", "Dairy", "litre", 20, 5, new BigDecimal("600.00"), new BigDecimal("480.00"), null));

        SaleResponse sale = saleService.createSale(new SaleRequest("Customer 1", null, PaymentMethod.UPI, PaymentStatus.PAID, BigDecimal.ZERO, null,
                List.of(new SaleItemRequest(product.getId(), 2, null))));

        assertEquals(new BigDecimal("1200.00"), sale.getGrandTotal());
        assertEquals(new BigDecimal("600.00"), sale.getItems().get(0).getUnitPrice());

        // Update product catalog price to 750.00
        productService.updateProduct(product.getId(), new ProductRequest(
                "CP5-GHEE-01", "Pure Desi Ghee 1L", "Dairy", "litre", 18, 5, new BigDecimal("750.00"), new BigDecimal("550.00"), null));

        // Re-fetch sale from database and verify snapshotted price is unchanged
        SaleResponse fetchedSale = saleService.getSaleById(sale.getId());
        assertEquals(new BigDecimal("1200.00"), fetchedSale.getGrandTotal());
        assertEquals(new BigDecimal("600.00"), fetchedSale.getItems().get(0).getUnitPrice());
    }

    @Test
    @DisplayName("Discount exceeding subtotal is rejected with BadRequestException")
    void testDiscountExceedingSubtotalThrowsBadRequest() {
        ProductResponse product = productService.createProduct(
                new ProductRequest("CP5-PEN-01", "Ball Pen", "Stationery", "pcs", 100, 10, new BigDecimal("10.00"), new BigDecimal("6.00"), null));

        SaleRequest saleReq = new SaleRequest(
                null, null, PaymentMethod.CASH, PaymentStatus.PAID,
                new BigDecimal("50.00"), // discount 50 on subtotal 20 (2 * 10)
                null,
                List.of(new SaleItemRequest(product.getId(), 2, null))
        );

        assertThrows(BadRequestException.class, () -> saleService.createSale(saleReq));
    }

    @Test
    @DisplayName("Concurrent sales prevent overselling when stock is limited")
    void testConcurrentSalesOversellingPrevention() throws InterruptedException {
        // Stock of 10 items
        ProductResponse product = productService.createProduct(
                new ProductRequest("CP5-CONC-01", "Limited Edition Mug", "Kitchen", "pcs", 10, 2, new BigDecimal("200.00"), new BigDecimal("100.00"), null));

        int threadCount = 4;
        int qtyPerThread = 3; // 4 * 3 = 12 total requested, but only 10 available
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            final int idx = i;
            executor.submit(() -> {
                try {
                    TenantContext.setCurrentTenant(testBusinessId, 999L);
                    SaleRequest request = new SaleRequest(
                            "Concurrent Buyer " + idx, null, PaymentMethod.CASH, PaymentStatus.PAID, BigDecimal.ZERO, null,
                            List.of(new SaleItemRequest(product.getId(), qtyPerThread, null))
                    );
                    saleService.createSale(request);
                    successCount.incrementAndGet();
                } catch (ConflictException ex) {
                    failureCount.incrementAndGet();
                } finally {
                    TenantContext.clear();
                    latch.countDown();
                }
            });
        }

        latch.await();
        executor.shutdown();

        // Exactly 3 threads must succeed (3 * 3 = 9 units sold) and 1 must fail (10 - 9 = 1 available < 3)
        assertEquals(3, successCount.get());
        assertEquals(1, failureCount.get());

        // Remaining stock must be exactly 10 - 9 = 1
        ProductResponse finalProduct = productService.getProductById(product.getId());
        assertEquals(1, finalProduct.getQuantity());

        // Invariant check: ledger balance matches product quantity: 10 - 3 - 3 - 3 = 1
        Integer ledgerSum = stockTransactionRepository.calculateLedgerBalanceByProductIdAndBusinessId(product.getId(), testBusinessId);
        assertEquals(1, ledgerSum);
    }
}
