package com.stockpilot.dto;

import com.stockpilot.entity.PaymentMethod;
import com.stockpilot.entity.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class SaleResponse {

    private Long id;
    private String billNumber;
    private String customerName;
    private String customerPhone;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private BigDecimal subtotal;
    private BigDecimal discount;
    private BigDecimal grandTotal;
    private String notes;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<SaleItemResponse> items;

    public SaleResponse() {
    }

    public SaleResponse(Long id, String billNumber, String customerName, String customerPhone, PaymentMethod paymentMethod, PaymentStatus paymentStatus, BigDecimal subtotal, BigDecimal discount, BigDecimal grandTotal, String notes, Long createdBy, LocalDateTime createdAt, LocalDateTime updatedAt, List<SaleItemResponse> items) {
        this.id = id;
        this.billNumber = billNumber;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = paymentStatus;
        this.subtotal = subtotal;
        this.discount = discount;
        this.grandTotal = grandTotal;
        this.notes = notes;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.items = items;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBillNumber() {
        return billNumber;
    }

    public void setBillNumber(String billNumber) {
        this.billNumber = billNumber;
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

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getDiscount() {
        return discount;
    }

    public void setDiscount(BigDecimal discount) {
        this.discount = discount;
    }

    public BigDecimal getGrandTotal() {
        return grandTotal;
    }

    public void setGrandTotal(BigDecimal grandTotal) {
        this.grandTotal = grandTotal;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
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

    public List<SaleItemResponse> getItems() {
        return items;
    }

    public void setItems(List<SaleItemResponse> items) {
        this.items = items;
    }
}
