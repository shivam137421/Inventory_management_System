-- V2__create_auth_and_tenancy.sql
-- Create businesses, users, authentication tokens, and link existing tables to tenancy

CREATE TABLE IF NOT EXISTS businesses (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    email VARCHAR(150) DEFAULT NULL,
    gstin VARCHAR(20) DEFAULT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Seed Default Business for backward compatibility with existing data
INSERT INTO businesses (id, name, created_at, updated_at)
SELECT 1, 'Default Business', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM businesses WHERE id = 1);

-- Link products table to businesses
ALTER TABLE products ADD COLUMN business_id BIGINT NOT NULL DEFAULT 1;
ALTER TABLE products ADD CONSTRAINT fk_products_business FOREIGN KEY (business_id) REFERENCES businesses (id);
ALTER TABLE products DROP INDEX uk_products_sku;
ALTER TABLE products ADD CONSTRAINT uk_products_business_sku UNIQUE (business_id, sku);

-- Link stock_transactions table to businesses
ALTER TABLE stock_transactions ADD COLUMN business_id BIGINT NOT NULL DEFAULT 1;
ALTER TABLE stock_transactions ADD CONSTRAINT fk_stock_transactions_business FOREIGN KEY (business_id) REFERENCES businesses (id);
CREATE INDEX idx_stock_transactions_business_id ON stock_transactions (business_id);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    business_id BIGINT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'OWNER',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email),
    KEY idx_users_business_id (business_id),
    CONSTRAINT fk_users_business FOREIGN KEY (business_id) REFERENCES businesses (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    used_at DATETIME(6) DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_evt_token_hash (token_hash),
    KEY idx_evt_user_id (user_id),
    CONSTRAINT fk_evt_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    used_at DATETIME(6) DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_prt_token_hash (token_hash),
    KEY idx_prt_user_id (user_id),
    CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Refresh tokens table for active token revocation
CREATE TABLE IF NOT EXISTS user_refresh_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_urt_token_hash (token_hash),
    KEY idx_urt_user_id (user_id),
    CONSTRAINT fk_urt_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
