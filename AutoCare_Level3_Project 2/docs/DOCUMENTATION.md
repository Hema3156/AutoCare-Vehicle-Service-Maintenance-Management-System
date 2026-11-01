# AutoCare: Vehicle Service & Maintenance Management System
**DBMS Level 3 Project Documentation** – Team 4, Section D (Heemadhawala R – PES2UG24CS190, Heemavathi E – PES2UG24CS193)

## 1. Problem statement
Independent vehicle service centres typically run on phone calls and paper job cards. Appointments clash, mechanics are double-booked, spare-part stock goes negative or runs out unnoticed, invoices are computed by hand, and customers cannot see their service history or what they owe. AutoCare is a database-driven platform that manages the whole workflow: customer and vehicle records, appointment booking, job execution, spare-part inventory, invoicing with GST, payments, and post-service feedback.

## 2. Objectives
- Model the service workflow with a normalised relational schema that enforces integrity in the database itself.
- Automate business rules (stock deduction, totals, invoice status, double-booking prevention) with triggers and stored routines.
- Provide role-based web access for Admin, Staff (mechanics) and Customers.
- Store flexible, evolving data (inspection checklists, feedback, audit logs) in MongoDB and analyse it with aggregation.

## 3. Scope
In scope: user accounts and roles, customers and vehicles, service catalogue, appointments, service records, parts inventory, invoices, payments, feedback, reports. Out of scope: real payment gateway, SMS/e-mail notifications, multi-branch support.

## 4. Functional requirements
| ID | Requirement |
|---|---|
| FR1 | Register/login; passwords hashed; session cookie (JWT). |
| FR2 | Customers manage their vehicles and book appointments; past dates and clashes are rejected. |
| FR3 | Admin assigns mechanics; mechanics start and complete their own jobs only. |
| FR4 | Completing a job records inspection, diagnosis, labour and parts in one transaction and generates an 18% GST invoice. |
| FR5 | Parts stock is deducted automatically; insufficient stock aborts the whole completion. Admin/staff restock parts. |
| FR6 | Customers/admin record payments (partial or full); invoice status updates automatically; overpayment rejected. |
| FR7 | Full-text search across problems and diagnoses. |
| FR8 | Customers leave feedback; staff record inspection checklists (MongoDB). |
| FR9 | Dashboards and reports (SQL views, GROUP BY/HAVING, MongoDB aggregation). |

## 5. Database choice and justification
| Data | Store | Why |
|---|---|---|
| Users, customers, staff, vehicles, appointments, service records, parts, invoices, payments | **MySQL** | Strongly structured, highly relational, needs ACID transactions (stock + billing + payments), foreign keys, CHECK constraints and triggers. Money and inventory must never be inconsistent. |
| Inspection checklists, customer feedback, audit logs | **MongoDB** | Semi-structured and varying: checklist items differ per vehicle/service, feedback has free-form tags and comments, logs are append-only with TTL expiry. Document model avoids many sparse columns/joins and suits `$group/$unwind` analytics. |

## 6. ER diagram and relational schema
See the ER diagram and relational schema delivered earlier (`team-_4_AutoCare_ER_Diagram_WITH_CONNECTIONS.drawio`, `team_4_AutoCare_Relational_Schema_BLACK_DRAWIO__1_.drawio`; PDF copy in `team_4_Diagrams.pdf`). Entities: USER_ACCOUNT, CUSTOMER, STAFF, VEHICLE, SERVICE_TYPE, APPOINTMENT, SERVICE_RECORD, SPARE_PART, SERVICE_PART (M:N between SERVICE_RECORD and SPARE_PART), PAYMENT, INVOICE, plus INVENTORY_LOG added in Level 3 for stock movement auditing.

Key relationships: USER_ACCOUNT 1–1 CUSTOMER/STAFF; CUSTOMER 1–N VEHICLE; VEHICLE 1–N APPOINTMENT; SERVICE_TYPE 1–N APPOINTMENT; STAFF 1–N APPOINTMENT; APPOINTMENT 1–1 SERVICE_RECORD; APPOINTMENT 1–1 INVOICE; APPOINTMENT 1–N PAYMENT; SERVICE_RECORD M–N SPARE_PART.

