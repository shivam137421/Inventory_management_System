package com.stockpilot.repository;

import com.stockpilot.entity.StockTransaction;
import com.stockpilot.entity.TransactionType;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {

    boolean existsByProductId(Long productId);

    boolean existsByProductIdAndBusinessId(Long productId, Long businessId);

    long countByProductId(Long productId);

    @EntityGraph(attributePaths = {"product"})
    List<StockTransaction> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"product"})
    List<StockTransaction> findAllByBusinessIdOrderByCreatedAtDesc(Long businessId);

    @EntityGraph(attributePaths = {"product"})
    List<StockTransaction> findByTransactionTypeOrderByCreatedAtDesc(TransactionType transactionType);

    @EntityGraph(attributePaths = {"product"})
    List<StockTransaction> findByBusinessIdAndTransactionTypeOrderByCreatedAtDesc(Long businessId, TransactionType transactionType);

    @EntityGraph(attributePaths = {"product"})
    List<StockTransaction> findByProductIdOrderByCreatedAtDesc(Long productId);

    @EntityGraph(attributePaths = {"product"})
    List<StockTransaction> findByBusinessIdAndProductIdOrderByCreatedAtDesc(Long businessId, Long productId);

    @EntityGraph(attributePaths = {"product"})
    List<StockTransaction> findByProductIdAndTransactionTypeOrderByCreatedAtDesc(Long productId, TransactionType transactionType);

    @EntityGraph(attributePaths = {"product"})
    List<StockTransaction> findByBusinessIdAndProductIdAndTransactionTypeOrderByCreatedAtDesc(Long businessId, Long productId, TransactionType transactionType);

    @EntityGraph(attributePaths = {"product"})
    @Query("SELECT st FROM StockTransaction st WHERE st.business.id = :businessId " +
           "AND (:productId IS NULL OR st.product.id = :productId) " +
           "AND (:transactionType IS NULL OR st.transactionType = :transactionType) " +
           "AND (:startDate IS NULL OR st.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR st.createdAt <= :endDate) " +
           "ORDER BY st.createdAt DESC")
    List<StockTransaction> findTransactionsFiltered(
            @Param("businessId") Long businessId,
            @Param("productId") Long productId,
            @Param("transactionType") TransactionType transactionType,
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate
    );

    @Query("SELECT COALESCE(SUM(CASE " +
           "  WHEN st.transactionType IN (com.stockpilot.entity.TransactionType.OPENING, com.stockpilot.entity.TransactionType.PURCHASE_RECEIPT, com.stockpilot.entity.TransactionType.ADJUSTMENT_IN, com.stockpilot.entity.TransactionType.IN) THEN st.quantity " +
           "  WHEN st.transactionType IN (com.stockpilot.entity.TransactionType.SALE, com.stockpilot.entity.TransactionType.ADJUSTMENT_OUT, com.stockpilot.entity.TransactionType.OUT) THEN -st.quantity " +
           "  ELSE 0 END), 0) " +
           "FROM StockTransaction st WHERE st.product.id = :productId AND st.business.id = :businessId")
    Integer calculateLedgerBalanceByProductIdAndBusinessId(@Param("productId") Long productId, @Param("businessId") Long businessId);
}
