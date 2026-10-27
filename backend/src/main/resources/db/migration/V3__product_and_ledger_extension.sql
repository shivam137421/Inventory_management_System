-- V3__product_and_ledger_extension.sql
-- StockPilot: Product units, purchase pricing, active flag and ledger reference tracking

-- 1. Extend products table with unit, purchase price, description, and active status
ALTER TABLE products ADD COLUMN unit VARCHAR(30) NOT NULL DEFAULT 'pcs';
ALTER TABLE products ADD COLUMN purchase_price DECIMAL(12,2) NULL;
ALTER TABLE products ADD COLUMN description TEXT NULL;
ALTER TABLE products ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE products MODIFY COLUMN unit_price DECIMAL(12,2) NOT NULL;

CREATE INDEX idx_products_business_active ON products(business_id, is_active);

-- 2. Extend stock_transactions table with audit and balance tracking
ALTER TABLE stock_transactions ADD COLUMN reference_type VARCHAR(50) NULL;
ALTER TABLE stock_transactions ADD COLUMN reference_id BIGINT NULL;
ALTER TABLE stock_transactions ADD COLUMN resulting_quantity INT NULL;
ALTER TABLE stock_transactions MODIFY COLUMN transaction_type VARCHAR(50) NOT NULL;

CREATE INDEX idx_stock_tx_product_created ON stock_transactions(product_id, created_at);
CREATE INDEX idx_stock_tx_business_created ON stock_transactions(business_id, created_at);

-- 3. Backfill baseline historical transactions with reference types
UPDATE stock_transactions SET reference_type = 'INITIAL', resulting_quantity = quantity WHERE transaction_type = 'OPENING' AND resulting_quantity IS NULL;
UPDATE stock_transactions SET reference_type = 'LEGACY_ADJUSTMENT' WHERE reference_type IS NULL;
