package com.stockpilot.repository;

import com.stockpilot.entity.Sale;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {

    @EntityGraph(attributePaths = {"items", "items.product"})
    Optional<Sale> findByIdAndBusinessId(Long id, Long businessId);

    @EntityGraph(attributePaths = {"items", "items.product"})
    Optional<Sale> findByBusinessIdAndBillNumber(Long businessId, String billNumber);

    List<Sale> findAllByBusinessIdOrderByCreatedAtDesc(Long businessId);

    List<Sale> findAllByBusinessIdAndCreatedAtBetweenOrderByCreatedAtDesc(
            Long businessId, LocalDateTime startDate, LocalDateTime endDate);

    long countByBusinessId(Long businessId);

    boolean existsByBusinessIdAndBillNumber(Long businessId, String billNumber);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.business.id = :businessId")
    long countSalesForBusiness(@Param("businessId") Long businessId);

    @EntityGraph(attributePaths = {"items", "items.product"})
    @Query("SELECT s FROM Sale s WHERE s.business.id = :businessId " +
           "AND (:paymentMethod IS NULL OR s.paymentMethod = :paymentMethod) " +
           "AND (:paymentStatus IS NULL OR s.paymentStatus = :paymentStatus) " +
           "AND (:startDate IS NULL OR s.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR s.createdAt <= :endDate) " +
           "ORDER BY s.createdAt DESC")
    List<Sale> findSalesFiltered(
            @Param("businessId") Long businessId,
            @Param("paymentMethod") com.stockpilot.entity.PaymentMethod paymentMethod,
            @Param("paymentStatus") com.stockpilot.entity.PaymentStatus paymentStatus,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT COALESCE(SUM(s.grandTotal), 0) FROM Sale s WHERE s.business.id = :businessId")
    java.math.BigDecimal calculateTotalRevenueByBusinessId(@Param("businessId") Long businessId);

    @Query("SELECT COALESCE(SUM(s.grandTotal), 0) FROM Sale s WHERE s.business.id = :businessId AND s.createdAt >= :startDate AND s.createdAt <= :endDate")
    java.math.BigDecimal calculateRevenueForPeriod(
            @Param("businessId") Long businessId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.business.id = :businessId AND s.createdAt >= :startDate AND s.createdAt <= :endDate")
    long countSalesForPeriod(
            @Param("businessId") Long businessId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
