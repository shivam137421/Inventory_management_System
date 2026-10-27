package com.stockpilot.repository;

import com.stockpilot.entity.Product;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsBySkuIgnoreCase(String sku);

    boolean existsBySkuIgnoreCaseAndIdNot(String sku, Long id);

    boolean existsByBusinessIdAndSkuIgnoreCase(Long businessId, String sku);

    boolean existsByBusinessIdAndSkuIgnoreCaseAndIdNot(Long businessId, String sku, Long id);

    Optional<Product> findBySkuIgnoreCase(String sku);

    Optional<Product> findByIdAndBusinessId(Long id, Long businessId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdWithLock(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id AND p.business.id = :businessId")
    Optional<Product> findByIdAndBusinessIdWithLock(@Param("id") Long id, @Param("businessId") Long businessId);

    List<Product> findAllByOrderByCreatedAtDesc();

    List<Product> findAllByBusinessIdOrderByCreatedAtDesc(Long businessId);

    List<Product> findAllByBusinessIdAndIsActiveTrueOrderByCreatedAtDesc(Long businessId);

    List<Product> findAllByBusinessId(Long businessId);
}
