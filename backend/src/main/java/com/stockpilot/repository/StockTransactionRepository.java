package com.stockpilot.repository;

import com.stockpilot.entity.StockTransaction;
import com.stockpilot.entity.TransactionType;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {

    boolean existsByProductId(Long productId);

    long countByProductId(Long productId);

    @EntityGraph(attributePaths = {"product"})
    List<StockTransaction> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"product"})
    List<StockTransaction> findByTransactionTypeOrderByCreatedAtDesc(TransactionType transactionType);

    @EntityGraph(attributePaths = {"product"})
    List<StockTransaction> findByProductIdOrderByCreatedAtDesc(Long productId);

    @EntityGraph(attributePaths = {"product"})
    List<StockTransaction> findByProductIdAndTransactionTypeOrderByCreatedAtDesc(Long productId, TransactionType transactionType);
}
