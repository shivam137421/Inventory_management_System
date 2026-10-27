package com.stockpilot.dto;

import com.stockpilot.entity.PaymentMethod;
import com.stockpilot.entity.PaymentStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public class SaleRequest {

    @Size(max = 150, message = "Customer name must not exceed 150 characters")
    private String customerName;

    @Size(max = 20, message = "Customer phone must not exceed 20 characters")
    private String customerPhone;

    private PaymentMethod paymentMethod = PaymentMethod.CASH;

    private PaymentStatus paymentStatus = PaymentStatus.PAID;

    @DecimalMin(value = "0.00", message = "Discount must be >= 0")
    @Digits(integer = 10, fraction = 2, message = "Discount must have at most 2 decimal places")
    private BigDecimal discount = BigDecimal.ZERO;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;

    @NotEmpty(message = "Sale must contain at least one item")
    @Valid
    private List<SaleItemRequest> items;

    public SaleRequest() {
    }

    public SaleRequest(String customerName, String customerPhone, PaymentMethod paymentMethod, PaymentStatus paymentStatus, BigDecimal discount, String notes, List<SaleItemRequest> items) {
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.paymentMethod = paymentMethod != null ? paymentMethod : PaymentMethod.CASH;
        this.paymentStatus = paymentStatus != null ? paymentStatus : PaymentStatus.PAID;
        this.discount = discount != null ? discount : BigDecimal.ZERO;
        this.notes = notes;
        this.items = items;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public BigDecimal getDiscount() {
        return discount;
    }

    public void setDiscount(BigDecimal discount) {
        this.discount = discount;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<SaleItemRequest> getItems() {
        return items;
    }

    public void setItems(List<SaleItemRequest> items) {
        this.items = items;
    }
}
