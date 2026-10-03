package com.stockpilot.dto;

import com.stockpilot.entity.StockStatus;
import java.util.List;

public class DashboardResponse {

    private long totalProducts;
    private long totalQuantity;
    private long lowStockCount;
    private long outOfStockCount;
    private List<AttentionProduct> attentionProducts;

    public DashboardResponse() {
    }

    public DashboardResponse(long totalProducts, long totalQuantity, long lowStockCount, long outOfStockCount, List<AttentionProduct> attentionProducts) {
        this.totalProducts = totalProducts;
        this.totalQuantity = totalQuantity;
        this.lowStockCount = lowStockCount;
        this.outOfStockCount = outOfStockCount;
        this.attentionProducts = attentionProducts;
    }

    public static class AttentionProduct {
        private Long id;
        private String sku;
        private String name;
        private Integer quantity;
        private Integer reorderLevel;
        private StockStatus status;

        public AttentionProduct() {
        }

        public AttentionProduct(Long id, String sku, String name, Integer quantity, Integer reorderLevel, StockStatus status) {
            this.id = id;
            this.sku = sku;
            this.name = name;
            this.quantity = quantity;
            this.reorderLevel = reorderLevel;
            this.status = status;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getSku() {
            return sku;
        }

        public void setSku(String sku) {
            this.sku = sku;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        public Integer getReorderLevel() {
            return reorderLevel;
        }

        public void setReorderLevel(Integer reorderLevel) {
            this.reorderLevel = reorderLevel;
        }

        public StockStatus getStatus() {
            return status;
        }

        public void setStatus(StockStatus status) {
            this.status = status;
        }
    }

    public long getTotalProducts() {
        return totalProducts;
    }

    public void setTotalProducts(long totalProducts) {
        this.totalProducts = totalProducts;
    }

    public long getTotalQuantity() {
        return totalQuantity;
    }

    public void setTotalQuantity(long totalQuantity) {
        this.totalQuantity = totalQuantity;
    }

    public long getLowStockCount() {
        return lowStockCount;
    }

    public void setLowStockCount(long lowStockCount) {
        this.lowStockCount = lowStockCount;
    }

    public long getOutOfStockCount() {
        return outOfStockCount;
    }

    public void setOutOfStockCount(long outOfStockCount) {
        this.outOfStockCount = outOfStockCount;
    }

    public List<AttentionProduct> getAttentionProducts() {
        return attentionProducts;
    }

    public void setAttentionProducts(List<AttentionProduct> attentionProducts) {
        this.attentionProducts = attentionProducts;
    }
}
