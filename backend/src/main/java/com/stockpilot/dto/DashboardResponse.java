package com.stockpilot.dto;

import com.stockpilot.entity.StockStatus;
import java.math.BigDecimal;
import java.util.List;

public class DashboardResponse {

    private long totalProducts;
    private long totalQuantity;
    private long lowStockCount;
    private long outOfStockCount;
    private BigDecimal totalCostValue;
    private BigDecimal totalRetailValue;
    private long todaySalesCount;
    private BigDecimal todaySalesRevenue;
    private BigDecimal totalLifetimeSales;
    private BigDecimal totalLifetimePurchases;
    private List<AttentionProduct> attentionProducts;

    public DashboardResponse() {
    }

    public DashboardResponse(long totalProducts,
                             long totalQuantity,
                             long lowStockCount,
                             long outOfStockCount,
                             BigDecimal totalCostValue,
                             BigDecimal totalRetailValue,
                             long todaySalesCount,
                             BigDecimal todaySalesRevenue,
                             BigDecimal totalLifetimeSales,
                             BigDecimal totalLifetimePurchases,
                             List<AttentionProduct> attentionProducts) {
        this.totalProducts = totalProducts;
        this.totalQuantity = totalQuantity;
        this.lowStockCount = lowStockCount;
        this.outOfStockCount = outOfStockCount;
        this.totalCostValue = totalCostValue;
        this.totalRetailValue = totalRetailValue;
        this.todaySalesCount = todaySalesCount;
        this.todaySalesRevenue = todaySalesRevenue;
        this.totalLifetimeSales = totalLifetimeSales;
        this.totalLifetimePurchases = totalLifetimePurchases;
        this.attentionProducts = attentionProducts;
    }

    public static class AttentionProduct {
        private Long id;
        private String sku;
        private String name;
        private String unit;
        private Integer quantity;
        private Integer reorderLevel;
        private BigDecimal unitPrice;
        private BigDecimal purchasePrice;
        private StockStatus status;

        public AttentionProduct() {
        }

        public AttentionProduct(Long id, String sku, String name, String unit, Integer quantity,
                                Integer reorderLevel, BigDecimal unitPrice, BigDecimal purchasePrice, StockStatus status) {
            this.id = id;
            this.sku = sku;
            this.name = name;
            this.unit = unit;
            this.quantity = quantity;
            this.reorderLevel = reorderLevel;
            this.unitPrice = unitPrice;
            this.purchasePrice = purchasePrice;
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

        public String getUnit() {
            return unit;
        }

        public void setUnit(String unit) {
            this.unit = unit;
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

        public BigDecimal getUnitPrice() {
            return unitPrice;
        }

        public void setUnitPrice(BigDecimal unitPrice) {
            this.unitPrice = unitPrice;
        }

        public BigDecimal getPurchasePrice() {
            return purchasePrice;
        }

        public void setPurchasePrice(BigDecimal purchasePrice) {
            this.purchasePrice = purchasePrice;
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

    public BigDecimal getTotalCostValue() {
        return totalCostValue;
    }

    public void setTotalCostValue(BigDecimal totalCostValue) {
        this.totalCostValue = totalCostValue;
    }

    public BigDecimal getTotalRetailValue() {
        return totalRetailValue;
    }

    public void setTotalRetailValue(BigDecimal totalRetailValue) {
        this.totalRetailValue = totalRetailValue;
    }

    public long getTodaySalesCount() {
        return todaySalesCount;
    }

    public void setTodaySalesCount(long todaySalesCount) {
        this.todaySalesCount = todaySalesCount;
    }

    public BigDecimal getTodaySalesRevenue() {
        return todaySalesRevenue;
    }

    public void setTodaySalesRevenue(BigDecimal todaySalesRevenue) {
        this.todaySalesRevenue = todaySalesRevenue;
    }

    public BigDecimal getTotalLifetimeSales() {
        return totalLifetimeSales;
    }

    public void setTotalLifetimeSales(BigDecimal totalLifetimeSales) {
        this.totalLifetimeSales = totalLifetimeSales;
    }

    public BigDecimal getTotalLifetimePurchases() {
        return totalLifetimePurchases;
    }

    public void setTotalLifetimePurchases(BigDecimal totalLifetimePurchases) {
        this.totalLifetimePurchases = totalLifetimePurchases;
    }

    public List<AttentionProduct> getAttentionProducts() {
        return attentionProducts;
    }

    public void setAttentionProducts(List<AttentionProduct> attentionProducts) {
        this.attentionProducts = attentionProducts;
    }
}
