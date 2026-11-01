-- =====================================================================
-- File 4/5 : DML seed data (INSERT / UPDATE / DELETE demonstrations)
-- All demo accounts use the password:  Password@123  (stored as bcrypt hash)
-- =====================================================================
USE AutoCareDB;

INSERT INTO USER_ACCOUNT (Name, Email, Phone, Password_Hash, Role) VALUES
 ('Admin User',      'admin@autocare.com',  '9000000001', '$2b$10$ILr6vizK8jHP5HH8QmqILuk6TVPG9nkz7ZBjm96WVBGVTzNN28KoG', 'Admin'),
 ('Ravi Kumar',      'ravi@autocare.com',   '9000000002', '$2b$10$ILr6vizK8jHP5HH8QmqILuk6TVPG9nkz7ZBjm96WVBGVTzNN28KoG', 'Staff'),
 ('Meena Iyer',      'meena@autocare.com',  '9000000003', '$2b$10$ILr6vizK8jHP5HH8QmqILuk6TVPG9nkz7ZBjm96WVBGVTzNN28KoG', 'Staff'),
 ('Heema Customer',  'heema@example.com',   '9100000001', '$2b$10$ILr6vizK8jHP5HH8QmqILuk6TVPG9nkz7ZBjm96WVBGVTzNN28KoG', 'Customer'),
 ('Arjun Nair',      'arjun@example.com',   '9100000002', '$2b$10$ILr6vizK8jHP5HH8QmqILuk6TVPG9nkz7ZBjm96WVBGVTzNN28KoG', 'Customer'),
 ('Sneha Rao',       'sneha@example.com',   '9100000003', '$2b$10$ILr6vizK8jHP5HH8QmqILuk6TVPG9nkz7ZBjm96WVBGVTzNN28KoG', 'Customer');

INSERT INTO STAFF (User_ID, Designation, Hire_Date) VALUES
 (2, 'Senior Mechanic', '2021-03-15'),
 (3, 'Service Advisor', '2022-07-01');
INSERT INTO CUSTOMER (User_ID, Address) VALUES
 (4, 'JP Nagar, Bengaluru'), (5, 'Indiranagar, Bengaluru'), (6, 'Whitefield, Bengaluru');

INSERT INTO VEHICLE (Customer_ID, Registration_No, Make, Model, Year, Fuel_Type, Odometer_KM) VALUES
 (1, 'KA01AB1234', 'Maruti',  'Swift',  2019, 'Petrol',   42000),
 (1, 'KA05CD4321', 'Hyundai', 'Creta',  2021, 'Diesel',   28000),
 (2, 'KA03EF5678', 'Honda',   'City',   2018, 'Petrol',   61000),
 (3, 'KA51GH9012', 'Tata',    'Nexon',  2023, 'Electric', 9000),
 (3, 'KA02JK3456', 'Toyota',  'Innova', 2017, 'Diesel',   98000);

INSERT INTO SERVICE_TYPE (Service_Name, Description, Base_Price, Estimated_Duration, Warranty_Days) VALUES
 ('General Service',  'Full inspection, oil and filter change, fluid top-up',        1500.00, 120, 30),
 ('Brake Service',    'Brake pad replacement, disc check and brake fluid flush',     1200.00,  90, 90),
 ('AC Repair',        'Air conditioning gas refill, compressor and cooling check',   1800.00, 150, 60),
 ('Engine Diagnostics','Computerised engine scan, misfire and noise diagnosis',       900.00,  60, 15),
 ('Tyre Alignment',   'Wheel alignment, balancing and tyre rotation',                 700.00,  60, 30),
 ('Battery Replacement','Battery testing and replacement with warranty',              500.00,  30, 180);

