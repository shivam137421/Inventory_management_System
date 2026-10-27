package com.stockpilot.dto;

import java.math.BigDecimal;
import java.util.List;

public class SalesReportResponse {

    private long totalSalesCount;
    private long totalUnitsSold;
    private BigDecimal totalSubtotal;
    private BigDecimal totalDiscount;
    private BigDecimal totalGrandTotal;
    private List<SaleResponse> sales;

    public SalesReportResponse() {
    }

    public SalesReportResponse(long totalSalesCount,
                               long totalUnitsSold,
                               BigDecimal totalSubtotal,
                               BigDecimal totalDiscount,
                               BigDecimal totalGrandTotal,
                               List<SaleResponse> sales) {
        this.totalSalesCount = totalSalesCount;
        this.totalUnitsSold = totalUnitsSold;
        this.totalSubtotal = totalSubtotal;
        this.totalDiscount = totalDiscount;
        this.totalGrandTotal = totalGrandTotal;
        this.sales = sales;
    }

    public long getTotalSalesCount() {
        return totalSalesCount;
    }

    public void setTotalSalesCount(long totalSalesCount) {
        this.totalSalesCount = totalSalesCount;
    }

    public long getTotalUnitsSold() {
        return totalUnitsSold;
    }

    public void setTotalUnitsSold(long totalUnitsSold) {
        this.totalUnitsSold = totalUnitsSold;
    }

    public BigDecimal getTotalSubtotal() {
        return totalSubtotal;
    }

    public void setTotalSubtotal(BigDecimal totalSubtotal) {
        this.totalSubtotal = totalSubtotal;
    }

    public BigDecimal getTotalDiscount() {
        return totalDiscount;
    }

    public void setTotalDiscount(BigDecimal totalDiscount) {
        this.totalDiscount = totalDiscount;
    }

    public BigDecimal getTotalGrandTotal() {
        return totalGrandTotal;
    }

    public void setTotalGrandTotal(BigDecimal totalGrandTotal) {
        this.totalGrandTotal = totalGrandTotal;
    }

    public List<SaleResponse> getSales() {
        return sales;
    }

    public void setSales(List<SaleResponse> sales) {
        this.sales = sales;
    }
}
