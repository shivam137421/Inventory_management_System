# StockPilot — Multi-Tenant Inventory & Billing Management System

StockPilot is a production-ready, multi-tenant inventory and sales billing management system tailored for retail stores, wholesalers, and distribution businesses. Built with a robust **Spring Boot 3** backend and a high-performance **Angular 18/22 standalone** frontend, StockPilot provides real-time stock tracking, pessimistic concurrency-safe stock deduction, single-step purchase order goods receiving, sequential billing, comprehensive stock audit ledgers, and executive inventory valuation dashboards.

---

### 🔑 Demo Login Credentials
For quick evaluation and testing without needing to register a new account, anyone can log in directly with the pre-configured demo account:

| Field | Demo Credential |
|---|---|
| **Email / Username** | `sy6220639@gmail.com` |
| **Password** | `Shivam12@@` |
| **Role** | Business Owner (Full Access) |
| **Status** | Verified |

> **Note:** Anyone can log in with these credentials to explore the multi-tenant dashboard, real-time stock ledger, POS sales billing, purchase orders, suppliers, and analytics reports. You can also register a fresh business account on the registration page at any time.

---

## 1. Core Architecture & Technology Stack

- **Frontend:**
  - Angular 18/22 Standalone Components, Signals, Reactive Forms, `HttpClient`.
  - Pure Vanilla CSS design system (`styles.css`): `#f7f6f2` page canvas, `#2b2b2b` utilitarian navigation, `#3f6b3a` forest green accent, strict 4px border radius.
  - Zero external CSS frameworks (no Tailwind, Bootstrap, or Material).
  - Print-optimized CSS rules for formal invoices and transaction ledgers.
- **Backend:**
  - Java 17, Spring Boot 3.3.x, Spring Web, Spring Security with JWT.
  - Spring Data JPA with Hibernate, Bean Validation, MySQL JDBC Driver.
  - Concurrency Safety: `LockModeType.PESSIMISTIC_WRITE` on product and business entities to prevent race conditions and overselling.
  - Flyway database migration engine (Automated versioned migrations V1 to V6).
  - Resend API email service with automatic `ConsoleEmailService` development fallback.
- **Database:**
  - MySQL 8.0 (`inventory` database).
  - Multi-tenant architecture with composite foreign keys and composite unique constraints: `(business_id, sku)`, `(business_id, name)`, `(business_id, bill_number)`, `(business_id, purchase_number)`.
  - In-memory H2 database in MySQL compatibility mode for self-contained CI testing.

---

## 2. Key Modules & Functional Workflows

### 2.1 Multi-Tenant Authentication & Business Management
- **Owner-Centric Tenancy:** Each business owner registers with their business name, address, phone, and credentials.
- **Tenant Isolation:** Every API request resolves `business_id` from the verified JWT token (`TenantContext.getCurrentBusinessId()`). Cross-tenant access attempts return HTTP 404 (`ResourceNotFoundException`), preventing enumeration attacks.
- **Email Verification & Password Reset:** 24-hour verification links and 30-minute password reset links with SHA-256 hashed database storage and rate limiting.

### 2.2 Product Catalog & Immutable Stock Ledger
- **Custom Units:** Configurable measurement units (`pcs`, `kg`, `gm`, `litre`, `ml`, `packet`, `box`, `bottle`, `can`, custom).
- **Cost & Retail Valuation:** Products track both selling unit price and purchase cost price for inventory valuation and gross margin analytics.
- **Dynamic Stock Status:**
  - `OUT_OF_STOCK`: `quantity == 0`
  - `LOW_STOCK`: `quantity > 0 && quantity <= reorderLevel`
  - `IN_STOCK`: `quantity > reorderLevel`
- **Stock Movements & Adjustments:** Manual stock adjustments require mandatory audit notes and record `ADJUSTMENT_IN` or `ADJUSTMENT_OUT` with resulting quantity balance.
- **Soft Deactivation:** Deleting products with transaction history flips `isActive = false`, preserving historical sales, purchase invoices, and ledger math.

### 2.3 Suppliers, Purchase Orders & Goods Receiving
- **Supplier Directory:** Manage vendor contacts, GSTIN, and active status with duplicate-name prevention per business.
- **Draft Purchase Orders:** Create multi-item orders (`PUR-000001`) with automatic cost price tracking without prematurely modifying stock.
- **Single-Step Goods Receiving:** Receiving an order (`POST /api/purchases/{id}/receive`) locks product rows under `PESSIMISTIC_WRITE`, increments inventory, updates product unit cost, and creates immutable `PURCHASE_RECEIPT` transactions with resulting quantity.
- **Idempotency & Cancellation:** Duplicate receiving calls are rejected with HTTP 409 Conflict. Drafts can be cancelled; received orders cannot be cancelled.

