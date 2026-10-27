package com.stockpilot.service;

import com.stockpilot.dto.BusinessProfileRequest;
import com.stockpilot.dto.BusinessProfileResponse;
import com.stockpilot.entity.Business;
import com.stockpilot.exception.ResourceNotFoundException;
import com.stockpilot.repository.BusinessRepository;
import com.stockpilot.security.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BusinessService {

    private final BusinessRepository businessRepository;

    public BusinessService(BusinessRepository businessRepository) {
        this.businessRepository = businessRepository;
    }

    @Transactional(readOnly = true)
    public BusinessProfileResponse getProfile() {
        Long businessId = TenantContext.getCurrentBusinessId();
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business profile not found."));
        return mapToResponse(business);
    }

    @Transactional
    public BusinessProfileResponse updateProfile(BusinessProfileRequest request) {
        Long businessId = TenantContext.getCurrentBusinessId();
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business profile not found."));

        business.setName(request.getName().trim());
        business.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        business.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        business.setEmail(request.getEmail() != null ? request.getEmail().trim() : null);
        business.setGstin(request.getGstin() != null ? request.getGstin().trim() : null);

        Business saved = businessRepository.save(business);
        return mapToResponse(saved);
    }

    private BusinessProfileResponse mapToResponse(Business b) {
        return new BusinessProfileResponse(
                b.getId(),
                b.getName(),
                b.getAddress(),
                b.getPhone(),
                b.getEmail(),
                b.getGstin(),
                b.getCreatedAt(),
                b.getUpdatedAt()
        );
    }
}
