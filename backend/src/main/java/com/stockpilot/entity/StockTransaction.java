package com.stockpilot.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_transactions", indexes = {
    @Index(name = "idx_stock_transactions_business_id", columnList = "business_id"),
    @Index(name = "idx_stock_transactions_product_id", columnList = "product_id"),
    @Index(name = "idx_stock_transactions_created_at", columnList = "created_at")
})
public class StockTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", length = 50, nullable = false)
    private TransactionType transactionType;

    @Column(nullable = false)
    private Integer quantity;

    @Column(length = 255)
    private String note;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "resulting_quantity")
    private Integer resultingQuantity;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public StockTransaction() {
    }

    public StockTransaction(Business business, Product product, TransactionType transactionType, Integer quantity, String note) {
        this(business, product, transactionType, quantity, note, null, null, null);
    }

    public StockTransaction(Business business, Product product, TransactionType transactionType, Integer quantity, String note, String referenceType, Long referenceId, Integer resultingQuantity) {
        this.business = business;
        this.product = product;
        this.transactionType = transactionType;
        this.quantity = quantity;
        this.note = note;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.resultingQuantity = resultingQuantity;
    }

    public StockTransaction(Product product, TransactionType transactionType, Integer quantity, String note) {
        this(product != null ? product.getBusiness() : null, product, transactionType, quantity, note);
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Business getBusiness() {
        return business;
    }

    public void setBusiness(Business business) {
        this.business = business;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
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
