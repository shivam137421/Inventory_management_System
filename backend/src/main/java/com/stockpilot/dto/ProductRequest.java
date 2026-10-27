package com.stockpilot.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class ProductRequest {

    @NotBlank(message = "SKU is required")
    @Size(max = 50, message = "SKU must not exceed 50 characters")
    private String sku;

    @NotBlank(message = "Product name is required")
    @Size(max = 150, message = "Product name must not exceed 150 characters")
    private String name;

    @NotBlank(message = "Category is required")
    @Size(max = 100, message = "Category must not exceed 100 characters")
    private String category;

    @Size(max = 30, message = "Unit label must not exceed 30 characters")
    private String unit = "pcs";

    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity must be greater than or equal to 0")
    private Integer quantity;

    @NotNull(message = "Reorder level is required")
    @Min(value = 0, message = "Reorder level must be greater than or equal to 0")
    private Integer reorderLevel;

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.00", message = "Unit price must be greater than or equal to 0")
    @Digits(integer = 10, fraction = 2, message = "Unit price must have at most 2 decimal places")
    private BigDecimal unitPrice;

    @DecimalMin(value = "0.00", message = "Purchase price must be greater than or equal to 0")
    @Digits(integer = 10, fraction = 2, message = "Purchase price must have at most 2 decimal places")
    private BigDecimal purchasePrice;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    public ProductRequest() {
    }

    public ProductRequest(String sku, String name, String category, Integer quantity, Integer reorderLevel, BigDecimal unitPrice) {
        this(sku, name, category, "pcs", quantity, reorderLevel, unitPrice, null, null);
    }

    public ProductRequest(String sku, String name, String category, String unit, Integer quantity, Integer reorderLevel, BigDecimal unitPrice, BigDecimal purchasePrice, String description) {
        this.sku = sku;
        this.name = name;
        this.category = category;
        this.unit = (unit != null && !unit.trim().isEmpty()) ? unit.trim().toLowerCase() : "pcs";
        this.quantity = quantity;
        this.reorderLevel = reorderLevel;
        this.unitPrice = unitPrice;
        this.purchasePrice = purchasePrice;
        this.description = description;
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
        this.unit = (unit != null && !unit.trim().isEmpty()) ? unit.trim().toLowerCase() : "pcs";
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
}
