-- V1__baseline_schema.sql
-- Baseline schema definition representing existing tables: products and stock_transactions

CREATE TABLE IF NOT EXISTS products (
    id BIGINT NOT NULL AUTO_INCREMENT,
    sku VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    reorder_level INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_products_sku UNIQUE (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS stock_transactions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    transaction_type VARCHAR(10) NOT NULL,
    quantity INT NOT NULL,
    note VARCHAR(255) DEFAULT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_stock_transactions_product_id (product_id),
    KEY idx_stock_transactions_created_at (created_at),
    CONSTRAINT fk_stock_transactions_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
