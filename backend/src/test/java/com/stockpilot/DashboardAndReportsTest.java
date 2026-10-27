package com.stockpilot;

import com.stockpilot.dto.DashboardResponse;
import com.stockpilot.dto.ProductRequest;
import com.stockpilot.dto.ProductResponse;
import com.stockpilot.dto.PurchaseItemRequest;
import com.stockpilot.dto.PurchaseRequest;
import com.stockpilot.dto.PurchaseResponse;
import com.stockpilot.dto.PurchasesReportResponse;
import com.stockpilot.dto.SaleRequest;
import com.stockpilot.dto.SaleItemRequest;
import com.stockpilot.dto.SalesReportResponse;
import com.stockpilot.dto.SupplierRequest;
import com.stockpilot.dto.SupplierResponse;
import com.stockpilot.dto.TransactionResponse;
import com.stockpilot.entity.Business;
import com.stockpilot.entity.PaymentMethod;
import com.stockpilot.entity.PaymentStatus;
import com.stockpilot.entity.Product;
import com.stockpilot.entity.PurchaseStatus;
import com.stockpilot.entity.StockStatus;
import com.stockpilot.entity.StockTransaction;
import com.stockpilot.entity.TransactionType;
import com.stockpilot.repository.BusinessRepository;
import com.stockpilot.repository.ProductRepository;
import com.stockpilot.repository.StockTransactionRepository;
import com.stockpilot.security.TenantContext;
import com.stockpilot.service.DashboardService;
import com.stockpilot.service.ProductService;
import com.stockpilot.service.PurchaseService;
import com.stockpilot.service.ReportService;
import com.stockpilot.service.SaleService;
import com.stockpilot.service.StockTransactionService;
import com.stockpilot.service.SupplierService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class DashboardAndReportsTest {

    @Autowired
    private BusinessRepository businessRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StockTransactionRepository stockTransactionRepository;

    @Autowired
    private ProductService productService;

    @Autowired
    private SupplierService supplierService;

    @Autowired
    private PurchaseService purchaseService;

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private StockTransactionService stockTransactionService;

    @Autowired
    private ReportService reportService;

    @Autowired
    private SaleService saleService;

    private Business testBusiness;

    @BeforeEach
    void setUp() {
        testBusiness = new Business("Dashboard Test Enterprise", "Delhi", "9998887776", "owner@dash.example.com", "07AAAAA0000A1Z5");
        testBusiness = businessRepository.save(testBusiness);
        TenantContext.setCurrentTenant(testBusiness.getId(), 999L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("DASH-01: Verify accurate stock counts and valuation calculations")
    void testDashboardStockAndValuationMetrics() {
        productService.createProduct(new ProductRequest(
                "DASH-P1", "Product One", "General", "pcs", 20, 10,
                new BigDecimal("100.00"), new BigDecimal("80.00"), "P1 Desc"));

        productService.createProduct(new ProductRequest(
                "DASH-P2", "Product Two", "General", "kg", 10, 5,
                new BigDecimal("50.00"), new BigDecimal("30.00"), "P2 Desc"));

        DashboardResponse metrics = dashboardService.getDashboardMetrics();

        assertEquals(2, metrics.getTotalProducts());
        assertEquals(30, metrics.getTotalQuantity()); // 20 + 10
        assertEquals(0, metrics.getLowStockCount());
        assertEquals(0, metrics.getOutOfStockCount());

        // Cost valuation: (20 * 80) + (10 * 30) = 1600 + 300 = 1900.00
        assertEquals(0, new BigDecimal("1900.00").compareTo(metrics.getTotalCostValue()));

        // Retail valuation: (20 * 100) + (10 * 50) = 2000 + 500 = 2500.00
        assertEquals(0, new BigDecimal("2500.00").compareTo(metrics.getTotalRetailValue()));
    }

    @Test
    @DisplayName("DASH-02 & DASH-03: Verify dynamic low stock and out-of-stock alerts")
    void testLowStockAndOutOfStockAlerts() {
        // Normal in stock
        productService.createProduct(new ProductRequest(
                "ALERT-GOOD", "Good Item", "Groceries", "pcs", 50, 10,
                new BigDecimal("40.00"), new BigDecimal("30.00"), null));

        // Low stock (quantity <= reorderLevel)
        productService.createProduct(new ProductRequest(
                "ALERT-LOW", "Low Stock Item", "Groceries", "pcs", 6, 10,
                new BigDecimal("40.00"), new BigDecimal("30.00"), null));

        // Out of stock (quantity == 0)
        productService.createProduct(new ProductRequest(
                "ALERT-OUT", "Out of Stock Item", "Groceries", "pcs", 0, 10,
                new BigDecimal("40.00"), new BigDecimal("30.00"), null));

        DashboardResponse metrics = dashboardService.getDashboardMetrics();

        assertEquals(3, metrics.getTotalProducts());
        assertEquals(56, metrics.getTotalQuantity());
        assertEquals(1, metrics.getLowStockCount());
        assertEquals(1, metrics.getOutOfStockCount());

        // Attention list must contain 2 items: Out of stock (0) first, then Low stock (6)
        assertEquals(2, metrics.getAttentionProducts().size());

        DashboardResponse.AttentionProduct firstAlert = metrics.getAttentionProducts().get(0);
        assertEquals("ALERT-OUT", firstAlert.getSku());
        assertEquals(StockStatus.OUT_OF_STOCK, firstAlert.getStatus());
        assertEquals(0, firstAlert.getQuantity());

        DashboardResponse.AttentionProduct secondAlert = metrics.getAttentionProducts().get(1);
        assertEquals("ALERT-LOW", secondAlert.getSku());
        assertEquals(StockStatus.LOW_STOCK, secondAlert.getStatus());
        assertEquals(6, secondAlert.getQuantity());
    }

    @Test
    @DisplayName("REP-01: Verify Stock Ledger Audit report filtering by date and product")
    void testStockLedgerDateAndProductFiltering() {
        Product prodA = new Product(testBusiness, "LEDGER-A", "Item A", "Stationery", "pcs", 25, 5,
                new BigDecimal("20.00"), new BigDecimal("12.00"), null, true);
        Product prodB = new Product(testBusiness, "LEDGER-B", "Item B", "Stationery", "pcs", 40, 10,
                new BigDecimal("35.00"), new BigDecimal("22.00"), null, true);
        prodA = productRepository.save(prodA);
        prodB = productRepository.save(prodB);

        StockTransaction txA = new StockTransaction(testBusiness, prodA, TransactionType.OPENING,
                25, "Initial Opening A", "INITIAL", null, 25);
        StockTransaction txB = new StockTransaction(testBusiness, prodB, TransactionType.OPENING,
                40, "Initial Opening B", "INITIAL", null, 40);
        stockTransactionRepository.saveAll(List.of(txA, txB));

        // Filter by Product A only
        List<TransactionResponse> filteredA = stockTransactionService.getTransactions(null, prodA.getId());
        assertEquals(1, filteredA.size());
        assertEquals("LEDGER-A", filteredA.get(0).getSku());

        // Filter by Type OPENING
        List<TransactionResponse> filteredType = stockTransactionService.getTransactions(TransactionType.OPENING, null);
        assertEquals(2, filteredType.size());

        // Date range filter including now
        LocalDateTime start = LocalDateTime.now().minusHours(1);
        LocalDateTime end = LocalDateTime.now().plusHours(1);
        List<TransactionResponse> filteredDate = stockTransactionService.getTransactions(null, null, start, end);
        assertEquals(2, filteredDate.size());

        // Past date range returning empty
        List<TransactionResponse> pastDate = stockTransactionService.getTransactions(
                null, null, LocalDateTime.now().minusDays(5), LocalDateTime.now().minusDays(4));
        assertEquals(0, pastDate.size());
    }

    @Test
    @DisplayName("REP-02: Verify Sales Report aggregation and filtering by payment method")
    void testSalesReportWithDateAndPaymentFiltering() {
        ProductResponse prod = productService.createProduct(new ProductRequest(
                "SALE-REP-1", "Snack Pack", "FMCG", "pcs", 100, 10,
                new BigDecimal("50.00"), new BigDecimal("35.00"), null));

        // Sale 1: CASH, ₹100
        SaleRequest req1 = new SaleRequest("Walk-in", null, PaymentMethod.CASH, PaymentStatus.PAID,
                BigDecimal.ZERO, "Cash sale", List.of(new SaleItemRequest(prod.getId(), 2, new BigDecimal("50.00"))));
        saleService.createSale(req1);

        // Sale 2: UPI, ₹150 with ₹10 discount = ₹140
        SaleRequest req2 = new SaleRequest("Vikram", "9876543210", PaymentMethod.UPI, PaymentStatus.PAID,
                new BigDecimal("10.00"), "UPI sale", List.of(new SaleItemRequest(prod.getId(), 3, new BigDecimal("50.00"))));
        saleService.createSale(req2);

        // All sales report
        SalesReportResponse allReport = reportService.getSalesReport(null, null, null, null);
        assertEquals(2, allReport.getTotalSalesCount());
        assertEquals(5, allReport.getTotalUnitsSold()); // 2 + 3
        assertEquals(0, new BigDecimal("250.00").compareTo(allReport.getTotalSubtotal()));
        assertEquals(0, new BigDecimal("10.00").compareTo(allReport.getTotalDiscount()));
        assertEquals(0, new BigDecimal("240.00").compareTo(allReport.getTotalGrandTotal()));

        // Filter by UPI only
        SalesReportResponse upiReport = reportService.getSalesReport(null, null, PaymentMethod.UPI, null);
        assertEquals(1, upiReport.getTotalSalesCount());
        assertEquals(3, upiReport.getTotalUnitsSold());
        assertEquals(0, new BigDecimal("140.00").compareTo(upiReport.getTotalGrandTotal()));

        // Filter by CASH only
        SalesReportResponse cashReport = reportService.getSalesReport(null, null, PaymentMethod.CASH, null);
        assertEquals(1, cashReport.getTotalSalesCount());
        assertEquals(2, cashReport.getTotalUnitsSold());
        assertEquals(0, new BigDecimal("100.00").compareTo(cashReport.getTotalGrandTotal()));
    }

    @Test
    @DisplayName("REP-02: Verify Purchases Report aggregation and filtering")
    void testPurchasesReportWithFiltering() {
        SupplierResponse supplier = supplierService.createSupplier(
                new SupplierRequest("Metro Wholesalers", "Amit", "9991112223", "metro@example.com", "Noida", null));

        ProductResponse prod = productService.createProduct(new ProductRequest(
                "PUR-REP-P1", "Bulk Sugar", "Groceries", "kg", 0, 10,
                new BigDecimal("45.00"), new BigDecimal("35.00"), null));

        // Purchase 1: 50 units @ 35 = 1750, then RECEIVED
        PurchaseRequest pReq1 = new PurchaseRequest(
                supplier.getId(), "INV-101", null,
                List.of(new PurchaseItemRequest(prod.getId(), 50, new BigDecimal("35.00"))));
        PurchaseResponse p1 = purchaseService.createPurchase(pReq1);
        purchaseService.receivePurchase(p1.getId());

        // Purchase 2: 20 units @ 35 = 700, left in DRAFT
        PurchaseRequest pReq2 = new PurchaseRequest(
                supplier.getId(), "INV-102", null,
                List.of(new PurchaseItemRequest(prod.getId(), 20, new BigDecimal("35.00"))));
        purchaseService.createPurchase(pReq2);

        // Report without filter
        PurchasesReportResponse report = reportService.getPurchasesReport(null, null, null, null);
        assertEquals(2, report.getTotalPurchasesCount());
        // Only RECEIVED orders count toward spend: ₹1,750.00
        assertEquals(0, new BigDecimal("1750.00").compareTo(report.getTotalSpend()));

        // Filter by DRAFT
        PurchasesReportResponse draftReport = reportService.getPurchasesReport(null, null, null, PurchaseStatus.DRAFT);
        assertEquals(1, draftReport.getTotalPurchasesCount());
        assertEquals(0, BigDecimal.ZERO.compareTo(draftReport.getTotalSpend()));
    }
}
