package com.stockpilot.dto;

import com.stockpilot.entity.TransactionType;
import java.time.LocalDateTime;

public class TransactionResponse {

    private Long id;
    private Long productId;
    private String productName;
    private String sku;
    private TransactionType transactionType;
    private Integer quantity;
    private String note;
    private String referenceType;
    private Long referenceId;
    private Integer resultingQuantity;
    private LocalDateTime createdAt;

    public TransactionResponse() {
    }

    public TransactionResponse(Long id, Long productId, String productName, String sku, TransactionType transactionType, Integer quantity, String note, LocalDateTime createdAt) {
        this(id, productId, productName, sku, transactionType, quantity, note, null, null, null, createdAt);
    }

    public TransactionResponse(Long id, Long productId, String productName, String sku, TransactionType transactionType, Integer quantity, String note, String referenceType, Long referenceId, Integer resultingQuantity, LocalDateTime createdAt) {
        this.id = id;
        this.productId = productId;
        this.productName = productName;
        this.sku = sku;
        this.transactionType = transactionType;
        this.quantity = quantity;
        this.note = note;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.resultingQuantity = resultingQuantity;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public TransactionType getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(TransactionType transactionType) {
        this.transactionType = transactionType;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getReferenceType() {
        return referenceType;
    }

    public void setReferenceType(String referenceType) {
        this.referenceType = referenceType;
    }

    public Long getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(Long referenceId) {
        this.referenceId = referenceId;
    }

    public Integer getResultingQuantity() {
        return resultingQuantity;
    }

    public void setResultingQuantity(Integer resultingQuantity) {
        this.resultingQuantity = resultingQuantity;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
