package com.stockpilot.controller;

import com.stockpilot.dto.PurchaseRequest;
import com.stockpilot.dto.PurchaseResponse;
import com.stockpilot.entity.PurchaseStatus;
import com.stockpilot.service.PurchaseService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/purchases")
public class PurchaseController {

    private final PurchaseService purchaseService;

    public PurchaseController(PurchaseService purchaseService) {
        this.purchaseService = purchaseService;
    }

    @GetMapping
    public ResponseEntity<List<PurchaseResponse>> getAllPurchases(
            @RequestParam(required = false) PurchaseStatus status) {
        return ResponseEntity.ok(purchaseService.getAllPurchases(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseResponse> getPurchaseById(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseService.getPurchaseById(id));
    }

    @PostMapping
    public ResponseEntity<PurchaseResponse> createPurchase(@Valid @RequestBody PurchaseRequest request) {
        PurchaseResponse response = purchaseService.createPurchase(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/receive")
    public ResponseEntity<PurchaseResponse> receivePurchase(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseService.receivePurchase(id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<PurchaseResponse> cancelPurchase(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseService.cancelPurchase(id));
    }
}
