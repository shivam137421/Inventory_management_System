package com.stockpilot.controller;

import com.stockpilot.dto.BusinessProfileRequest;
import com.stockpilot.dto.BusinessProfileResponse;
import com.stockpilot.service.BusinessService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/business")
public class BusinessController {

    private final BusinessService businessService;

    public BusinessController(BusinessService businessService) {
        this.businessService = businessService;
    }

    @GetMapping("/profile")
    public ResponseEntity<BusinessProfileResponse> getProfile() {
        return ResponseEntity.ok(businessService.getProfile());
    }

    @PutMapping("/profile")
    public ResponseEntity<BusinessProfileResponse> updateProfile(@Valid @RequestBody BusinessProfileRequest request) {
        return ResponseEntity.ok(businessService.updateProfile(request));
    }
}