### 2.4 Sales Billing POS & Real-Time Stock Deduction
- **Billing Workspace:** Fast product search, real-time stock availability clamping, inline quantity modifiers, live discount calculation, and payment method selection (`CASH`, `UPI`, `CARD`, `CREDIT`, `OTHER`).
- **Atomic Sequential Invoice Numbers:** Invoices are numbered sequentially per business (`INV-000001`, `INV-000002`) using pessimistic locking on the `Business` entity.
- **Concurrency & Anti-Overselling Guard:** Line items are locked in ascending order (`PESSIMISTIC_WRITE`). If available stock is insufficient, the entire transaction is rejected with HTTP 409 Conflict and rolls back atomically.
- **Historical Price Snapshotting:** Line items freeze product selling price at the moment of billing, insulating past records from subsequent catalog price updates.
- **Printable Invoices:** Formal tax invoice / bill of supply with computer-generated disclaimer and print styles.

### 2.5 Executive Dashboard & Analytics Reports
- **Dashboard Metrics:** Real-time counts of active products, total stock units, inventory cost valuation ($\sum \text{cost} \times \text{qty}$), retail valuation ($\sum \text{price} \times \text{qty}$), low-stock alert count, out-of-stock count, today's sales revenue, and lifetime sales/purchases totals.
- **Attention Products Table:** Depleted and low-stock products sorted with out-of-stock items first, featuring direct manual adjustment and PO reorder actions.
- **Stock Audit Ledger Report (`REP-01`):** Filter transactions by date range, transaction type (`OPENING`, `PURCHASE_RECEIPT`, `SALE`, `ADJUSTMENT_IN`, `ADJUSTMENT_OUT`), and product, displaying resulting quantity balances.
- **Sales & Purchases Reports (`REP-02`):** Tabbed reporting with date filters, payment methods, suppliers, and category gross margin analysis.

---

## 3. Project Structure

```
inventory_management_system/
├── backend/                              # Spring Boot 3 REST API
│   ├── src/main/java/com/stockpilot/
│   │   ├── config/                       # Security & Email configuration
│   │   ├── controller/                   # REST controllers (Auth, Products, Purchases, Sales, Reports, Dashboard)
│   │   ├── dto/                          # Request & response data transfer objects
│   │   ├── entity/                       # JPA entities (Business, User, Product, StockTransaction, Supplier, Purchase, Sale)
│   │   ├── exception/                    # Global exception handler & custom exceptions
│   │   ├── repository/                   # Spring Data JPA repositories with custom queries
│   │   ├── security/                     # JWT filter, utility, and TenantContext
│   │   └── service/                      # Business logic services
│   ├── src/main/resources/
│   │   ├── application.properties        # Production & runtime properties
│   │   └── db/migration/                 # Flyway migrations (V1 to V7)
│   └── src/test/                         # Comprehensive JUnit 5 test suites (34 tests)
├── frontend/                             # Angular 18/22 standalone client
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/                     # Login, Register, Verify Email, Forgot/Reset Password
│   │   │   ├── core/                     # Auth guard & HTTP JWT interceptor
│   │   │   ├── dashboard/                # Executive dashboard & attention cards
│   │   │   ├── models/                   # TypeScript interfaces (Product, Supplier, Purchase, Sale, Report)
│   │   │   ├── products/                 # Product catalog list & form
│   │   │   ├── purchases/                # PO list, multi-item form, and detail view
│   │   │   ├── reports/                  # Sales, Purchases & Category valuation reports
│   │   │   ├── sales/                    # POS billing workspace, invoice list & printable invoice detail
│   │   │   ├── services/                 # Angular services communicating with REST APIs
│   │   │   ├── shared/                   # Status badges & manual stock adjustment dialogs
│   │   │   └── suppliers/                # Supplier list & create/edit form
│   │   └── styles.css                    # Vanilla CSS tokens & print styles
├── .github/workflows/ci.yml              # CI pipeline (Test, Package, Build, Secret scan)
└── .env.example                          # Environment variables template
```

---

## 4. Database Migrations (Flyway)

Migrations execute automatically on application startup in alphabetical order:

