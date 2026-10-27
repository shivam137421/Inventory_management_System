package com.stockpilot.repository;

import com.stockpilot.entity.Supplier;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    boolean existsByBusinessIdAndNameIgnoreCase(Long businessId, String name);

    boolean existsByBusinessIdAndNameIgnoreCaseAndIdNot(Long businessId, String name, Long id);

    Optional<Supplier> findByIdAndBusinessId(Long id, Long businessId);

    List<Supplier> findAllByBusinessIdOrderByCreatedAtDesc(Long businessId);

    List<Supplier> findAllByBusinessIdAndIsActiveTrueOrderByNameAsc(Long businessId);
}
