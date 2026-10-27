package com.stockpilot;

import com.stockpilot.dto.ProductRequest;
import com.stockpilot.dto.ProductResponse;
import com.stockpilot.dto.StockAdjustmentRequest;
import com.stockpilot.dto.StockRequest;
import com.stockpilot.entity.Business;
import com.stockpilot.entity.StockTransaction;
import com.stockpilot.entity.TransactionType;
import com.stockpilot.exception.ConflictException;
import com.stockpilot.repository.BusinessRepository;
import com.stockpilot.repository.ProductRepository;
import com.stockpilot.repository.StockTransactionRepository;
import com.stockpilot.security.TenantContext;
import com.stockpilot.service.ProductService;
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
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ProductAndLedgerTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StockTransactionRepository stockTransactionRepository;

    @Autowired
    private BusinessRepository businessRepository;

    private Long testBusinessId;

    @BeforeEach
    void setUp() {
        Business business = businessRepository.save(new Business("Test Store CP3", "123 Market St", "9876543210", "cp3@example.com", "27AAAAA0000A1Z5"));
        testBusinessId = business.getId();
        TenantContext.setCurrentTenant(testBusinessId, 999L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Create product with custom unit, purchase price, and description")
    void testCreateProductWithExtendedFields() {
        ProductRequest request = new ProductRequest(
                "CP3-WHEAT-01",
                "Organic Wheat Flour",
                "Staples",
                "kg",
                50,
                10,
                new BigDecimal("65.00"),
                new BigDecimal("48.50"),
                "Premium quality stone-ground wheat flour"
        );

        ProductResponse response = productService.createProduct(request);

        assertNotNull(response.getId());
        assertEquals("CP3-WHEAT-01", response.getSku());
        assertEquals("Organic Wheat Flour", response.getName());
        assertEquals("kg", response.getUnit());
        assertEquals(50, response.getQuantity());
        assertEquals(new BigDecimal("65.00"), response.getUnitPrice());
        assertEquals(new BigDecimal("48.50"), response.getPurchasePrice());
        assertEquals("Premium quality stone-ground wheat flour", response.getDescription());
        assertTrue(response.getIsActive());

        // Verify opening transaction has resulting quantity and audit reference
        List<StockTransaction> txs = stockTransactionRepository.findByBusinessIdAndProductIdOrderByCreatedAtDesc(testBusinessId, response.getId());
        assertEquals(1, txs.size());
        assertEquals(TransactionType.IN, txs.get(0).getTransactionType());
        assertEquals(50, txs.get(0).getQuantity());
        assertEquals("INITIAL", txs.get(0).getReferenceType());
        assertEquals(50, txs.get(0).getResultingQuantity());
    }

    @Test
    @DisplayName("Manual stock adjustments: positive (+15) and negative (-10) update balance and ledger")
    void testManualStockAdjustments() {
        ProductRequest request = new ProductRequest(
                "CP3-MILK-01",
                "Toned Milk",
                "Dairy",
                "litre",
                20,
                5,
                new BigDecimal("60.00"),
                new BigDecimal("50.00"),
                "Fresh daily milk"
        );
        ProductResponse product = productService.createProduct(request);

        // Adjust +15 units (found extra crate)
        StockAdjustmentRequest addAdj = new StockAdjustmentRequest(15, "Found extra crate in cold storage");
        ProductResponse afterAdd = productService.adjustStock(product.getId(), addAdj);
        assertEquals(35, afterAdd.getQuantity());

        // Adjust -10 units (damaged packaging)
        StockAdjustmentRequest subAdj = new StockAdjustmentRequest(-10, "Damaged packaging leak");
        ProductResponse afterSub = productService.adjustStock(product.getId(), subAdj);
        assertEquals(25, afterSub.getQuantity());

        // Verify ledger transactions
        List<StockTransaction> txs = stockTransactionRepository.findByBusinessIdAndProductIdOrderByCreatedAtDesc(testBusinessId, product.getId());
        assertEquals(3, txs.size());

        // Most recent should be ADJUSTMENT_OUT
        StockTransaction latest = txs.get(0);
        assertEquals(TransactionType.ADJUSTMENT_OUT, latest.getTransactionType());
        assertEquals(10, latest.getQuantity());
        assertEquals(25, latest.getResultingQuantity());
        assertEquals("MANUAL_ADJUSTMENT", latest.getReferenceType());
        assertEquals("Damaged packaging leak", latest.getNote());

        // Second should be ADJUSTMENT_IN
        StockTransaction middle = txs.get(1);
        assertEquals(TransactionType.ADJUSTMENT_IN, middle.getTransactionType());
        assertEquals(15, middle.getQuantity());
        assertEquals(35, middle.getResultingQuantity());

        // Ledger balance calculation matches product quantity: 20 + 15 - 10 = 25
        Integer balance = stockTransactionRepository.calculateLedgerBalanceByProductIdAndBusinessId(product.getId(), testBusinessId);
        assertEquals(25, balance);
        assertEquals(afterSub.getQuantity(), balance);
    }

    @Test
    @DisplayName("Negative adjustment exceeding available stock is rejected with ConflictException")
    void testAdjustmentExceedingStockThrowsConflict() {
        ProductRequest request = new ProductRequest(
                "CP3-OIL-01",
                "Sunflower Oil",
                "Oils",
                "litre",
                5,
                2,
                new BigDecimal("140.00"),
                new BigDecimal("115.00"),
                "Refined sunflower oil"
        );
        ProductResponse product = productService.createProduct(request);

        StockAdjustmentRequest overSub = new StockAdjustmentRequest(-10, "Spoilage");
        assertThrows(ConflictException.class, () -> productService.adjustStock(product.getId(), overSub));

        // Ensure stock untouched
        ProductResponse current = productService.getProductById(product.getId());
        assertEquals(5, current.getQuantity());
    }

    @Test
    @DisplayName("Zero quantity change adjustment is rejected with ConflictException")
    void testZeroAdjustmentThrowsConflict() {
        ProductRequest request = new ProductRequest(
                "CP3-ZERO-01",
                "Product Zero",
                "General",
                "pcs",
                10,
                2,
                new BigDecimal("10.00"),
                new BigDecimal("8.00"),
                null
        );
        ProductResponse product = productService.createProduct(request);

        StockAdjustmentRequest zeroAdj = new StockAdjustmentRequest(0, "Nothing changed");
        assertThrows(ConflictException.class, () -> productService.adjustStock(product.getId(), zeroAdj));
    }

    @Test
    @DisplayName("Deleting product with stock history triggers soft deactivation (isActive=false)")
    void testSoftDeactivationWhenHistoryExists() {
        ProductRequest request = new ProductRequest(
                "CP3-RICE-01",
                "Sona Masoori Rice",
                "Grains",
                "kg",
                10,
                2,
                new BigDecimal("70.00"),
                new BigDecimal("55.00"),
                "Premium rice"
        );
        ProductResponse product = productService.createProduct(request);

        // Delete product
        productService.deleteProduct(product.getId());

        // Product still exists in DB but is deactivated
        ProductResponse fetched = productService.getProductById(product.getId());
        assertFalse(fetched.getIsActive());
    }

    @Test
    @DisplayName("Deleting product with zero history performs hard delete")
    void testHardDeleteWhenZeroHistory() {
        // Create product with quantity = 0 (no opening transaction created)
        ProductRequest request = new ProductRequest(
                "CP3-ZERO-HIST",
                "Zero History Item",
                "General",
                "pcs",
                0,
                2,
                new BigDecimal("10.00"),
                new BigDecimal("8.00"),
                null
        );
        ProductResponse product = productService.createProduct(request);
        assertEquals(0, stockTransactionRepository.countByProductId(product.getId()));

        productService.deleteProduct(product.getId());

        assertThrows(Exception.class, () -> productService.getProductById(product.getId()));
    }

    @Test
    @DisplayName("Tenant isolation: Product and ledger transactions are isolated between businesses")
    void testTenantIsolation() {
        ProductRequest request = new ProductRequest(
                "CP3-ISOLATE-01",
                "Tenant A Soap",
                "Personal Care",
                "piece",
                30,
                5,
                new BigDecimal("45.00"),
                new BigDecimal("35.00"),
                null
        );
        ProductResponse productA = productService.createProduct(request);

        // Switch to Tenant B
        Business businessB = businessRepository.save(new Business("Business B", "456 Other Rd", "9876543211", "tenantb@example.com", null));
        TenantContext.setCurrentTenant(businessB.getId(), 1000L);

        // Tenant B cannot see product A
        assertThrows(Exception.class, () -> productService.getProductById(productA.getId()));

        // Tenant B's product list is empty
        List<ProductResponse> tenantBProducts = productService.getAllProducts();
        assertTrue(tenantBProducts.stream().noneMatch(p -> p.getSku().equals("CP3-ISOLATE-01")));

        // Tenant B can create product with same SKU without conflict
        ProductRequest requestB = new ProductRequest(
                "CP3-ISOLATE-01",
                "Tenant B Soap",
                "Personal Care",
                "piece",
                15,
                3,
                new BigDecimal("48.00"),
                new BigDecimal("38.00"),
                null
        );
        ProductResponse productB = productService.createProduct(requestB);
        assertEquals("CP3-ISOLATE-01", productB.getSku());
        assertEquals(15, productB.getQuantity());
    }
}
