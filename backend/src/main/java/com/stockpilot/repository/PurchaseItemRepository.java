package com.stockpilot.repository;

import com.stockpilot.entity.PurchaseItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PurchaseItemRepository extends JpaRepository<PurchaseItem, Long> {

    List<PurchaseItem> findByPurchaseId(Long purchaseId);

    boolean existsByProductId(Long productId);
}
