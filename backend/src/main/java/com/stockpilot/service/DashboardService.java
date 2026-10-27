package com.stockpilot.service;

import com.stockpilot.dto.DashboardResponse;
import com.stockpilot.entity.Product;
import com.stockpilot.entity.StockStatus;
import com.stockpilot.repository.ProductRepository;
import com.stockpilot.repository.PurchaseRepository;
import com.stockpilot.repository.SaleRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

    private final ProductRepository productRepository;
    private final SaleRepository saleRepository;
    private final PurchaseRepository purchaseRepository;

    public DashboardService(ProductRepository productRepository,
                            SaleRepository saleRepository,
                            PurchaseRepository purchaseRepository) {
        this.productRepository = productRepository;
        this.saleRepository = saleRepository;
        this.purchaseRepository = purchaseRepository;
    }

    private Long resolveBusinessId() {
        Long bid = com.stockpilot.security.TenantContext.getCurrentBusinessId();
        return bid != null ? bid : 1L;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboardMetrics() {
        Long businessId = resolveBusinessId();
        List<Product> products = productRepository.findAllByBusinessIdAndIsActiveTrueOrderByCreatedAtDesc(businessId);

        long totalProducts = products.size();
        long totalQuantity = products.stream()
                .mapToLong(p -> p.getQuantity() != null ? p.getQuantity() : 0)
                .sum();

        long lowStockCount = products.stream()
                .filter(p -> p.getDerivedStatus() == StockStatus.LOW_STOCK)
                .count();

        long outOfStockCount = products.stream()
                .filter(p -> p.getDerivedStatus() == StockStatus.OUT_OF_STOCK)
                .count();

        BigDecimal totalCostValue = products.stream()
                .map(p -> {
                    BigDecimal cost = p.getPurchasePrice() != null ? p.getPurchasePrice() : BigDecimal.ZERO;
                    long qty = p.getQuantity() != null ? p.getQuantity() : 0;
                    return cost.multiply(BigDecimal.valueOf(qty));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalRetailValue = products.stream()
                .map(p -> {
                    BigDecimal price = p.getUnitPrice() != null ? p.getUnitPrice() : BigDecimal.ZERO;
                    long qty = p.getQuantity() != null ? p.getQuantity() : 0;
                    return price.multiply(BigDecimal.valueOf(qty));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        long todaySalesCount = saleRepository.countSalesForPeriod(businessId, startOfDay, endOfDay);
        BigDecimal todaySalesRevenue = saleRepository.calculateRevenueForPeriod(businessId, startOfDay, endOfDay);
        BigDecimal totalLifetimeSales = saleRepository.calculateTotalRevenueByBusinessId(businessId);
        BigDecimal totalLifetimePurchases = purchaseRepository.calculateTotalSpendByBusinessId(businessId);

        List<DashboardResponse.AttentionProduct> attentionProducts = products.stream()
                .filter(p -> p.getDerivedStatus() == StockStatus.LOW_STOCK || p.getDerivedStatus() == StockStatus.OUT_OF_STOCK)
                .sorted(Comparator.comparing(Product::getQuantity, Comparator.nullsFirst(Comparator.naturalOrder()))
                        .thenComparing(Product::getName, String.CASE_INSENSITIVE_ORDER))
                .map(p -> new DashboardResponse.AttentionProduct(
                        p.getId(),
                        p.getSku(),
                        p.getName(),
                        p.getUnit() != null ? p.getUnit() : "pcs",
                        p.getQuantity(),
                        p.getReorderLevel(),
                        p.getUnitPrice(),
                        p.getPurchasePrice(),
                        p.getDerivedStatus()
                ))
                .collect(Collectors.toList());

        return new DashboardResponse(
                totalProducts,
                totalQuantity,
                lowStockCount,
                outOfStockCount,
                totalCostValue,
                totalRetailValue,
                todaySalesCount,
                todaySalesRevenue,
                totalLifetimeSales,
                totalLifetimePurchases,
                attentionProducts
        );
    }
}
