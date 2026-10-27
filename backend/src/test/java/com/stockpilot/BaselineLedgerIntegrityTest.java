package com.stockpilot;

import com.stockpilot.dto.ProductRequest;
import com.stockpilot.dto.ProductResponse;
import com.stockpilot.dto.StockRequest;
import com.stockpilot.entity.StockStatus;
import com.stockpilot.entity.StockTransaction;
import com.stockpilot.entity.TransactionType;
import com.stockpilot.exception.ConflictException;
import com.stockpilot.repository.StockTransactionRepository;
import com.stockpilot.service.ProductService;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BaselineLedgerIntegrityTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private StockTransactionRepository stockTransactionRepository;

    @Test
    @DisplayName("Product creation with initial quantity creates an audited IN transaction")
    void testProductCreationWithOpeningStock() {
        ProductRequest request = new ProductRequest("TEST-SKU-001", "Basmati Rice 5kg", "Grains", 20, 5, new BigDecimal("450.00"));
        ProductResponse response = productService.createProduct(request);

        assertNotNull(response.getId());
        assertEquals("TEST-SKU-001", response.getSku());
        assertEquals(20, response.getQuantity());
        assertEquals(StockStatus.IN_STOCK, response.getStatus());

        List<StockTransaction> txs = stockTransactionRepository.findByProductIdOrderByCreatedAtDesc(response.getId());
        assertEquals(1, txs.size());
        assertEquals(TransactionType.IN, txs.get(0).getTransactionType());
        assertEquals(20, txs.get(0).getQuantity());
        assertEquals("Opening stock", txs.get(0).getNote());
    }

    @Test
    @DisplayName("Stock movements maintain ledger invariant: sum(movements) == product.quantity")
    void testStockMovementsAndLedgerInvariant() {
        ProductRequest request = new ProductRequest("TEST-SKU-002", "Mustard Oil 1L", "Oils", 10, 5, new BigDecimal("180.00"));
        ProductResponse product = productService.createProduct(request);

        // Stock In 15 units
        StockRequest inReq = new StockRequest();
        inReq.setQuantity(15);
        inReq.setNote("Received supplier delivery");
        productService.stockIn(product.getId(), inReq);

        // Stock Out 8 units
        StockRequest outReq = new StockRequest();
        outReq.setQuantity(8);
        outReq.setNote("Sold to customer");
        productService.stockOut(product.getId(), outReq);

        // Fetch fresh product and verify quantity: 10 + 15 - 8 = 17
        ProductResponse updated = productService.getProductById(product.getId());
        assertEquals(17, updated.getQuantity());

        // Assert ledger sum invariant
        List<StockTransaction> txs = stockTransactionRepository.findByProductIdOrderByCreatedAtDesc(product.getId());
        assertEquals(3, txs.size());

        int computedLedgerSum = txs.stream()
                .mapToInt(t -> t.getTransactionType() == TransactionType.IN ? t.getQuantity() : -t.getQuantity())
                .sum();

        assertEquals(updated.getQuantity(), computedLedgerSum, "Sum of ledger transactions must equal product quantity");
    }

    @Test
    @DisplayName("Stock out exceeding available inventory must be rejected with ConflictException")
    void testStockOutExceedingQuantityThrowsConflict() {
        ProductRequest request = new ProductRequest("TEST-SKU-003", "Tata Salt 1kg", "Spices", 5, 2, new BigDecimal("28.00"));
        ProductResponse product = productService.createProduct(request);

        StockRequest outReq = new StockRequest();
        outReq.setQuantity(10); // Available is only 5
        outReq.setNote("Attempting to over-deduct");

        assertThrows(ConflictException.class, () -> productService.stockOut(product.getId(), outReq));

        // Ensure stock remains untouched
        ProductResponse unchanged = productService.getProductById(product.getId());
        assertEquals(5, unchanged.getQuantity());
    }

    @Test
    @DisplayName("Derived stock status transitions correctly: IN_STOCK -> LOW_STOCK -> OUT_OF_STOCK")
    void testDerivedStockStatusTransitions() {
        ProductRequest request = new ProductRequest("TEST-SKU-004", "Maggi 4-Pack", "Packaged Food", 10, 4, new BigDecimal("60.00"));
        ProductResponse product = productService.createProduct(request);
        assertEquals(StockStatus.IN_STOCK, product.getStatus());

        // Reduce to 4 (threshold is 4) -> LOW_STOCK
        StockRequest outToLow = new StockRequest();
        outToLow.setQuantity(6);
        ProductResponse lowProduct = productService.stockOut(product.getId(), outToLow);
        assertEquals(StockStatus.LOW_STOCK, lowProduct.getStatus());

        // Reduce to 0 -> OUT_OF_STOCK
        StockRequest outToZero = new StockRequest();
        outToZero.setQuantity(4);
        ProductResponse outProduct = productService.stockOut(product.getId(), outToZero);
        assertEquals(StockStatus.OUT_OF_STOCK, outProduct.getStatus());
    }
}
