package com.stockpilot.controller;

import com.stockpilot.dto.SaleRequest;
import com.stockpilot.dto.SaleResponse;
import com.stockpilot.service.SaleService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sales")
public class SaleController {

    private final SaleService saleService;

    public SaleController(SaleService saleService) {
        this.saleService = saleService;
    }

    @GetMapping
    public ResponseEntity<List<SaleResponse>> getAllSales() {
        return ResponseEntity.ok(saleService.getAllSales());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SaleResponse> getSaleById(@PathVariable Long id) {
        return ResponseEntity.ok(saleService.getSaleById(id));
    }

    @GetMapping("/bill/{billNumber}")
    public ResponseEntity<SaleResponse> getSaleByBillNumber(@PathVariable String billNumber) {
        return ResponseEntity.ok(saleService.getSaleByBillNumber(billNumber));
    }

    @PostMapping
    public ResponseEntity<SaleResponse> createSale(@Valid @RequestBody SaleRequest request) {
        SaleResponse response = saleService.createSale(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
