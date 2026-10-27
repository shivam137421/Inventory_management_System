-- V5__create_purchases_and_items.sql
-- StockPilot: Purchases and purchase items table for supplier stock receipts

CREATE TABLE IF NOT EXISTS purchases (
    id BIGINT NOT NULL AUTO_INCREMENT,
    business_id BIGINT NOT NULL,
    supplier_id BIGINT NOT NULL,
    purchase_number VARCHAR(50) NOT NULL,
    supplier_invoice_no VARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT NULL,
    created_by BIGINT NULL,
    received_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_purchases_business_number UNIQUE (business_id, purchase_number),
    CONSTRAINT fk_purchases_business FOREIGN KEY (business_id) REFERENCES businesses (id),
    CONSTRAINT fk_purchases_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_purchases_business_status ON purchases(business_id, status);
CREATE INDEX idx_purchases_business_date ON purchases(business_id, created_at);

CREATE TABLE IF NOT EXISTS purchase_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    purchase_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_purchase_items_purchase FOREIGN KEY (purchase_id) REFERENCES purchases (id) ON DELETE CASCADE,
    CONSTRAINT fk_purchase_items_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_product_id ON purchase_items(product_id);