INSERT INTO SPARE_PART (Part_Name, Part_Number, Stock_Qty, Unit_Price, Reorder_Level) VALUES
 ('Engine Oil 5W30 (1L)',  'EO-5W30-1L',  60,  450.00, 20),
 ('Oil Filter',            'OF-1001',     40,  250.00, 15),
 ('Brake Pad Set (Front)', 'BP-F-220',    12, 1800.00, 10),
 ('Air Filter',            'AF-3302',      8,  600.00, 10),
 ('AC Gas R134a (500g)',   'ACG-134A',    15,  900.00,  5),
 ('Car Battery 12V 45Ah',  'BAT-45AH',     6, 4500.00,  5),
 ('Spark Plug',            'SP-NGK-01',   50,  180.00, 20);

-- Appointments: historical (inserted directly) + upcoming (via transactional procedure)
INSERT INTO APPOINTMENT (Vehicle_ID, Service_ID, Staff_ID, Appointment_DateTime, Status, Problem_Description) VALUES
 (1, 1, 1, '2026-09-10 10:00:00', 'Scheduled', 'Routine 40000 km service, slight engine noise on cold start'),
 (2, 2, 1, '2026-09-12 11:00:00', 'Scheduled', 'Squeaking brakes and longer stopping distance'),
 (3, 3, 2, '2026-09-15 14:00:00', 'Scheduled', 'AC not cooling properly, weak airflow'),
 (4, 4, 2, '2026-09-18 09:30:00', 'Scheduled', 'Dashboard warning light and reduced range'),
 (5, 1, 1, '2026-10-01 10:00:00', 'Scheduled', 'Annual maintenance and oil leak check');

-- Complete three of them using the stored procedures (fires triggers)
SET @r1 = 0;
SET @r2 = 0;
SET @r3 = 0;
SET @inv = 0;
CALL sp_complete_service(1, 'Oil dark, air filter clogged', 'Normal wear, oil change due', 500.00, @r1);
CALL sp_add_part_to_service(@r1, 1, 4);
CALL sp_add_part_to_service(@r1, 2, 1);
CALL sp_add_part_to_service(@r1, 4, 1);
CALL sp_finish_service(1);
CALL sp_generate_invoice(1, @inv);
CALL sp_record_payment(1, 2000.00, 'UPI', 'UPI-TXN-0001');

CALL sp_complete_service(2, 'Pads worn below 2mm', 'Front brake pads need replacement', 400.00, @r2);
CALL sp_add_part_to_service(@r2, 3, 1);
CALL sp_finish_service(2);
CALL sp_generate_invoice(2, @inv);
CALL sp_record_payment(2, 4000.00, 'Card', 'CARD-TXN-0002');

CALL sp_complete_service(3, 'Low refrigerant pressure', 'Gas leak at condenser, refilled gas', 600.00, @r3);
CALL sp_add_part_to_service(@r3, 5, 2);
CALL sp_finish_service(3);
CALL sp_generate_invoice(3, @inv);

-- Upcoming appointment through the booking procedure
SET @new = 0;
CALL sp_book_appointment(1, 5, 2, DATE_ADD(NOW(), INTERVAL 5 DAY), 'Steering pulls to the left at high speed', @new);

-- UPDATE demonstrations
UPDATE SPARE_PART SET Unit_Price = Unit_Price * 1.05 WHERE Part_Name LIKE 'Engine Oil%';
UPDATE APPOINTMENT SET Status = 'In Progress' WHERE Appointment_ID = 4;
UPDATE VEHICLE SET Odometer_KM = Odometer_KM + 1500 WHERE Vehicle_ID = 1;

-- DELETE demonstration (cancel then remove a mistaken booking)
INSERT INTO APPOINTMENT (Vehicle_ID, Service_ID, Staff_ID, Appointment_DateTime, Status, Problem_Description)
VALUES (2, 6, NULL, DATE_ADD(NOW(), INTERVAL 9 DAY), 'Scheduled', 'duplicate booking - to be deleted');
DELETE FROM APPOINTMENT WHERE Problem_Description = 'duplicate booking - to be deleted';

SELECT 'Seed complete' AS Message;
