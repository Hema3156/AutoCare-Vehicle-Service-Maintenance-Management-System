-- AutoCare | Step 5: Sample data (DML INSERT). All demo passwords: Password@123 (bcrypt hashed)
USE AutoCareDB;

INSERT INTO USER_ACCOUNT (User_ID, Name, Email, Phone, Password_Hash, Role) VALUES
(1,'Arjun Admin','admin@autocare.in','9000000001','$2a$10$TRf7sPOzIKXZM86PQEbkAe48X1taCqtcLdDJcAGx2r36a/oVkWWKa','Admin'),
(2,'Ravi Kumar','ravi@autocare.in','9000000002','$2a$10$TRf7sPOzIKXZM86PQEbkAe48X1taCqtcLdDJcAGx2r36a/oVkWWKa','Staff'),
(3,'Sneha Rao','sneha@autocare.in','9000000003','$2a$10$TRf7sPOzIKXZM86PQEbkAe48X1taCqtcLdDJcAGx2r36a/oVkWWKa','Staff'),
(4,'Imran Pasha','imran@autocare.in','9000000004','$2a$10$TRf7sPOzIKXZM86PQEbkAe48X1taCqtcLdDJcAGx2r36a/oVkWWKa','Staff'),
(5,'Priya Nair','priya@example.com','9100000001','$2a$10$TRf7sPOzIKXZM86PQEbkAe48X1taCqtcLdDJcAGx2r36a/oVkWWKa','Customer'),
(6,'Karthik Reddy','karthik@example.com','9100000002','$2a$10$TRf7sPOzIKXZM86PQEbkAe48X1taCqtcLdDJcAGx2r36a/oVkWWKa','Customer'),
(7,'Anjali Mehta','anjali@example.com','9100000003','$2a$10$TRf7sPOzIKXZM86PQEbkAe48X1taCqtcLdDJcAGx2r36a/oVkWWKa','Customer'),
(8,'Vikram Shetty','vikram@example.com','9100000004','$2a$10$TRf7sPOzIKXZM86PQEbkAe48X1taCqtcLdDJcAGx2r36a/oVkWWKa','Customer'),
(9,'Divya Iyer','divya@example.com','9100000005','$2a$10$TRf7sPOzIKXZM86PQEbkAe48X1taCqtcLdDJcAGx2r36a/oVkWWKa','Customer');

INSERT INTO STAFF (Staff_ID, User_ID, Designation, Hire_Date) VALUES
(1,2,'Senior Mechanic','2021-03-15'),(2,3,'Electrical Technician','2022-07-01'),(3,4,'Diagnostics Specialist','2023-01-10');

INSERT INTO CUSTOMER (Customer_ID, User_ID, Address) VALUES
(1,5,'12 MG Road, Bengaluru'),(2,6,'45 Jayanagar 4th Block, Bengaluru'),(3,7,'8 Indiranagar, Bengaluru'),
(4,8,'22 Whitefield Main Road, Bengaluru'),(5,9,'101 HSR Layout, Bengaluru');

INSERT INTO VEHICLE (Vehicle_ID, Customer_ID, Registration_No, Make, Model, Year, Fuel_Type) VALUES
(1,1,'KA01AB1234','Maruti','Swift',2019,'Petrol'),
(2,1,'KA01CD5678','Hyundai','Creta',2021,'Diesel'),
(3,2,'KA03EF9012','Honda','City',2018,'Petrol'),
(4,3,'KA05GH3456','Tata','Nexon',2022,'Electric'),
(5,3,'KA02JK7890','Toyota','Innova',2017,'Diesel'),
(6,4,'KA04LM2345','Mahindra','XUV700',2023,'Diesel'),
(7,4,'KA51NP6789','Kia','Seltos',2020,'Petrol'),
(8,5,'KA09QR0123','Volkswagen','Polo',2016,'Petrol');

INSERT INTO SERVICE_TYPE (Service_ID, Service_Name, Description, Base_Price, Estimated_Duration, Warranty_Days) VALUES
(1,'Oil Change','Engine oil and oil filter replacement with basic inspection',800,45,30),
(2,'Brake Pad Replacement','Replace worn brake pads, inspect discs and brake fluid',2500,90,90),
(3,'Full Service','Complete multi-point inspection, fluids, filters and tune-up',4500,180,60),
(4,'AC Repair','Diagnose and repair air conditioning, gas refill and leak check',3000,120,60),
(5,'Battery Replacement','Test and replace the car battery, terminal cleaning',1200,30,180),
(6,'Wheel Alignment','Computerised wheel alignment and balancing',900,60,15),
(7,'Engine Diagnostics','OBD scan, check engine light analysis and fault tracing',1500,60,0),
(8,'Tyre Rotation','Rotate tyres and check pressure and tread depth',500,30,0);

INSERT INTO SPARE_PART (Part_ID, Part_Name, Part_Number, Stock_Qty, Unit_Price, Reorder_Level) VALUES
(1,'Engine Oil 4L','EO-5W30-4L',40,1850,10),(2,'Oil Filter','OF-1001',50,350,15),
(3,'Brake Pad Set','BP-2204',12,1600,10),(4,'Air Filter','AF-3310',30,450,10),
(5,'Spark Plug','SP-4412',60,280,20),(6,'AC Gas Refill Kit','AC-R134-KIT',10,1100,5),
(7,'Cabin Filter','CF-5521',20,400,8),(8,'Car Battery 55Ah','BT-55AH',5,5200,4),
(9,'Fuel Filter','FF-6633',15,650,6),(10,'Wiper Blade Pair','WB-7710',25,500,10);

