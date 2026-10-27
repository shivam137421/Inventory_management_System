package com.stockpilot.controller;

import com.stockpilot.dto.PurchasesReportResponse;
import com.stockpilot.dto.SalesReportResponse;
import com.stockpilot.entity.PaymentMethod;
import com.stockpilot.entity.PaymentStatus;
import com.stockpilot.entity.PurchaseStatus;
import com.stockpilot.service.ReportService;
import java.time.LocalDateTime;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/sales")
    public ResponseEntity<SalesReportResponse> getSalesReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) PaymentMethod paymentMethod,
            @RequestParam(required = false) PaymentStatus paymentStatus) {
        return ResponseEntity.ok(reportService.getSalesReport(startDate, endDate, paymentMethod, paymentStatus));
    }

    @GetMapping("/purchases")
    public ResponseEntity<PurchasesReportResponse> getPurchasesReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) PurchaseStatus status) {
        return ResponseEntity.ok(reportService.getPurchasesReport(startDate, endDate, supplierId, status));
    }
}
