# StockPilot

StockPilot is a clean, reliable, and lightweight Inventory Management System designed to handle core inventory workflows seamlessly. It allows users to track product catalog items, monitor real-time stock levels, execute stock movements (Stock IN and Stock OUT) with strict concurrency safety and inventory constraints, maintain an unalterable transaction audit trail, and view low-stock and out-of-stock items on an executive dashboard.

---

## 1. Technology Stack

- **Frontend:** Angular 22 (Standalone Components), TypeScript, HTML5, Plain CSS, Angular `HttpClient`, Reactive Forms.
- **Backend:** Java 17, Spring Boot 3.3.x, Spring Web, Spring Data JPA (Hibernate), Bean Validation, MySQL JDBC Driver, Maven.
- **Database:** MySQL 8.0 (Database name: `inventory`).

---

## 2. Project Structure

```
inventory/
├── frontend/             # Angular standalone client application
├── backend/              # Spring Boot REST API application
├── others/               # Project documentation (architecture, checkpoints, prompt)
├── .gitignore            # Root Git ignore file
└── README.md             # Project documentation and setup guide
```

---

## 3. Prerequisites

- **Java Development Kit (JDK):** Version 17 or 21
- **Apache Maven:** Version 3.8+ or 3.9+
- **Node.js:** Version 18+ (Node 20+ or 26+ recommended)
- **Angular CLI:** Version 17+ (or via `npx @angular/cli`)
- **MySQL Server:** Version 8.0+

---

## 4. MySQL Setup

Ensure MySQL Server is running locally on port `3306`. Connect to MySQL and create the `inventory` database if it does not already exist:

```sql
CREATE DATABASE IF NOT EXISTS inventory;
```

---

## 5. Setting Database Credentials

The backend application securely reads database credentials from environment variables. **Do not hardcode database passwords in configuration files.**

### Windows (PowerShell)
```powershell
$env:DB_USERNAME="root"
$env:DB_PASSWORD="<your-mysql-password>"
```

### Windows (Command Prompt)
```cmd
set DB_USERNAME=root
set DB_PASSWORD=<your-mysql-password>
```

### macOS / Linux
```bash
export DB_USERNAME=root
export DB_PASSWORD=<your-mysql-password>
```

*(Note: If `DB_USERNAME` is omitted, it defaults to `root`. `DB_PASSWORD` must be provided via the environment.)*

---

## 6. How to Run the Backend

Navigate to the `backend` directory, ensure the environment variables are set, and start the Spring Boot service:

```bash
cd backend
mvn spring-boot:run
```

The backend server starts on port `8080` (Base URL: `http://localhost:8080/api`).

---

## 7. How to Run the Frontend

Navigate to the `frontend` directory, install dependencies if not already done, and launch the development server:

```bash
cd frontend
npm install
npm start
```

Or run via Angular CLI:
```bash
npx ng serve
```

Access the frontend application in your browser at:
`http://localhost:4200`

---

## 8. API Overview

| Method | Path | Purpose | Success Code |
|---|---|---|---|
| `GET` | `/api/products` | List all products (includes derived `status`) | `200 OK` |
| `GET` | `/api/products/{id}` | Get single product details | `200 OK` |
| `POST` | `/api/products` | Create product (auto-creates opening stock IN transaction if quantity > 0) | `201 Created` |
| `PUT` | `/api/products/{id}` | Edit product details (quantity field is ignored) | `200 OK` |
| `DELETE` | `/api/products/{id}` | Delete product if it has zero transaction history | `204 No Content` |
| `POST` | `/api/products/{id}/stock-in` | Add stock quantity with optional note | `200 OK` |
| `POST` | `/api/products/{id}/stock-out` | Deduct stock quantity (rejected if insufficient) | `200 OK` |
| `GET` | `/api/transactions` | List all stock transactions (optional filters: `type`, `productId`) | `200 OK` |
| `GET` | `/api/dashboard` | Summary counts and products needing attention | `200 OK` |

---

## 9. Basic Functionality and Stock Status Rule

- **Product Management:** Add and update products with SKU, name, category, reorder level, and unit price. Search by SKU or product name, and filter by category and stock status.
- **Stock Movements:** Perform Stock IN and Stock OUT operations with automatic transaction recording and concurrency-safe pessimistic locking.
- **Derived Stock Status Rule:** Stock status is computed on the backend dynamically:
  - `OUT_OF_STOCK`: `quantity == 0`
  - `LOW_STOCK`: `quantity > 0` and `quantity <= reorderLevel`
  - `IN_STOCK`: `quantity > reorderLevel`

---

## 10. Product Delete Rule

- A product can **only** be deleted if it has **zero stock transactions**.
- If any transaction exists (including the opening stock transaction generated on creation when opening quantity > 0, or any subsequent Stock IN / Stock OUT movement), deletion is strictly prevented and returns HTTP 409: `This product has stock history and cannot be deleted.`

---

## 11. Troubleshooting

- **MySQL Not Running:** Verify the MySQL service status (`Get-Service MySQL80` on Windows, or `sudo systemctl status mysql` on Linux) and start it.
- **Access Denied / Wrong Password:** Ensure `$env:DB_PASSWORD` or `export DB_PASSWORD` matches your local MySQL `root` user password.
- **`DB_PASSWORD` Not Set:** If `DB_PASSWORD` is missing, Spring Boot will fail on startup with a placeholder resolution error. Ensure the variable is exported in your active terminal session.
- **Port 8080 or 4200 in Use:** Check for existing processes running on these ports (`netstat -ano | findstr :8080` / `netstat -ano | findstr :4200`) and terminate conflicting processes.
- **CORS Error:** Verify the frontend is running on `http://localhost:4200`, which is the allowed origin configured in the backend `WebConfig`.
- **Backend Unreachable:** Verify Spring Boot is running and responding at `http://localhost:8080/api/products`.
