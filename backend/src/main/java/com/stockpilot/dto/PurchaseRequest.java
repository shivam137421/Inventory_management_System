package com.stockpilot.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public class PurchaseRequest {

    @NotNull(message = "Supplier ID is required")
    private Long supplierId;

    @Size(max = 100, message = "Supplier invoice number must not exceed 100 characters")
    private String supplierInvoiceNo;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;

    @NotEmpty(message = "Purchase must contain at least one item")
    @Valid
    private List<PurchaseItemRequest> items;

    public PurchaseRequest() {
    }

    public PurchaseRequest(Long supplierId, String supplierInvoiceNo, String notes, List<PurchaseItemRequest> items) {
        this.supplierId = supplierId;
        this.supplierInvoiceNo = supplierInvoiceNo;
        this.notes = notes;
        this.items = items;
    }

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public String getSupplierInvoiceNo() {
        return supplierInvoiceNo;
    }

    public void setSupplierInvoiceNo(String supplierInvoiceNo) {
        this.supplierInvoiceNo = supplierInvoiceNo;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<PurchaseItemRequest> getItems() {
        return items;
    }

    public void setItems(List<PurchaseItemRequest> items) {
        this.items = items;
    }
}
