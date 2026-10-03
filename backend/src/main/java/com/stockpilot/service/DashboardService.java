package com.stockpilot.service;

import com.stockpilot.dto.DashboardResponse;
import com.stockpilot.entity.Product;
import com.stockpilot.entity.StockStatus;
import com.stockpilot.repository.ProductRepository;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

    private final ProductRepository productRepository;

    public DashboardService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboardMetrics() {
        List<Product> products = productRepository.findAll();

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

        List<DashboardResponse.AttentionProduct> attentionProducts = products.stream()
                .filter(p -> p.getDerivedStatus() == StockStatus.LOW_STOCK || p.getDerivedStatus() == StockStatus.OUT_OF_STOCK)
                .sorted(Comparator.comparing(Product::getQuantity, Comparator.nullsFirst(Comparator.naturalOrder()))
                        .thenComparing(Product::getName, String.CASE_INSENSITIVE_ORDER))
                .map(p -> new DashboardResponse.AttentionProduct(
                        p.getId(),
                        p.getSku(),
                        p.getName(),
                        p.getQuantity(),
                        p.getReorderLevel(),
                        p.getDerivedStatus()
                ))
                .collect(Collectors.toList());

        return new DashboardResponse(totalProducts, totalQuantity, lowStockCount, outOfStockCount, attentionProducts);
    }
}
