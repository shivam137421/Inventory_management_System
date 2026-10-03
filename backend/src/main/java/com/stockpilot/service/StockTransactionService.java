package com.stockpilot.service;

import com.stockpilot.dto.TransactionResponse;
import com.stockpilot.entity.StockTransaction;
import com.stockpilot.entity.TransactionType;
import com.stockpilot.repository.StockTransactionRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockTransactionService {

    private final StockTransactionRepository stockTransactionRepository;

    public StockTransactionService(StockTransactionRepository stockTransactionRepository) {
        this.stockTransactionRepository = stockTransactionRepository;
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactions(TransactionType type, Long productId) {
        List<StockTransaction> transactions;

        if (type != null && productId != null) {
            transactions = stockTransactionRepository.findByProductIdAndTransactionTypeOrderByCreatedAtDesc(productId, type);
        } else if (type != null) {
            transactions = stockTransactionRepository.findByTransactionTypeOrderByCreatedAtDesc(type);
        } else if (productId != null) {
            transactions = stockTransactionRepository.findByProductIdOrderByCreatedAtDesc(productId);
        } else {
            transactions = stockTransactionRepository.findAllByOrderByCreatedAtDesc();
        }

        return transactions.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private TransactionResponse mapToResponse(StockTransaction transaction) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getProduct().getId(),
                transaction.getProduct().getName(),
                transaction.getProduct().getSku(),
                transaction.getTransactionType(),
                transaction.getQuantity(),
                transaction.getNote(),
                transaction.getCreatedAt()
        );
    }
}
