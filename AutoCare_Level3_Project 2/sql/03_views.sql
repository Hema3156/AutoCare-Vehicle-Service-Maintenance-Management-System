-- AutoCare | Views (advanced feature: views). Used by the Next.js app and by 06_queries.sql
USE AutoCareDB;

CREATE OR REPLACE VIEW v_appointment_details AS
SELECT a.Appointment_ID, a.Appointment_DateTime, a.Status, a.Problem_Description,
       v.Vehicle_ID, v.Registration_No, v.Make, v.Model, CONCAT(v.Make,' ',v.Model) AS Vehicle,
       c.Customer_ID, cu.Name AS Customer_Name, cu.Phone AS Customer_Phone,
       st.Service_ID, st.Service_Name, st.Base_Price, st.Warranty_Days,
       s.Staff_ID, su.Name AS Staff_Name
FROM APPOINTMENT a
JOIN VEHICLE v       ON v.Vehicle_ID = a.Vehicle_ID
JOIN CUSTOMER c      ON c.Customer_ID = v.Customer_ID
JOIN USER_ACCOUNT cu ON cu.User_ID = c.User_ID
JOIN SERVICE_TYPE st ON st.Service_ID = a.Service_ID
LEFT JOIN STAFF s    ON s.Staff_ID = a.Staff_ID
LEFT JOIN USER_ACCOUNT su ON su.User_ID = s.User_ID;

CREATE OR REPLACE VIEW v_invoice_balance AS
SELECT i.Invoice_ID, i.Appointment_ID, i.Invoice_Date, i.Subtotal, i.Tax, i.Total_Amount, i.Status,
       COALESCE(SUM(CASE WHEN p.Payment_Status='Completed' THEN p.Amount END),0) AS Paid_Amount,
       i.Total_Amount - COALESCE(SUM(CASE WHEN p.Payment_Status='Completed' THEN p.Amount END),0) AS Balance_Due
FROM INVOICE i
LEFT JOIN PAYMENT p ON p.Appointment_ID = i.Appointment_ID
GROUP BY i.Invoice_ID, i.Appointment_ID, i.Invoice_Date, i.Subtotal, i.Tax, i.Total_Amount, i.Status;

CREATE OR REPLACE VIEW v_low_stock_parts AS
SELECT Part_ID, Part_Name, Part_Number, Stock_Qty, Reorder_Level, (Reorder_Level - Stock_Qty) AS Shortfall
FROM SPARE_PART
WHERE Stock_Qty <= Reorder_Level;

CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT DATE_FORMAT(Payment_Date,'%Y-%m') AS Month, COUNT(*) AS Payments, SUM(Amount) AS Revenue
FROM PAYMENT
WHERE Payment_Status = 'Completed'
GROUP BY DATE_FORMAT(Payment_Date,'%Y-%m');

CREATE OR REPLACE VIEW v_staff_workload AS
SELECT s.Staff_ID, u.Name, s.Designation,
       COUNT(a.Appointment_ID) AS Total_Appointments,
       COALESCE(SUM(a.Status IN ('Scheduled','In Progress')),0) AS Open_Jobs,
       COALESCE(SUM(a.Status='Completed'),0) AS Completed
FROM STAFF s
JOIN USER_ACCOUNT u ON u.User_ID = s.User_ID
LEFT JOIN APPOINTMENT a ON a.Staff_ID = s.Staff_ID
GROUP BY s.Staff_ID, u.Name, s.Designation;
