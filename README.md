# 🔧 AutoCare – Vehicle Service & Maintenance Management System

**DBMS Experiential Learning – Level 3 Project**  
**Team 4 | Section D | PES University**

**Team Members:**
- **Heemadhawala R** – PES2UG24CS190
- **Heemavathi E** – PES2UG24CS193

---

## 1. Project Overview

AutoCare is a web-based Vehicle Service and Maintenance Management System designed to simplify and manage vehicle servicing operations.

The application provides a centralized platform for customers, service staff, and administrators to manage vehicle information, service appointments, service records, spare parts, inventory, invoices, payments, customer feedback, and inspection details.

The project integrates **MySQL 8** as the relational database and **MongoDB** as the NoSQL database to demonstrate how different database technologies can work together in a real-world application.

### Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js 14, React 18 |
| Backend | Next.js API Route Handlers |
| Relational Database | MySQL 8 |
| NoSQL Database | MongoDB |
| Programming Language | JavaScript |
| Database Connectivity | mysql2, MongoDB Driver |
| Authentication | JWT, bcryptjs |
| Runtime | Node.js |

---

## 2. Prerequisites

Make sure the following software is installed:

- **Node.js 18+**
- **MySQL 8.0.16+** (required for enforced CHECK constraints)
- **MongoDB 6+** (local installation or MongoDB Atlas)
- **npm**
- **Git**

---

## 3. Installation and Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd AutoCare
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and configure the following:

- MySQL connection credentials.
- MongoDB connection URI.
- JWT secret.

**Important:** Never commit `.env.local` or expose database passwords and secret keys on GitHub.

### Step 4: Set Up MySQL Database

Run the database setup command:

```bash
npm run db:setup
```

This executes the database setup scripts, including schema creation, constraints, indexes, routines, triggers, and seed data.

Alternatively, the SQL files can be executed manually in the following order:

1. `database/01_schema.sql`
2. `database/02_alter_constraints_indexes.sql`
3. `database/03_routines_triggers.sql`
4. `database/04_seed_dml.sql`

The file `database/05_queries_tests.sql` contains important queries and database verification examples.

### Step 5: Set Up MongoDB

```bash
npm run mongo:setup
```

This initializes the MongoDB collections, indexes, and sample documents.

### Step 6: Start the Application

```bash
npm run dev
```

Open the application in your browser:

**http://localhost:3000**

---

## 4. Demo Accounts

The following sample accounts are provided for testing the application.

**Password for all demo accounts:** `Password@123`

| Role | Email |
|---|---|
| Admin | admin@autocare.com |
| Staff | ravi@autocare.com |
| Staff | meena@autocare.com |
| Customer | heema@example.com |
| Customer | arjun@example.com |
| Customer | sneha@example.com |

---

## 5. Main Features and Modules

### 5.1 Customer Management
- Customer registration and login.
- Customer information management.
- Vehicle registration and management.
- Access to vehicle service history.

### 5.2 Appointment Management
- Book vehicle service appointments.
- View appointment details and history.
- Manage appointment status.
- Cancel appointments.
- Maintain appointment status change history.

### 5.3 Service Management
- Maintain vehicle service records.
- Track service progress.
- Add spare parts used during servicing.
- Complete service records.
- Manage service-related information.

### 5.4 Spare Parts and Inventory Management
- Manage spare-part information.
- Track available stock.
- Record spare parts used during servicing.
- Monitor low-stock items.

### 5.5 Billing and Payments
- Generate service invoices.
- Calculate service and spare-part costs.
- Calculate applicable tax.
- Record customer payments.
- Track outstanding invoice balances.

### 5.6 Feedback and Inspections
- Store customer feedback.
- Maintain vehicle inspection details.
- Store flexible inspection and feedback documents using MongoDB.

### 5.7 Dashboard and Reports
- View important system information.
- Monitor appointments and service activities.
- View revenue reports.
- Monitor staff workload.
- Search relevant system records.

---

## 6. Database Architecture

AutoCare uses two database technologies to manage structured and flexible data.

### 6.1 MySQL – Relational Database

MySQL acts as the relational core of the application and stores structured data with relationships and integrity constraints.

The database contains **12 main tables**:

1. `USER_ACCOUNT`
2. `CUSTOMER`
3. `STAFF`
4. `VEHICLE`
5. `SERVICE_TYPE`
6. `APPOINTMENT`
7. `SERVICE_RECORD`
8. `SPARE_PART`
9. `SERVICE_PART`
10. `PAYMENT`
11. `INVOICE`
12. `APPOINTMENT_AUDIT`

The database implements:

- Primary keys and foreign keys.
- NOT NULL, UNIQUE and CHECK constraints.
- Indexes for query optimization.
- Views for simplified reporting.
- Stored procedures for reusable operations.
- Functions for database calculations.
- Triggers for automatic database operations.

### 6.2 MongoDB – NoSQL Database

MongoDB is used to store flexible, document-oriented information.

The project contains three main collections:

| Collection | Purpose |
|---|---|
| `feedback` | Stores customer feedback. |
| `inspections` | Stores vehicle inspection details and checklists. |
| `activity_logs` | Stores system activity information. |

MongoDB provides flexibility when storing documents with varying structures.

---

## 7. Database Objects and Advanced Features

The project demonstrates several advanced DBMS concepts.

