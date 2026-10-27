-- V7__seed_demo_account.sql
-- Seed pre-configured demo account for evaluation, testing, and showcase
INSERT INTO users (business_id, full_name, email, phone, password_hash, role, is_verified, created_at, updated_at)
SELECT 1, 'Shivam Yadav', 'sy6220639@gmail.com', '9876543210', '$2a$10$ZIhphdQc4ExIUS5o51SFnOufAX2NOJzwyiozJziR401KCs9iYMn5K', 'OWNER', TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'sy6220639@gmail.com');
