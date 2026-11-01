-- =====================================================================
-- File 5/5 : IMPORTANT QUERIES + INTEGRITY TESTS
-- =====================================================================
USE AutoCareDB;

-- Q1 JOIN: appointment details (via view)
SELECT Appointment_ID, Customer_Name, Registration_No, Service_Name, Staff_Name, Status
FROM vw_appointment_details ORDER BY Appointment_DateTime;

-- Q2 GROUP BY + HAVING + aggregate: customers who spent more than 3000
SELECT cu.Name, COUNT(DISTINCT a.Appointment_ID) AS Visits, SUM(i.Total_Amount) AS Total_Spent
FROM INVOICE i
JOIN APPOINTMENT a ON a.Appointment_ID = i.Appointment_ID
JOIN VEHICLE v ON v.Vehicle_ID = a.Vehicle_ID
JOIN CUSTOMER c ON c.Customer_ID = v.Customer_ID
JOIN USER_ACCOUNT cu ON cu.User_ID = c.User_ID
GROUP BY cu.User_ID, cu.Name HAVING SUM(i.Total_Amount) > 3000
ORDER BY Total_Spent DESC;

-- Q3 Subquery: vehicles never serviced (no completed appointment)
SELECT Vehicle_ID, Registration_No, Make, Model FROM VEHICLE
WHERE Vehicle_ID NOT IN (SELECT Vehicle_ID FROM APPOINTMENT WHERE Status = 'Completed');

-- Q4 Correlated subquery: service types priced above the average
SELECT Service_Name, Base_Price FROM SERVICE_TYPE
WHERE Base_Price > (SELECT AVG(Base_Price) FROM SERVICE_TYPE) ORDER BY Base_Price DESC;

-- Q5 Low stock parts needing reorder (view)
SELECT * FROM vw_low_stock_parts;

-- Q6 Revenue by service type (view)
SELECT * FROM vw_revenue_by_service ORDER BY Revenue DESC;

-- Q7 Outstanding invoices (view)
SELECT * FROM vw_invoice_balance WHERE Balance_Due > 0;

-- Q8 Most used spare parts
SELECT sp.Part_Name, SUM(s.Quantity) AS Units_Used, SUM(s.Quantity * s.Unit_Cost) AS Value_Used
FROM SERVICE_PART s JOIN SPARE_PART sp ON sp.Part_ID = s.Part_ID
GROUP BY sp.Part_ID, sp.Part_Name ORDER BY Units_Used DESC;

-- Q9 Full-text search (natural language mode)
SELECT Appointment_ID, Problem_Description,
       MATCH(Problem_Description) AGAINST ('brakes noise' IN NATURAL LANGUAGE MODE) AS Relevance
FROM APPOINTMENT WHERE MATCH(Problem_Description) AGAINST ('brakes noise' IN NATURAL LANGUAGE MODE)
ORDER BY Relevance DESC;

-- Q10 Warranty expiry (function) and staff workload (view)
SELECT Appointment_ID, fn_warranty_expiry(Appointment_ID) AS Warranty_Until FROM SERVICE_RECORD;
SELECT * FROM vw_staff_workload;

-- Q11 Audit trail written by trigger
SELECT * FROM APPOINTMENT_AUDIT ORDER BY Audit_ID;

-- Q12 EXPLAIN shows index usage
EXPLAIN SELECT * FROM APPOINTMENT WHERE Status = 'Scheduled' AND Appointment_DateTime > '2026-09-01';

-- ---------------- INTEGRITY TESTS (each statement is expected to FAIL) ----------------
-- T1 invalid role            -> chk_user_role
-- INSERT INTO USER_ACCOUNT (Name,Email,Password_Hash,Role) VALUES ('X','x@y.com','h','Hacker');
-- T2 negative stock          -> chk_part_stock
-- UPDATE SPARE_PART SET Stock_Qty = -1 WHERE Part_ID = 1;
-- T3 insufficient stock      -> trigger trg_sp_bi
-- CALL sp_add_part_to_service(1, 6, 999);
-- T4 invoice for open appt   -> trigger trg_inv_check_appt
-- CALL sp_generate_invoice(5, @x);
-- T5 overpayment             -> sp_record_payment
-- CALL sp_record_payment(1, 99999, 'Cash', 'T5');
-- T6 delete service in use   -> FK RESTRICT
-- DELETE FROM SERVICE_TYPE WHERE Service_ID = 1;
