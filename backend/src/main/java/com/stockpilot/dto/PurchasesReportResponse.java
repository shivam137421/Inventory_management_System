package com.stockpilot.dto;

import java.math.BigDecimal;
import java.util.List;

public class PurchasesReportResponse {

    private long totalPurchasesCount;
    private BigDecimal totalSpend;
    private List<PurchaseResponse> purchases;

    public PurchasesReportResponse() {
    }

    public PurchasesReportResponse(long totalPurchasesCount, BigDecimal totalSpend, List<PurchaseResponse> purchases) {
        this.totalPurchasesCount = totalPurchasesCount;
        this.totalSpend = totalSpend;
        this.purchases = purchases;
    }

    public long getTotalPurchasesCount() {
        return totalPurchasesCount;
    }

    public void setTotalPurchasesCount(long totalPurchasesCount) {
        this.totalPurchasesCount = totalPurchasesCount;
    }

    public BigDecimal getTotalSpend() {
        return totalSpend;
    }

    public void setTotalSpend(BigDecimal totalSpend) {
        this.totalSpend = totalSpend;
    }

    public List<PurchaseResponse> getPurchases() {
        return purchases;
    }

    public void setPurchases(List<PurchaseResponse> purchases) {
        this.purchases = purchases;
    }
}
