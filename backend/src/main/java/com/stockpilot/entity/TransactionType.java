package com.stockpilot.entity;

public enum TransactionType {
    OPENING,
    PURCHASE_RECEIPT,
    SALE,
    ADJUSTMENT_IN,
    ADJUSTMENT_OUT,
    IN,  // Legacy baseline
    OUT; // Legacy baseline

    public boolean isInflow() {
        return this == OPENING || this == PURCHASE_RECEIPT || this == ADJUSTMENT_IN || this == IN;
    }

    public boolean isOutflow() {
        return this == SALE || this == ADJUSTMENT_OUT || this == OUT;
    }
}