| Feature | Implementation |
|---|---|
| Tables and Relationships | Relational schema with PK and FK constraints |
| Constraints | CHECK, UNIQUE, NOT NULL and FK |
| Indexes | Database query optimization |
| Views | Appointment details, low stock, revenue, staff workload and invoice balance |
| Stored Procedures | Appointment booking, service management, invoicing and payments |
| Functions | Tax calculation, parts total and warranty expiry |
| Triggers | Service, inventory, invoice, appointment and payment-related operations |
| Transactions | Reliable execution of database operations |
| MongoDB Indexes | Efficient document retrieval and TTL-based indexing |
| MongoDB Aggregation | Document-based data processing |

---

## 8. Project Structure

```text
AutoCare/
│
├── app/
│   ├── api/
│   │   ├── activity/
│   │   ├── appointments/
│   │   ├── dashboard/
│   │   ├── feedback/
│   │   ├── inspections/
│   │   ├── invoices/
│   │   ├── parts/
│   │   ├── payments/
│   │   ├── search/
│   │   ├── services/
│   │   ├── staff/
│   │   ├── users/
│   │   └── vehicles/
│   │
│   ├── appointments/
│   ├── dashboard/
│   ├── invoices/
│   ├── login/
│   ├── parts/
│   ├── register/
│   ├── reports/
│   ├── search/
│   ├── services/
│   ├── users/
│   └── vehicles/
│
├── components/
│   ├── Nav.js
│   └── ui.js
│
├── database/
│   ├── 01_schema.sql
│   ├── 02_alter_constraints_indexes.sql
│   ├── 03_routines_triggers.sql
│   ├── 04_seed_dml.sql
│   └── 05_queries_tests.sql
│
├── docs/
│   ├── DOCUMENTATION.md
│   └── diagrams/
│       ├── ER Diagram
│       └── Relational Schema
│
├── lib/
│   ├── api.js
│   ├── appointments.js
│   ├── auth.js
│   ├── client.js
│   ├── db.js
│   └── mongo.js
│
├── scripts/
│   ├── setup-db.js
│   └── setup-mongo.js
│
├── middleware.js
├── package.json
├── package-lock.json
└── README.md
```

---

## 9. Requirement Coverage

The following table maps the project requirements to their implementation.

| Requirement | Implementation |
|---|---|
| SQL + NoSQL databases | MySQL with 12 tables and MongoDB with 3 collections |
| ER Diagram and Relational Schema | `docs/diagrams/` |
| DDL operations | `01_schema.sql`, `02_alter_constraints_indexes.sql` |
| DML operations | `04_seed_dml.sql`, `05_queries_tests.sql` |
| Joins, GROUP BY, HAVING, ORDER BY and Subqueries | `05_queries_tests.sql` and API routes |
| Advanced DBMS features | Transactions, procedures, functions, triggers, views and indexes |
| Next.js UI and API layer | `app/` |
| Environment-based configuration | `.env.local` |
| Password security | bcryptjs password hashing |
| Authentication | JWT in HTTP-only cookies |
| Role-based access | Admin, Staff and Customer |
| Database-level validation | CHECK, UNIQUE, NOT NULL, FK constraints and triggers |
| Project Documentation | `docs/DOCUMENTATION.md` |

---

## 10. Security Features

- Password hashing using bcryptjs.
- JWT-based authentication.
- HTTP-only authentication cookies.
- Role-based access control for Admin, Staff and Customer.
- Parameterized SQL queries to help prevent SQL injection.
- Environment variables for sensitive configuration.

---

## 11. Team Contributions

The project is developed by a two-member team, with responsibilities divided across database development and application modules.

### Person 1 – Database Foundation and Customer & Appointment Management

- Designing the relational database schema.
- Creating tables, relationships, constraints and indexes.
- Developing database views.
- Implementing customer and vehicle management.
- Implementing appointment booking and management.
- Preparing ER and relational schema diagrams.

### Person 2 – Service Management, Billing and MongoDB

- Implementing service-related stored procedures and triggers.
- Developing spare-part and inventory management.
- Implementing invoice generation and payment management.
- Setting up MongoDB collections and operations.
- Developing feedback and inspection modules.
- Supporting dashboards, reports and search functionality.

**Shared Responsibilities:** Database testing, application integration, debugging, documentation and final project demonstration.

---

## 12. Git Workflow

Each team member works on an individual feature branch and contributes through pull requests.

Example branches:

- `feature/customer-appointments` – Person 1
- `feature/service-billing-mongodb` – Person 2

Basic Git workflow:

```bash
git checkout -b feature/your-feature
git add .
git commit -m "feat: describe your changes"
git push -u origin feature/your-feature
```

Changes are reviewed and merged into the main branch through GitHub Pull Requests.

---

## 13. Future Enhancements

- Online payment gateway integration.
- Automated appointment reminders.
- Email and SMS notifications.
- Advanced service analytics.
- Predictive vehicle maintenance recommendations.
- Customer-facing mobile application.
- Inventory forecasting and automated stock alerts.

---

## 14. Conclusion

AutoCare provides an integrated solution for managing vehicle servicing operations. By combining MySQL and MongoDB, the project demonstrates how relational and NoSQL databases can work together in a real-world application.

The system covers the major stages of vehicle servicing, including customer registration, appointment booking, service management, spare-part tracking, billing, payments and feedback.

It demonstrates the practical application of DBMS concepts along with full-stack web application development.

---

**Project:** AutoCare – Vehicle Service & Maintenance Management System  
**Course:** DBMS Experiential Learning – Level 3  
**Team:** 4 | Section D | PES University  
**Team Size:** 2 Members  
**Databases:** MySQL 8 and MongoDB  
**Framework:** Next.js 14