| Version | Description | Tables / Changes |
|---|---|---|
| `V1` | `baseline_schema.sql` | Baseline `products` and `stock_transactions` tables. |
| `V2` | `create_auth_and_tenancy.sql` | Multi-tenant `businesses`, `users`, `email_verification_tokens`, `password_reset_tokens`, `user_refresh_tokens`, backfilling existing rows to default tenant. |
| `V3` | `product_and_ledger_extension.sql` | Added `unit`, `purchase_price`, `description`, `is_active` to `products`; added `reference_type`, `reference_id`, `resulting_quantity` to `stock_transactions`. |
| `V4` | `create_suppliers_table.sql` | Added `suppliers` table with composite unique constraint `(business_id, name)`. |
| `V5` | `create_purchases_and_items.sql` | Added `purchases` and `purchase_items` with sequential document numbering `PUR-000001`. |
| `V6` | `create_sales_and_items.sql` | Added `sales` and `sale_items` with sequential invoice numbering `INV-000001` and payment status tracking. |
| `V7` | `seed_demo_account.sql` | Seeds verified demo owner account (`sy6220639@gmail.com`) for instant testing and evaluation. |

---

## 5. Prerequisites & Environment Configuration

### Prerequisites
- **JDK:** Version 17 or 21
- **Apache Maven:** Version 3.8+ or 3.9+
- **Node.js:** Version 18+ (Node 20+ or 22+ recommended)
- **MySQL Server:** Version 8.0+

### Environment Variables
Copy `.env.example` or export the variables in your terminal:

```bash
# Database Configuration
DB_URL=jdbc:mysql://localhost:3306/inventory
DB_USERNAME=root
DB_PASSWORD=your_mysql_password

# JWT Security
JWT_SECRET=your_jwt_secret_key_at_least_32_characters_long

# Email Delivery (Resend API)
RESEND_API_KEY=your_resend_api_key_here
MAIL_FROM=onboarding@resend.dev
APP_FRONTEND_BASE_URL=http://localhost:4200
```

*(Note: If `RESEND_API_KEY` is not provided or empty, the backend automatically switches to `ConsoleEmailService` and prints verification/reset links directly to the console logs.)*

---

## 6. How to Run Locally

### 1. Database Setup
Start your MySQL server and ensure the database exists:
```sql
CREATE DATABASE IF NOT EXISTS inventory;
```

### 2. Run Backend (Spring Boot)
In PowerShell:
```powershell
$env:DB_USERNAME="root"
$env:DB_PASSWORD="your_mysql_password"
cd backend
mvn spring-boot:run
```
Or execute the packaged JAR:
```bash
cd backend
mvn clean package -DskipTests
java -jar target/backend-1.0.0.jar
```
Backend Base URL: `http://localhost:8080/api`

### 3. Run Frontend (Angular)
In another terminal:
```bash
cd frontend
npm install
npm start
```
Frontend URL: `http://localhost:4200`

### 4. Access the Application & Log In
Open `http://localhost:4200` in your web browser. You can log in immediately with the pre-configured demo account:
- **Username / Email:** `sy6220639@gmail.com`
- **Password:** `Shivam12@@`

Alternatively, click **"Register new business"** to create a fresh isolated tenant account.

---

## 7. Running Automated Tests

Run the full backend automated test suite:
```bash
cd backend
mvn test
```

### Test Suite Summary (34/34 Tests Green):
- `StockPilotApplicationTests`: Context bootstrap and Flyway migration execution.
- `BaselineLedgerIntegrityTest`: Historical inventory math and ledger sum integrity.
- `AuthAndTenantSecurityTest`: Registration, unverified login block, email verification, password reset, rate limiting, and multi-tenant 404 isolation.
- `ProductAndLedgerTest`: Custom units, pessimistic stock adjustment, underflow rejection, and soft deactivation.
- `PurchaseAndSupplierTest`: Supplier CRUD, PO drafts, single-step goods receiving, idempotency enforcement, and cancellation rules.
- `SaleAndConcurrencyTest`: POS billing, real-time stock deduction, multithreaded concurrency protection, atomic invoice numbering, and price snapshotting.
- `DashboardAndReportsTest`: Stock valuation metrics, low-stock/out-of-stock alert prioritization, stock ledger filtering, and sales/purchases date range reports.

---

## 8. REST API Reference

All protected endpoints require `Authorization: Bearer <accessToken>`.

### Authentication & Profile
| Method | Path | Description | Status Code |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new business & owner account | `201 Created` |
| `POST` | `/api/auth/verify-email` | Verify email with raw token | `200 OK` |
| `POST` | `/api/auth/resend-verification` | Resend verification email (rate-limited) | `200 OK` |
| `POST` | `/api/auth/login` | Login and receive JWT access & refresh tokens | `200 OK` |
| `POST` | `/api/auth/refresh-token` | Rotate access token using valid refresh token | `200 OK` |
| `POST` | `/api/auth/forgot-password` | Request password reset email | `200 OK` |
| `POST` | `/api/auth/reset-password` | Reset password using reset token | `200 OK` |
| `GET` | `/api/business/profile` | Get authenticated business details | `200 OK` |
| `PUT` | `/api/business/profile` | Update business contact and GSTIN details | `200 OK` |

