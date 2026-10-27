package com.stockpilot.dto;

import com.stockpilot.entity.PurchaseStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class PurchaseResponse {

    private Long id;
    private String purchaseNumber;
    private Long supplierId;
    private String supplierName;
    private String supplierInvoiceNo;
    private PurchaseStatus status;
    private BigDecimal totalAmount;
    private String notes;
    private LocalDateTime receivedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<PurchaseItemResponse> items;

    public PurchaseResponse() {
    }

    public PurchaseResponse(Long id, String purchaseNumber, Long supplierId, String supplierName, String supplierInvoiceNo, PurchaseStatus status, BigDecimal totalAmount, String notes, LocalDateTime receivedAt, LocalDateTime createdAt, LocalDateTime updatedAt, List<PurchaseItemResponse> items) {
        this.id = id;
        this.purchaseNumber = purchaseNumber;
        this.supplierId = supplierId;
        this.supplierName = supplierName;
        this.supplierInvoiceNo = supplierInvoiceNo;
        this.status = status;
        this.totalAmount = totalAmount;
        this.notes = notes;
        this.receivedAt = receivedAt;
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

    public String getPurchaseNumber() {
        return purchaseNumber;
    }

    public void setPurchaseNumber(String purchaseNumber) {
        this.purchaseNumber = purchaseNumber;
    }

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public String getSupplierInvoiceNo() {
        return supplierInvoiceNo;
    }

    public void setSupplierInvoiceNo(String supplierInvoiceNo) {
        this.supplierInvoiceNo = supplierInvoiceNo;
    }

    public PurchaseStatus getStatus() {
        return status;
    }

    public void setStatus(PurchaseStatus status) {
        this.status = status;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getReceivedAt() {
        return receivedAt;
    }

    public void setReceivedAt(LocalDateTime receivedAt) {
        this.receivedAt = receivedAt;
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

    public List<PurchaseItemResponse> getItems() {
        return items;
    }

    public void setItems(List<PurchaseItemResponse> items) {
        this.items = items;
    }
}
