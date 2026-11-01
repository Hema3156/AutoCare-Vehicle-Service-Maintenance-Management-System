-- AutoCare | Step 6: Important queries and DML demonstrations
USE AutoCareDB;

-- Q1 JOIN: upcoming appointments with customer, vehicle, service and mechanic
SELECT Appointment_ID, Appointment_DateTime, Customer_Name, Registration_No, Service_Name, COALESCE(Staff_Name,'Unassigned') AS Mechanic
FROM v_appointment_details
WHERE Status = 'Scheduled' AND Appointment_DateTime >= NOW()
ORDER BY Appointment_DateTime;

-- Q2 GROUP BY + aggregates: revenue and job count per service type
SELECT s.Service_Name, COUNT(*) AS Jobs, SUM(sr.Total_Cost) AS Billed, ROUND(AVG(sr.Total_Cost),2) AS Avg_Job_Value
FROM SERVICE_RECORD sr
JOIN APPOINTMENT a ON a.Appointment_ID = sr.Appointment_ID
JOIN SERVICE_TYPE s ON s.Service_ID = a.Service_ID
GROUP BY s.Service_ID, s.Service_Name
ORDER BY Billed DESC;

-- Q3 HAVING: customers who have spent more than Rs. 5,000 in total
SELECT cu.Name, COUNT(DISTINCT v.Vehicle_ID) AS Vehicles, SUM(i.Total_Amount) AS Total_Billed
FROM CUSTOMER c
JOIN USER_ACCOUNT cu ON cu.User_ID = c.User_ID
JOIN VEHICLE v ON v.Customer_ID = c.Customer_ID
JOIN APPOINTMENT a ON a.Vehicle_ID = v.Vehicle_ID
JOIN INVOICE i ON i.Appointment_ID = a.Appointment_ID
GROUP BY c.Customer_ID, cu.Name
HAVING SUM(i.Total_Amount) > 5000
ORDER BY Total_Billed DESC;

-- Q4 Subquery: vehicles that have never had a completed service
SELECT Registration_No, Make, Model FROM VEHICLE
WHERE Vehicle_ID NOT IN (SELECT a.Vehicle_ID FROM APPOINTMENT a WHERE a.Status = 'Completed');

-- Q5 Correlated subquery: services priced above the average of all services
SELECT Service_Name, Base_Price FROM SERVICE_TYPE
WHERE Base_Price > (SELECT AVG(Base_Price) FROM SERVICE_TYPE) ORDER BY Base_Price DESC;

-- Q6 Subquery in FROM: most-used spare part per quantity
SELECT p.Part_Name, t.Total_Used
FROM (SELECT Part_ID, SUM(Quantity) AS Total_Used FROM SERVICE_PART GROUP BY Part_ID) t
JOIN SPARE_PART p ON p.Part_ID = t.Part_ID
ORDER BY t.Total_Used DESC LIMIT 5;

-- Q7 LEFT JOIN: mechanic workload (view)
SELECT * FROM v_staff_workload ORDER BY Total_Appointments DESC;

-- Q8 Outstanding invoices (view)
SELECT Invoice_ID, Appointment_ID, Total_Amount, Paid_Amount, Balance_Due, Status
FROM v_invoice_balance WHERE Balance_Due > 0 ORDER BY Balance_Due DESC;

-- Q9 Monthly revenue (view)
SELECT * FROM v_monthly_revenue ORDER BY Month;

-- Q10 Full-text search over problem descriptions
SELECT Appointment_ID, Problem_Description, MATCH(Problem_Description) AGAINST ('brake noise' IN NATURAL LANGUAGE MODE) AS Relevance
FROM APPOINTMENT
WHERE MATCH(Problem_Description) AGAINST ('brake noise' IN NATURAL LANGUAGE MODE)
ORDER BY Relevance DESC;

-- Q11 Warranty check using a function
SELECT sr.Service_Record_ID, st.Service_Name, sr.Completed_Date, fn_warranty_valid(sr.Service_Record_ID) AS Under_Warranty
FROM SERVICE_RECORD sr JOIN APPOINTMENT a ON a.Appointment_ID = sr.Appointment_ID JOIN SERVICE_TYPE st ON st.Service_ID = a.Service_ID;

-- Q12 Low-stock report (view) and inventory movement
SELECT * FROM v_low_stock_parts;
SELECT p.Part_Name, l.Change_Qty, l.Reason, l.Logged_At FROM INVENTORY_LOG l JOIN SPARE_PART p ON p.Part_ID = l.Part_ID ORDER BY l.Log_ID DESC LIMIT 10;

-- ---------------- DML: UPDATE / DELETE / transactions ----------------
-- UPDATE: 5% price revision for brake-related service
UPDATE SERVICE_TYPE SET Base_Price = ROUND(Base_Price * 1.05, 2) WHERE Service_Name LIKE '%Brake%';
-- UPDATE: assign the unassigned appointment to the least busy mechanic
UPDATE APPOINTMENT SET Staff_ID = (SELECT Staff_ID FROM v_staff_workload ORDER BY Open_Jobs ASC LIMIT 1)
WHERE Appointment_ID = 12 AND Staff_ID IS NULL;
-- DELETE: remove cancelled appointments older than 90 days that have no billing
DELETE FROM APPOINTMENT WHERE Status = 'Cancelled' AND Appointment_DateTime < DATE_SUB(NOW(), INTERVAL 90 DAY)
  AND Appointment_ID NOT IN (SELECT Appointment_ID FROM INVOICE);

-- Transaction demo: rollback keeps data consistent when a step fails
START TRANSACTION;
  CALL sp_restock_part(1, 10);
  SELECT Stock_Qty AS Stock_Inside_Transaction FROM SPARE_PART WHERE Part_ID = 1;
ROLLBACK;
SELECT Stock_Qty AS Stock_After_Rollback FROM SPARE_PART WHERE Part_ID = 1;

-- Stored procedure usage
CALL sp_restock_part(3, 20);
CALL sp_record_payment(5, 3608.00, 'Card', 'CARD-A5-SETTLE');
SELECT Invoice_ID, Status FROM INVOICE WHERE Appointment_ID = 5;