### Products & Stock Movements
| Method | Path | Description | Status Code |
|---|---|---|---|
| `GET` | `/api/products` | List all tenant products (supports `includeInactive=true`) | `200 OK` |
| `GET` | `/api/products/{id}` | Get single product by ID (cross-tenant returns 404) | `200 OK` |
| `POST` | `/api/products` | Create product with unit, cost & selling price | `201 Created` |
| `PUT` | `/api/products/{id}` | Update product details (stock quantity is immutable via PUT) | `200 OK` |
| `DELETE` | `/api/products/{id}` | Soft deactivates product if history exists; hard deletes if clean | `204 No Content` |
| `POST` | `/api/products/{id}/adjust` | Manual stock adjustment (+ / -) with mandatory audit note | `200 OK` |
| `GET` | `/api/transactions` | Query audit ledger with `startDate`, `endDate`, `type`, `productId` | `200 OK` |

### Suppliers & Purchases
| Method | Path | Description | Status Code |
|---|---|---|---|
| `GET` | `/api/suppliers` | List all suppliers for tenant | `200 OK` |
| `GET` | `/api/suppliers/{id}` | Get supplier by ID | `200 OK` |
| `POST` | `/api/suppliers` | Create supplier (duplicate name rejected) | `201 Created` |
| `PUT` | `/api/suppliers/{id}` | Update supplier details | `200 OK` |
| `DELETE` | `/api/suppliers/{id}` | Soft-deactivates supplier (`isActive = false`) | `204 No Content` |
| `GET` | `/api/purchases` | List purchase orders (optional `status=DRAFT/RECEIVED/CANCELLED`) | `200 OK` |
| `GET` | `/api/purchases/{id}` | Get purchase order details and line items | `200 OK` |
| `POST` | `/api/purchases` | Create draft purchase order (`PUR-000001`) | `201 Created` |
| `POST` | `/api/purchases/{id}/receive` | Goods receiving: locks products, increments stock, updates cost | `200 OK` |
| `POST` | `/api/purchases/{id}/cancel` | Cancel draft purchase order (received orders cannot be cancelled) | `200 OK` |

### Sales & Billing POS
| Method | Path | Description | Status Code |
|---|---|---|---|
| `GET` | `/api/sales` | List all sales invoices for tenant | `200 OK` |
| `GET` | `/api/sales/{id}` | Get sales invoice details, customer data, and line items | `200 OK` |
| `GET` | `/api/sales/bill/{billNumber}` | Look up sale by sequential bill number (`INV-000001`) | `200 OK` |
| `POST` | `/api/sales` | Record sale: locks products, deducts stock, writes `SALE` ledger | `201 Created` |

### Dashboard & Analytics Reports
| Method | Path | Description | Status Code |
|---|---|---|---|
| `GET` | `/api/dashboard` | Executive summary (stock counts, cost/retail valuation, alerts) | `200 OK` |
| `GET` | `/api/reports/sales` | Aggregate sales report by date range, payment method & status | `200 OK` |
| `GET` | `/api/reports/purchases` | Aggregate purchases report by date range, supplier & status | `200 OK` |

---

## 9. Continuous Integration (CI)

The GitHub Actions CI pipeline is defined in `.github/workflows/ci.yml`:
1. **Backend Build & Test:** Boots JDK 17, executes all 34 JUnit 5 tests against the in-memory H2 database, and packages the executable JAR artifact.
2. **Frontend Build:** Boots Node.js 22, installs dependencies via `npm ci`, and builds all 16 production Angular bundles (`npm run build`).
3. **Secrets Hygiene Scan:** Scans the repository to ensure no unencrypted secrets, certificates, or `.env` files are tracked in version control.

---

## 10. Troubleshooting & Common Issues

- **Port Conflict (`8080` or `4200` in use):**
  - Check running processes: `netstat -ano | findstr :8080` or `netstat -ano | findstr :4200`.
  - Terminate existing processes before launching the application.
- **MySQL Connection Failure:**
  - Verify MySQL is active: `Get-Service MySQL80` (Windows) or `sudo systemctl status mysql` (Linux).
  - Ensure `$env:DB_PASSWORD` or `export DB_PASSWORD` matches your root MySQL password.
- **Console Email Fallback in Development:**
  - When running without a `RESEND_API_KEY`, verification and password reset links are printed to the terminal logs with prefix `[DEV/CONSOLE EMAIL]`. Copy and paste the verification URL into your browser to verify accounts.
- **CORS Errors:**
  - Ensure the frontend runs on `http://localhost:4200`, which is the allowed origin configured in backend `SecurityConfig`.
