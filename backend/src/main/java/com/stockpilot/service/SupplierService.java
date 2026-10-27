package com.stockpilot.service;

import com.stockpilot.dto.SupplierRequest;
import com.stockpilot.dto.SupplierResponse;
import com.stockpilot.entity.Business;
import com.stockpilot.entity.Supplier;
import com.stockpilot.exception.ConflictException;
import com.stockpilot.exception.ResourceNotFoundException;
import com.stockpilot.repository.BusinessRepository;
import com.stockpilot.repository.PurchaseRepository;
import com.stockpilot.repository.SupplierRepository;
import com.stockpilot.security.TenantContext;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final BusinessRepository businessRepository;
    private final PurchaseRepository purchaseRepository;

    public SupplierService(
            SupplierRepository supplierRepository,
            BusinessRepository businessRepository,
            PurchaseRepository purchaseRepository) {
        this.supplierRepository = supplierRepository;
        this.businessRepository = businessRepository;
        this.purchaseRepository = purchaseRepository;
    }

    private Long resolveBusinessId() {
        Long bid = TenantContext.getCurrentBusinessId();
        return bid != null ? bid : 1L;
    }

    @Transactional(readOnly = true)
    public List<SupplierResponse> getAllSuppliers() {
        Long businessId = resolveBusinessId();
        return supplierRepository.findAllByBusinessIdOrderByCreatedAtDesc(businessId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SupplierResponse> getActiveSuppliers() {
        Long businessId = resolveBusinessId();
        return supplierRepository.findAllByBusinessIdAndIsActiveTrueOrderByNameAsc(businessId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SupplierResponse getSupplierById(Long id) {
        Long businessId = resolveBusinessId();
        Supplier supplier = supplierRepository.findByIdAndBusinessId(id, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found."));
        return mapToResponse(supplier);
    }

    @Transactional
    public SupplierResponse createSupplier(SupplierRequest request) {
        Long businessId = resolveBusinessId();
        String cleanName = request.getName().trim();

        if (supplierRepository.existsByBusinessIdAndNameIgnoreCase(businessId, cleanName)) {
            throw new ConflictException("Supplier with this name already exists.");
        }

        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found."));

        Supplier supplier = new Supplier(
                business,
                cleanName,
                request.getContactPerson() != null ? request.getContactPerson().trim() : null,
                request.getPhone() != null ? request.getPhone().trim() : null,
                request.getEmail() != null ? request.getEmail().trim() : null,
                request.getAddress() != null ? request.getAddress().trim() : null,
                request.getNotes() != null ? request.getNotes().trim() : null
        );

        Supplier saved = supplierRepository.save(supplier);
        return mapToResponse(saved);
    }

    @Transactional
    public SupplierResponse updateSupplier(Long id, SupplierRequest request) {
        Long businessId = resolveBusinessId();
        Supplier supplier = supplierRepository.findByIdAndBusinessId(id, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found."));

        String cleanName = request.getName().trim();
        if (supplierRepository.existsByBusinessIdAndNameIgnoreCaseAndIdNot(businessId, cleanName, id)) {
            throw new ConflictException("Supplier with this name already exists.");
        }

        supplier.setName(cleanName);
        supplier.setContactPerson(request.getContactPerson() != null ? request.getContactPerson().trim() : null);
        supplier.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        supplier.setEmail(request.getEmail() != null ? request.getEmail().trim() : null);
        supplier.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        supplier.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);

        Supplier updated = supplierRepository.save(supplier);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteSupplier(Long id) {
        Long businessId = resolveBusinessId();
        Supplier supplier = supplierRepository.findByIdAndBusinessId(id, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found."));

        if (purchaseRepository.existsBySupplierId(id)) {
            supplier.setIsActive(false);
            supplierRepository.save(supplier);
            return;
        }

        supplierRepository.delete(supplier);
    }

    public SupplierResponse mapToResponse(Supplier supplier) {
        return new SupplierResponse(
                supplier.getId(),
                supplier.getName(),
                supplier.getContactPerson(),
                supplier.getPhone(),
                supplier.getEmail(),
                supplier.getAddress(),
                supplier.getNotes(),
                supplier.getIsActive(),
                supplier.getCreatedAt(),
                supplier.getUpdatedAt()
        );
    }
}
