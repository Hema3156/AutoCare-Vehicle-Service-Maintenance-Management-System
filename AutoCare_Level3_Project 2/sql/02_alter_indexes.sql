-- AutoCare | Step 2: ALTER, constraints, indexes, DROP
USE AutoCareDB;

-- ---------- Domain / validation constraints (DB-level validation) ----------
ALTER TABLE USER_ACCOUNT
  ADD CONSTRAINT chk_user_role  CHECK (Role IN ('Admin','Staff','Customer')),
  ADD CONSTRAINT chk_user_email CHECK (Email LIKE '%_@_%._%'),
  ADD CONSTRAINT chk_user_phone CHECK (Phone IS NULL OR Phone REGEXP '^[0-9+]{10,15}$');

ALTER TABLE VEHICLE
  ADD CONSTRAINT chk_vehicle_year CHECK (Year IS NULL OR Year BETWEEN 1980 AND 2100),
  ADD CONSTRAINT chk_vehicle_fuel CHECK (Fuel_Type IS NULL OR Fuel_Type IN ('Petrol','Diesel','CNG','Electric','Hybrid'));

ALTER TABLE SERVICE_TYPE
  ADD CONSTRAINT chk_service_price    CHECK (Base_Price >= 0),
  ADD CONSTRAINT chk_service_duration CHECK (Estimated_Duration IS NULL OR Estimated_Duration > 0),
  ADD CONSTRAINT chk_service_warranty CHECK (Warranty_Days IS NULL OR Warranty_Days >= 0);

ALTER TABLE APPOINTMENT
  ADD CONSTRAINT chk_appt_status CHECK (Status IN ('Scheduled','In Progress','Completed','Cancelled'));

ALTER TABLE SERVICE_RECORD
  ADD CONSTRAINT chk_sr_costs CHECK (Labor_Cost >= 0 AND Total_Cost >= 0 AND Total_Cost >= Labor_Cost);

ALTER TABLE SPARE_PART
  ADD CONSTRAINT chk_part_stock CHECK (Stock_Qty >= 0),
  ADD CONSTRAINT chk_part_price CHECK (Unit_Price >= 0),
  ADD CONSTRAINT chk_part_reorder CHECK (Reorder_Level >= 0);

ALTER TABLE SERVICE_PART
  ADD CONSTRAINT chk_sp_qty  CHECK (Quantity > 0),
  ADD CONSTRAINT chk_sp_cost CHECK (Unit_Cost >= 0);

ALTER TABLE PAYMENT
  ADD CONSTRAINT chk_pay_amount CHECK (Amount > 0),
  ADD CONSTRAINT chk_pay_method CHECK (Payment_Method IN ('Cash','Card','UPI','NetBanking')),
  ADD CONSTRAINT chk_pay_status CHECK (Payment_Status IN ('Pending','Completed','Failed','Refunded'));

ALTER TABLE INVOICE
  ADD CONSTRAINT chk_inv_amounts CHECK (Subtotal >= 0 AND Tax >= 0 AND Total_Amount = Subtotal + Tax),
  ADD CONSTRAINT chk_inv_status  CHECK (Status IN ('Unpaid','Partially Paid','Paid','Cancelled'));

-- ---------- Extra column via ALTER (inventory audit) ----------
ALTER TABLE SPARE_PART ADD COLUMN Last_Restocked DATETIME NULL AFTER Reorder_Level;

-- ---------- Indexes ----------
CREATE INDEX idx_appt_datetime      ON APPOINTMENT (Appointment_DateTime);
CREATE INDEX idx_appt_status_date   ON APPOINTMENT (Status, Appointment_DateTime);
CREATE INDEX idx_appt_staff_date    ON APPOINTMENT (Staff_ID, Appointment_DateTime);
CREATE INDEX idx_payment_appt       ON PAYMENT (Appointment_ID, Payment_Status);
CREATE INDEX idx_invoice_status     ON INVOICE (Status);
CREATE INDEX idx_part_name          ON SPARE_PART (Part_Name);
CREATE INDEX idx_user_role          ON USER_ACCOUNT (Role);

-- ---------- Full-text search ----------
CREATE FULLTEXT INDEX ft_service_search ON SERVICE_TYPE (Service_Name, Description);
CREATE FULLTEXT INDEX ft_appt_problem   ON APPOINTMENT (Problem_Description);
CREATE FULLTEXT INDEX ft_sr_diagnosis   ON SERVICE_RECORD (Diagnosis, Inspection_Summary);

-- ---------- DROP demonstration (temporary table, safe) ----------
CREATE TABLE TEMP_AUDIT_DEMO (id INT PRIMARY KEY, note VARCHAR(50));
ALTER TABLE TEMP_AUDIT_DEMO ADD COLUMN created DATETIME DEFAULT CURRENT_TIMESTAMP;
DROP TABLE TEMP_AUDIT_DEMO;
