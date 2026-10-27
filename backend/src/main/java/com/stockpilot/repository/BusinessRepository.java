package com.stockpilot.repository;

import com.stockpilot.entity.Business;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BusinessRepository extends JpaRepository<Business, Long> {

    Optional<Business> findByNameIgnoreCase(String name);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Business b WHERE b.id = :id")
    Optional<Business> findByIdWithLock(@Param("id") Long id);
}
