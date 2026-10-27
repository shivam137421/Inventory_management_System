package com.stockpilot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class StockAdjustmentRequest {

    @NotNull(message = "Quantity change is required")
    private Integer quantityChange;

    @NotBlank(message = "Reason/note is required for manual stock adjustment")
    @Size(max = 255, message = "Reason cannot exceed 255 characters")
    private String reason;

    public StockAdjustmentRequest() {
    }

    public StockAdjustmentRequest(Integer quantityChange, String reason) {
        this.quantityChange = quantityChange;
        this.reason = reason;
    }

    public Integer getQuantityChange() {
        return quantityChange;
    }

    public void setQuantityChange(Integer quantityChange) {
        this.quantityChange = quantityChange;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
