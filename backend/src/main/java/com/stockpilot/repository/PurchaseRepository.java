package com.stockpilot.repository;

import com.stockpilot.entity.Purchase;
import com.stockpilot.entity.PurchaseStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

    @EntityGraph(attributePaths = {"supplier", "items", "items.product"})
    Optional<Purchase> findByIdAndBusinessId(Long id, Long businessId);

    @EntityGraph(attributePaths = {"supplier"})
    List<Purchase> findAllByBusinessIdOrderByCreatedAtDesc(Long businessId);

    @EntityGraph(attributePaths = {"supplier"})
    List<Purchase> findAllByBusinessIdAndStatusOrderByCreatedAtDesc(Long businessId, PurchaseStatus status);

    long countByBusinessId(Long businessId);

    boolean existsBySupplierId(Long supplierId);

    @Query("SELECT COUNT(p) FROM Purchase p WHERE p.business.id = :businessId")
    long countPurchasesForBusiness(@Param("businessId") Long businessId);

    @EntityGraph(attributePaths = {"supplier", "items", "items.product"})
    @Query("SELECT p FROM Purchase p WHERE p.business.id = :businessId " +
           "AND (:supplierId IS NULL OR p.supplier.id = :supplierId) " +
           "AND (:status IS NULL OR p.status = :status) " +
           "AND (:startDate IS NULL OR p.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR p.createdAt <= :endDate) " +
           "ORDER BY p.createdAt DESC")
    List<Purchase> findPurchasesFiltered(
            @Param("businessId") Long businessId,
            @Param("supplierId") Long supplierId,
            @Param("status") PurchaseStatus status,
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate
    );

    @Query("SELECT COALESCE(SUM(p.totalAmount), 0) FROM Purchase p WHERE p.business.id = :businessId AND p.status = com.stockpilot.entity.PurchaseStatus.RECEIVED")
    java.math.BigDecimal calculateTotalSpendByBusinessId(@Param("businessId") Long businessId);
}
