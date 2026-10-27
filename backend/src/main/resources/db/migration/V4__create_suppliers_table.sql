-- V4__create_suppliers_table.sql
-- StockPilot: Suppliers management table

CREATE TABLE IF NOT EXISTS suppliers (
    id BIGINT NOT NULL AUTO_INCREMENT,
    business_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(150) NULL,
    address VARCHAR(255) NULL,
    notes TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_suppliers_business_name UNIQUE (business_id, name),
    CONSTRAINT fk_suppliers_business FOREIGN KEY (business_id) REFERENCES businesses (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_suppliers_business_active ON suppliers(business_id, is_active);
