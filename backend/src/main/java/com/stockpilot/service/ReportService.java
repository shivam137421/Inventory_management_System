package com.stockpilot.service;

import com.stockpilot.dto.PurchaseResponse;
import com.stockpilot.dto.PurchasesReportResponse;
import com.stockpilot.dto.SaleResponse;
import com.stockpilot.dto.SalesReportResponse;
import com.stockpilot.entity.PaymentMethod;
import com.stockpilot.entity.PaymentStatus;
import com.stockpilot.entity.Purchase;
import com.stockpilot.entity.PurchaseStatus;
import com.stockpilot.entity.Sale;
import com.stockpilot.repository.PurchaseRepository;
import com.stockpilot.repository.SaleRepository;
import com.stockpilot.security.TenantContext;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService {

    private final SaleRepository saleRepository;
    private final PurchaseRepository purchaseRepository;
    private final SaleService saleService;
    private final PurchaseService purchaseService;

    public ReportService(SaleRepository saleRepository,
                         PurchaseRepository purchaseRepository,
                         SaleService saleService,
                         PurchaseService purchaseService) {
        this.saleRepository = saleRepository;
        this.purchaseRepository = purchaseRepository;
        this.saleService = saleService;
        this.purchaseService = purchaseService;
    }

    private Long resolveBusinessId() {
        Long bid = TenantContext.getCurrentBusinessId();
        return bid != null ? bid : 1L;
    }

    @Transactional(readOnly = true)
    public SalesReportResponse getSalesReport(LocalDateTime startDate,
                                             LocalDateTime endDate,
                                             PaymentMethod paymentMethod,
                                             PaymentStatus paymentStatus) {
        Long businessId = resolveBusinessId();
        List<Sale> sales = saleRepository.findSalesFiltered(
                businessId, paymentMethod, paymentStatus, startDate, endDate);

        long totalSalesCount = sales.size();
        long totalUnitsSold = 0;
        BigDecimal totalSubtotal = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal totalGrandTotal = BigDecimal.ZERO;

        for (Sale s : sales) {
            if (s.getSubtotal() != null) {
                totalSubtotal = totalSubtotal.add(s.getSubtotal());
            }
            if (s.getDiscount() != null) {
                totalDiscount = totalDiscount.add(s.getDiscount());
            }
            if (s.getGrandTotal() != null) {
                totalGrandTotal = totalGrandTotal.add(s.getGrandTotal());
            }
            if (s.getItems() != null) {
                for (var item : s.getItems()) {
                    totalUnitsSold += (item.getQuantity() != null ? item.getQuantity() : 0);
                }
            }
        }

        List<SaleResponse> saleResponses = sales.stream()
                .map(saleService::mapToResponse)
                .collect(Collectors.toList());

        return new SalesReportResponse(
                totalSalesCount,
                totalUnitsSold,
                totalSubtotal,
                totalDiscount,
                totalGrandTotal,
                saleResponses
        );
    }

    @Transactional(readOnly = true)
    public PurchasesReportResponse getPurchasesReport(LocalDateTime startDate,
                                                     LocalDateTime endDate,
                                                     Long supplierId,
                                                     PurchaseStatus status) {
        Long businessId = resolveBusinessId();
        List<Purchase> purchases = purchaseRepository.findPurchasesFiltered(
                businessId, supplierId, status, startDate, endDate);

        long totalPurchasesCount = purchases.size();
        BigDecimal totalSpend = purchases.stream()
                .filter(p -> p.getStatus() == PurchaseStatus.RECEIVED)
                .map(p -> p.getTotalAmount() != null ? p.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<PurchaseResponse> purchaseResponses = purchases.stream()
                .map(purchaseService::mapToResponse)
                .collect(Collectors.toList());

        return new PurchasesReportResponse(
                totalPurchasesCount,
                totalSpend,
                purchaseResponses
        );
    }
}
