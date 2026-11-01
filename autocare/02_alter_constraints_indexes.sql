-- =====================================================================
-- File 2/5 : ALTER, CHECK constraints, INDEXES, FULLTEXT, VIEWS
-- =====================================================================
USE AutoCareDB;

-- ---------- ALTER: new columns ----------
ALTER TABLE USER_ACCOUNT ADD COLUMN Is_Active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE APPOINTMENT  ADD COLUMN Created_At DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE VEHICLE      ADD COLUMN Odometer_KM INT DEFAULT 0;
ALTER TABLE VEHICLE      MODIFY COLUMN Fuel_Type VARCHAR(30) NOT NULL DEFAULT 'Petrol';

-- ---------- ALTER: database-level validation (CHECK constraints) ----------
ALTER TABLE USER_ACCOUNT
  ADD CONSTRAINT chk_user_role  CHECK (Role IN ('Admin','Staff','Customer')),
  ADD CONSTRAINT chk_user_email CHECK (Email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
  ADD CONSTRAINT chk_user_phone CHECK (Phone IS NULL OR Phone REGEXP '^[0-9+]{10,15}$');
ALTER TABLE VEHICLE
  ADD CONSTRAINT chk_vehicle_year CHECK (Year IS NULL OR Year BETWEEN 1980 AND 2100),
  ADD CONSTRAINT chk_vehicle_fuel CHECK (Fuel_Type IN ('Petrol','Diesel','CNG','Electric','Hybrid')),
  ADD CONSTRAINT chk_vehicle_odo  CHECK (Odometer_KM >= 0);
ALTER TABLE SERVICE_TYPE
  ADD CONSTRAINT chk_service_price    CHECK (Base_Price >= 0),
  ADD CONSTRAINT chk_service_duration CHECK (Estimated_Duration IS NULL OR Estimated_Duration > 0),
  ADD CONSTRAINT chk_service_warranty CHECK (Warranty_Days >= 0);
ALTER TABLE APPOINTMENT
  ADD CONSTRAINT chk_appt_status CHECK (Status IN ('Scheduled','In Progress','Completed','Cancelled'));
ALTER TABLE SERVICE_RECORD
  ADD CONSTRAINT chk_sr_costs CHECK (Labor_Cost >= 0 AND Total_Cost >= 0);
ALTER TABLE SPARE_PART
  ADD CONSTRAINT chk_part_stock CHECK (Stock_Qty >= 0),
  ADD CONSTRAINT chk_part_price CHECK (Unit_Price > 0),
  ADD CONSTRAINT chk_part_reorder CHECK (Reorder_Level >= 0);
ALTER TABLE SERVICE_PART
  ADD CONSTRAINT chk_sp_qty  CHECK (Quantity > 0),
  ADD CONSTRAINT chk_sp_cost CHECK (Unit_Cost >= 0);
ALTER TABLE PAYMENT
  ADD CONSTRAINT chk_pay_amount CHECK (Amount > 0),
  ADD CONSTRAINT chk_pay_method CHECK (Payment_Method IN ('Cash','Card','UPI','NetBanking')),
  ADD CONSTRAINT chk_pay_status CHECK (Payment_Status IN ('Pending','Paid','Failed','Refunded'));
ALTER TABLE INVOICE
  ADD CONSTRAINT chk_inv_amounts CHECK (Subtotal >= 0 AND Tax >= 0 AND Total_Amount = Subtotal + Tax),
  ADD CONSTRAINT chk_inv_status  CHECK (Status IN ('Unpaid','Partially Paid','Paid','Cancelled'));

-- ---------- INDEXES ----------
CREATE INDEX idx_appt_datetime ON APPOINTMENT (Appointment_DateTime);
CREATE INDEX idx_appt_status_dt ON APPOINTMENT (Status, Appointment_DateTime);
CREATE UNIQUE INDEX uq_appt_staff_slot ON APPOINTMENT (Staff_ID, Appointment_DateTime);
CREATE INDEX idx_vehicle_make_model ON VEHICLE (Make, Model);
CREATE INDEX idx_payment_date ON PAYMENT (Payment_Date);
CREATE INDEX idx_payment_appt ON PAYMENT (Appointment_ID, Payment_Status);
CREATE INDEX idx_part_stock ON SPARE_PART (Stock_Qty, Reorder_Level);
CREATE INDEX idx_user_role ON USER_ACCOUNT (Role);

-- ---------- FULL-TEXT SEARCH ----------
ALTER TABLE SERVICE_TYPE    ADD FULLTEXT INDEX ft_service (Service_Name, Description);
ALTER TABLE APPOINTMENT     ADD FULLTEXT INDEX ft_problem (Problem_Description);
ALTER TABLE SERVICE_RECORD  ADD FULLTEXT INDEX ft_diagnosis (Diagnosis, Inspection_Summary);
ALTER TABLE SPARE_PART      ADD FULLTEXT INDEX ft_part (Part_Name);

-- ---------- DROP demo (index + table) ----------
CREATE TABLE TMP_SCRATCH (id INT PRIMARY KEY, note VARCHAR(50));
DROP TABLE TMP_SCRATCH;
CREATE INDEX idx_tmp_demo ON PAYMENT (Transaction_Ref, Amount);
DROP INDEX idx_tmp_demo ON PAYMENT;

-- ---------- VIEWS ----------
CREATE OR REPLACE VIEW vw_appointment_details AS
SELECT a.Appointment_ID, a.Appointment_DateTime, a.Status, a.Problem_Description,
       v.Vehicle_ID, v.Registration_No, v.Make, v.Model,
       c.Customer_ID, cu.Name AS Customer_Name, cu.Phone AS Customer_Phone,
       st.Service_ID, st.Service_Name, st.Base_Price,
       s.Staff_ID, su.Name AS Staff_Name
FROM APPOINTMENT a
JOIN VEHICLE v        ON v.Vehicle_ID = a.Vehicle_ID
JOIN CUSTOMER c       ON c.Customer_ID = v.Customer_ID
JOIN USER_ACCOUNT cu  ON cu.User_ID = c.User_ID
JOIN SERVICE_TYPE st  ON st.Service_ID = a.Service_ID
LEFT JOIN STAFF s     ON s.Staff_ID = a.Staff_ID
LEFT JOIN USER_ACCOUNT su ON su.User_ID = s.User_ID;

CREATE OR REPLACE VIEW vw_low_stock_parts AS
SELECT Part_ID, Part_Name, Part_Number, Stock_Qty, Reorder_Level,
       (Reorder_Level - Stock_Qty) AS Shortfall
FROM SPARE_PART WHERE Stock_Qty <= Reorder_Level;

CREATE OR REPLACE VIEW vw_revenue_by_service AS
SELECT st.Service_ID, st.Service_Name, COUNT(i.Invoice_ID) AS Invoices,
       COALESCE(SUM(i.Total_Amount),0) AS Revenue
FROM SERVICE_TYPE st
LEFT JOIN APPOINTMENT a ON a.Service_ID = st.Service_ID
LEFT JOIN INVOICE i     ON i.Appointment_ID = a.Appointment_ID AND i.Status <> 'Cancelled'
GROUP BY st.Service_ID, st.Service_Name;

CREATE OR REPLACE VIEW vw_staff_workload AS
SELECT s.Staff_ID, u.Name AS Staff_Name, s.Designation,
       COALESCE(SUM(a.Status = 'Scheduled'),0)   AS Scheduled,
       COALESCE(SUM(a.Status = 'In Progress'),0) AS In_Progress,
       COALESCE(SUM(a.Status = 'Completed'),0)   AS Completed
FROM STAFF s
JOIN USER_ACCOUNT u ON u.User_ID = s.User_ID
LEFT JOIN APPOINTMENT a ON a.Staff_ID = s.Staff_ID
GROUP BY s.Staff_ID, u.Name, s.Designation;

CREATE OR REPLACE VIEW vw_invoice_balance AS
SELECT i.Invoice_ID, i.Appointment_ID, i.Total_Amount, i.Status,
       COALESCE(SUM(CASE WHEN p.Payment_Status='Paid' THEN p.Amount END),0) AS Paid_Amount,
       i.Total_Amount - COALESCE(SUM(CASE WHEN p.Payment_Status='Paid' THEN p.Amount END),0) AS Balance_Due
FROM INVOICE i LEFT JOIN PAYMENT p ON p.Appointment_ID = i.Appointment_ID
GROUP BY i.Invoice_ID, i.Appointment_ID, i.Total_Amount, i.Status;
