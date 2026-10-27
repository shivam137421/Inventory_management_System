package com.stockpilot.dto;

import com.stockpilot.entity.StockStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ProductResponse {

    private Long id;
    private String sku;
    private String name;
    private String category;
    private String unit;
    private Integer quantity;
    private Integer reorderLevel;
    private BigDecimal unitPrice;
    private BigDecimal purchasePrice;
    private String description;
    private Boolean isActive;
    private StockStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ProductResponse() {
    }

    public ProductResponse(Long id, String sku, String name, String category, Integer quantity, Integer reorderLevel, BigDecimal unitPrice, StockStatus status, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this(id, sku, name, category, "pcs", quantity, reorderLevel, unitPrice, null, null, true, status, createdAt, updatedAt);
    }

    public ProductResponse(Long id, String sku, String name, String category, String unit, Integer quantity, Integer reorderLevel, BigDecimal unitPrice, BigDecimal purchasePrice, String description, Boolean isActive, StockStatus status, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.sku = sku;
        this.name = name;
        this.category = category;
        this.unit = unit != null ? unit : "pcs";
        this.quantity = quantity;
        this.reorderLevel = reorderLevel;
        this.unitPrice = unitPrice;
        this.purchasePrice = purchasePrice;
        this.description = description;
        this.isActive = isActive != null ? isActive : true;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public StockStatus getStatus() {
        return status;
    }

    public void setStatus(StockStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