INSERT INTO APPOINTMENT (Appointment_ID, Vehicle_ID, Service_ID, Staff_ID, Appointment_DateTime, Status, Problem_Description) VALUES
(1,1,1,1,'2026-07-12 10:00:00','Completed','Engine oil change due, 10,000 km since last'),
(2,2,2,2,'2026-07-20 11:00:00','Completed','Squealing noise from front brakes when stopping'),
(3,3,3,1,'2026-08-05 09:30:00','Completed','Annual full service and general checkup'),
(4,4,4,3,'2026-08-18 14:00:00','Completed','AC not cooling properly, weak airflow'),
(5,5,5,2,'2026-09-02 10:00:00','Completed','Car not starting in the mornings, battery weak'),
(6,1,6,3,'2026-09-14 15:00:00','Completed','Steering pulls to the left on highway'),
(7,6,7,1,'2026-09-25 11:30:00','Completed','Check engine light on and rough idle'),
(8,7,3,2,'2026-09-28 16:00:00','Cancelled','Customer cancelled, travelling out of town'),
(9,8,1,1,DATE_ADD(DATE(NOW()), INTERVAL '2 10' DAY_HOUR),'Scheduled','Oil change and noise from engine bay'),
(10,2,3,2,DATE_ADD(DATE(NOW()), INTERVAL '4 11' DAY_HOUR),'Scheduled','Scheduled full service before long trip'),
(11,3,2,3,DATE_SUB(NOW(), INTERVAL 1 HOUR),'In Progress','Brake pedal feels spongy'),
(12,5,7,NULL,DATE_ADD(DATE(NOW()), INTERVAL '6 15' DAY_HOUR),'Scheduled','Vibration at idle, unknown cause');

-- Service records (Total_Cost recomputed by triggers as parts are added)
INSERT INTO SERVICE_RECORD (Service_Record_ID, Appointment_ID, Inspection_Summary, Diagnosis, Labor_Cost, Completed_Date) VALUES
(1,1,'Oil level low, filter clogged','Routine oil change required',300,'2026-07-12'),
(2,2,'Front pads worn below 2mm','Brake pads worn out, discs in good condition',800,'2026-07-20'),
(3,3,'Multi-point inspection completed','Filters due, spark plugs worn',1500,'2026-08-05'),
(4,4,'Low refrigerant, dirty cabin filter','Refrigerant leak minor, gas topped up',1200,'2026-08-18'),
(5,5,'Battery voltage 10.8V, terminals corroded','Battery end of life, replaced',400,'2026-09-02'),
(6,6,'Alignment out of tolerance on front axle','Wheel alignment corrected and balanced',350,'2026-09-14'),
(7,7,'Misfire on cylinder 2 and 3, clogged fuel filter','Worn spark plugs and clogged fuel filter',600,'2026-09-25');

-- Parts used (triggers deduct stock and recompute totals)
INSERT INTO SERVICE_PART (Service_Record_ID, Part_ID, Quantity, Unit_Cost) VALUES
(1,1,1,1850),(1,2,1,350),
(2,3,2,1600),
(3,1,1,1850),(3,2,1,350),(3,4,1,450),(3,5,4,280),
(4,6,1,1100),(4,7,1,400),
(5,8,1,5200),
(7,5,2,280),(7,9,1,650);

CALL sp_generate_invoice(1); CALL sp_generate_invoice(2); CALL sp_generate_invoice(3); CALL sp_generate_invoice(4);
CALL sp_generate_invoice(5); CALL sp_generate_invoice(6); CALL sp_generate_invoice(7);

UPDATE INVOICE i JOIN SERVICE_RECORD sr ON sr.Appointment_ID = i.Appointment_ID SET i.Invoice_Date = sr.Completed_Date;

-- Payments (invoice status maintained by trigger). Totals are read into variables first because
-- MySQL forbids INSERT..SELECT from INVOICE while a trigger updates INVOICE.
SELECT Total_Amount INTO @t1 FROM INVOICE WHERE Appointment_ID=1;
SELECT Total_Amount INTO @t2 FROM INVOICE WHERE Appointment_ID=2;
SELECT Total_Amount INTO @t3 FROM INVOICE WHERE Appointment_ID=3;
SELECT Total_Amount INTO @t4 FROM INVOICE WHERE Appointment_ID=4;
SELECT Total_Amount INTO @t7 FROM INVOICE WHERE Appointment_ID=7;
INSERT INTO PAYMENT (Appointment_ID, Payment_Date, Amount, Payment_Method, Payment_Status, Transaction_Ref) VALUES
(1,'2026-07-12 12:00:00',@t1,'UPI','Completed','UPI-A1-0712'),
(2,'2026-07-20 13:30:00',@t2,'Card','Completed','CARD-A2-0720'),
(3,'2026-08-05 13:00:00',ROUND(@t3/2,2),'Cash','Completed','CASH-A3-0805'),
(3,'2026-08-20 10:00:00',@t3-ROUND(@t3/2,2),'UPI','Completed','UPI-A3-0820'),
(4,'2026-08-18 17:00:00',@t4,'NetBanking','Completed','NB-A4-0818'),
(5,'2026-09-02 12:30:00',3000,'UPI','Completed','UPI-A5-0902'),
(6,'2026-09-14 17:00:00',500,'Card','Failed','CARD-A6-FAIL'),
(7,'2026-09-25 14:00:00',@t7,'Card','Completed','CARD-A7-0925');