## 7. Data dictionary (summary)
| Table | Columns (PK underlined by `*`, FK by `→`) |
|---|---|
| USER_ACCOUNT | User_ID*, Name, Email (unique), Phone (unique), Password_Hash, Role (Admin/Staff/Customer), Created_At |
| CUSTOMER | Customer_ID*, User_ID→ (unique), Address |
| STAFF | Staff_ID*, User_ID→ (unique), Designation, Hire_Date |
| VEHICLE | Vehicle_ID*, Customer_ID→, Registration_No (unique), Make, Model, Year (1980–2100), Fuel_Type (enum CHECK) |
| SERVICE_TYPE | Service_ID*, Service_Name, Description, Base_Price ≥ 0, Estimated_Duration > 0, Warranty_Days ≥ 0 |
| APPOINTMENT | Appointment_ID*, Vehicle_ID→, Service_ID→, Staff_ID→ (nullable), Appointment_DateTime, Status (Scheduled/In Progress/Completed/Cancelled), Problem_Description |
| SERVICE_RECORD | Service_Record_ID*, Appointment_ID→ (unique), Inspection_Summary, Diagnosis, Labor_Cost, Total_Cost, Completed_Date |
| SPARE_PART | Part_ID*, Part_Name, Part_Number (unique), Stock_Qty ≥ 0, Unit_Price ≥ 0, Reorder_Level ≥ 0 |
| SERVICE_PART | (Service_Record_ID→, Part_ID→)*, Quantity > 0, Unit_Cost ≥ 0 |
| PAYMENT | Payment_ID*, Appointment_ID→, Payment_Date, Amount > 0, Payment_Method, Payment_Status, Transaction_Ref (unique) |
| INVOICE | Invoice_ID*, Appointment_ID→ (unique), Invoice_Date, Subtotal, Tax, Total_Amount, Status (Unpaid/Partially Paid/Paid/Cancelled) |
| INVENTORY_LOG | Log_ID*, Part_ID→, Change_Qty, Reason, Logged_At |

Referential actions: customer/vehicle deletion cascades; service type, vehicle and part deletion is RESTRICTed when referenced; deleting staff sets appointment mechanic to NULL.

## 8. SQL implementation
Files in `sql/`, executed in order by `npm run db:setup`:
- `01_ddl.sql` – CREATE DATABASE/TABLE with PK, FK, UNIQUE, NOT NULL, DEFAULT.
- `02_alter_indexes.sql` – **ALTER** (added CHECK constraints, new columns), **CREATE INDEX** (composite and single), **FULLTEXT** indexes, **DROP** demonstration.
- `03_views.sql` – `v_appointment_details`, `v_invoice_balance`, `v_low_stock_parts`, `v_monthly_revenue`, `v_staff_workload`.
- `04_routines_triggers.sql` – functions `fn_invoice_balance`, `fn_warranty_valid`, `fn_staff_is_free`; procedures `sp_book_appointment`, `sp_generate_invoice`, `sp_complete_service`, `sp_record_payment`, `sp_restock_part`; 9 triggers (stock check/deduct/restore, service-record totals, invoice status on payment, appointment status lifecycle guard).
- `05_seed_dml.sql` – sample data (INSERT). `06_queries.sql` – important queries plus UPDATE/DELETE/transaction demos.

### Advanced database concepts demonstrated (requirement: ≥ 4)
1. **Transactions** – `sp_complete_service`, `sp_record_payment` (START TRANSACTION / COMMIT / ROLLBACK on error with row locking).
2. **Views** – five views used by the dashboard and reports.
3. **Stored procedures and functions** – listed above.
4. **Triggers** – automatic stock deduction, totals, invoice status, validation.
5. **Indexing** – composite indexes aligned to dashboard filters.
6. **Full-text search** – `MATCH ... AGAINST` over problems/diagnoses.
7. **NoSQL aggregation** – `$group`, `$unwind`, `$match`, `$sort` in MongoDB.

