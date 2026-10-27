-- V6__create_sales_and_items.sql
-- StockPilot: Sales billing and line items table with tenant isolation

CREATE TABLE IF NOT EXISTS sales (
    id BIGINT NOT NULL AUTO_INCREMENT,
    business_id BIGINT NOT NULL,
    bill_number VARCHAR(50) NOT NULL,
    customer_name VARCHAR(150) NULL,
    customer_phone VARCHAR(20) NULL,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'CASH',
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PAID',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    grand_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT NULL,
    created_by BIGINT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_sales_business_bill_number UNIQUE (business_id, bill_number),
    CONSTRAINT fk_sales_business FOREIGN KEY (business_id) REFERENCES businesses (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_sales_business_date ON sales(business_id, created_at);
CREATE INDEX idx_sales_business_customer ON sales(business_id, customer_phone);

CREATE TABLE IF NOT EXISTS sale_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    sale_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_sale_items_sale FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
    CONSTRAINT fk_sale_items_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);