### Data validation and integrity at database level
CHECK constraints (roles, statuses, price/stock/quantity ranges, year, fuel type), NOT NULL, UNIQUE, FKs with explicit ON DELETE/UPDATE, trigger-enforced rules via `SIGNAL`. The API maps these errors to friendly 400/409 responses.

## 9. MongoDB implementation
Database `autocare`, collections:
- `inspection_checklists`: `{appointment_id, vehicle_id, items:[{name, status(OK/Needs Attention/Replaced), notes}], created_at}`. Indexes: unique `appointment_id`; `{vehicle_id, created_at}`; multikey `items.status`.
- `feedback`: `{appointment_id, service_id, service_name, staff_id, rating, comment, tags[]}`. Indexes: unique `appointment_id`; `{service_id, rating}`; `staff_id`; text index on comment+tags.
- `audit_logs`: `{ts, actor, action, entity, details}`; index on `ts` and a TTL index (90 days).
Aggregations: average rating per service (`$group`), top tags (`$unwind`+`$group`), most-flagged checklist items (`$unwind`+`$match`+`$group`). Vector search was not used because the data is not text-similarity driven; the choice is documented under Option 1 (SQL + NoSQL).

## 10. Important queries
See `sql/06_queries.sql`: Q1 join over a view; Q2 GROUP BY revenue per service; HAVING for top customers (>₹5000); subqueries (vehicles never serviced, least busy mechanic); LEFT JOIN workload; outstanding invoices view; monthly revenue view; full-text search; warranty function; inventory log; UPDATE/DELETE and transaction examples.

## 11. System architecture
Browser → Next.js pages (server components) → Next.js Route Handlers (`app/api/*`) → guard layer (JWT cookie, role check) → MySQL (mysql2 pool, parameterised queries, stored routines) and MongoDB (official driver). `middleware.js` redirects unauthenticated users and blocks role-restricted pages. Configuration (DB host, users, passwords, JWT secret) comes from environment variables in `.env.local` (git-ignored); the app connects with a least-privilege MySQL account (`autocare_app`: SELECT/INSERT/UPDATE/DELETE/EXECUTE only).

## 12. Authentication, authorization and security
- Three roles: Admin, Staff, Customer. Admin: everything incl. assignment, services, reports. Staff: own jobs, parts, billing view. Customer: own vehicles, appointments, invoices, payments, feedback.
- Passwords stored as bcrypt hashes; JWT in httpOnly cookie; secrets only in env vars.
- All SQL is parameterised (injection test T03); ownership checks on customer resources; least-privilege DB user.

## 13. Application screenshots
Screenshots must be captured from the running app and pasted here (not generated automatically). Suggested set: Login, Dashboard (Admin), Appointments list/detail, Complete-job form, Parts with low-stock alert, Billing/payment, Search, Reports (SQL + MongoDB), Customer dashboard.

## 14. Testing results
`npm test` – 54 automated integration tests (authentication, RBAC, constraints, triggers, procedures, transactions/rollback, payments, full-text search, page access). **Result on MariaDB-compatible MySQL server: 54/54 passed.** MongoDB-backed features (checklists, feedback, aggregation reports) were not exercised in the build environment because no MongoDB server was available; they must be verified once on the team's machine with `npm run db:seed-mongo`.

Defects found and fixed during final verification: (a) `sp_complete_service` failed with error 1442 because an `INSERT … SELECT` from SPARE_PART conflicted with the stock-deduction trigger – rewritten to insert lines one by one; (b) CHECK-constraint errors were not mapped to HTTP 400 on servers using errno 4025 – mapping extended; (c) `03_views.sql` was missing although the app and queries depend on those views – added.

## 15. Conclusion and future enhancements
AutoCare goes beyond CRUD by pushing business rules into the database (transactions, triggers, routines) while using MongoDB where flexible documents fit better. Future work: payment gateway, SMS/e-mail reminders, vector search over diagnoses to find similar past repairs, multi-branch support, PDF invoices, and CI-based test runs.

## 16. Team contributions
Fill in before submission (commits should show this): e.g. Member 1 – schema, SQL routines/triggers, tests; Member 2 – Next.js UI, API routes, MongoDB.
