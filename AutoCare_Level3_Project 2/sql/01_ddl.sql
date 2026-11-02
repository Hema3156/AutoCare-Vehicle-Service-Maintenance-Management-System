-- AutoCare: Vehicle Service & Maintenance Management System
-- DDL Statements and Execution Verification
-- TEAM :4
-- SRN:PES2UG24CS190
-- SRN:PES2UG24CS193

CREATE DATABASE IF NOT EXISTS AutoCareDB;
USE AutoCareDB;
-- ------------------------
-- TABLE 1 USER_ACCOUNT
-- ------------------------
CREATE TABLE USER_ACCOUNT (
    User_ID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(150) NOT NULL UNIQUE,
    Phone VARCHAR(15) UNIQUE,
    Password_Hash VARCHAR(255) NOT NULL,
    Role VARCHAR(20) NOT NULL,
    Created_At DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- ------------------------
-- TABLE 2 CUSTOMER
-- ------------------------

CREATE TABLE CUSTOMER (
    Customer_ID INT PRIMARY KEY AUTO_INCREMENT,
    User_ID INT NOT NULL UNIQUE,
    Address VARCHAR(255),
    FOREIGN KEY (User_ID) REFERENCES USER_ACCOUNT(User_ID)
        ON UPDATE CASCADE ON DELETE CASCADE
);
-- ------------------------
-- TABLE 3 STAFF
-- ------------------------

CREATE TABLE STAFF (
    Staff_ID INT PRIMARY KEY AUTO_INCREMENT,
    User_ID INT NOT NULL UNIQUE,
    Designation VARCHAR(100) NOT NULL,
    Hire_Date DATE,
    FOREIGN KEY (User_ID) REFERENCES USER_ACCOUNT(User_ID)
        ON UPDATE CASCADE ON DELETE CASCADE
);
-- ------------------------
-- TABLE 4 VEHICLE
-- ------------------------

CREATE TABLE VEHICLE (
    Vehicle_ID INT PRIMARY KEY AUTO_INCREMENT,
    Customer_ID INT NOT NULL,
    Registration_No VARCHAR(30) NOT NULL UNIQUE,
    Make VARCHAR(60) NOT NULL,
    Model VARCHAR(60) NOT NULL,
    Year INT,
    Fuel_Type VARCHAR(30),
    FOREIGN KEY (Customer_ID) REFERENCES CUSTOMER(Customer_ID)
        ON UPDATE CASCADE ON DELETE CASCADE
);
-- ------------------------
-- TABLE 5 SERVICE_TYPE
-- ------------------------

CREATE TABLE SERVICE_TYPE (
    Service_ID INT PRIMARY KEY AUTO_INCREMENT,
    Service_Name VARCHAR(100) NOT NULL,
    Description TEXT,
    Base_Price DECIMAL(10,2) NOT NULL,
    Estimated_Duration INT,
    Warranty_Days INT DEFAULT 0
);
-- ------------------------
-- TABLE 6 APPOINTMENT
-- ------------------------

CREATE TABLE APPOINTMENT (
    Appointment_ID INT PRIMARY KEY AUTO_INCREMENT,
    Vehicle_ID INT NOT NULL,
    Service_ID INT NOT NULL,
    Staff_ID INT,
    Appointment_DateTime DATETIME NOT NULL,
    Status VARCHAR(30) NOT NULL,
    Problem_Description TEXT,
    FOREIGN KEY (Vehicle_ID) REFERENCES VEHICLE(Vehicle_ID)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (Service_ID) REFERENCES SERVICE_TYPE(Service_ID)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (Staff_ID) REFERENCES STAFF(Staff_ID)
        ON UPDATE CASCADE ON DELETE SET NULL
);
-- ------------------------
-- TABLE 7 SERVICE_RECORD
-- ------------------------

CREATE TABLE SERVICE_RECORD (
    Service_Record_ID INT PRIMARY KEY AUTO_INCREMENT,
    Appointment_ID INT NOT NULL UNIQUE,
    Inspection_Summary TEXT,
    Diagnosis TEXT,
    Labor_Cost DECIMAL(10,2) DEFAULT 0,
    Total_Cost DECIMAL(10,2) DEFAULT 0,
    Completed_Date DATE,
    FOREIGN KEY (Appointment_ID) REFERENCES APPOINTMENT(Appointment_ID)
        ON UPDATE CASCADE ON DELETE CASCADE
);
-- ------------------------
-- TABLE 8 SPARE_PART
-- ------------------------

CREATE TABLE SPARE_PART (
    Part_ID INT PRIMARY KEY AUTO_INCREMENT,
    Part_Name VARCHAR(100) NOT NULL,
    Part_Number VARCHAR(60) UNIQUE,
    Stock_Qty INT DEFAULT 0,
    Unit_Price DECIMAL(10,2) NOT NULL,
    Reorder_Level INT DEFAULT 0
);
-- ------------------------
-- TABLE 9 SERVICE_PART
-- ------------------------

CREATE TABLE SERVICE_PART (
    Service_Record_ID INT NOT NULL,
    Part_ID INT NOT NULL,
    Quantity INT NOT NULL,
    Unit_Cost DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (Service_Record_ID, Part_ID),
    FOREIGN KEY (Service_Record_ID) REFERENCES SERVICE_RECORD(Service_Record_ID)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (Part_ID) REFERENCES SPARE_PART(Part_ID)
        ON UPDATE CASCADE ON DELETE RESTRICT
);
-- ------------------------
-- TABLE 10 PAYMENT
-- ------------------------

CREATE TABLE PAYMENT (
    Payment_ID INT PRIMARY KEY AUTO_INCREMENT,
    Appointment_ID INT NOT NULL,
    Payment_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Amount DECIMAL(10,2) NOT NULL,
    Payment_Method VARCHAR(30) NOT NULL,
    Payment_Status VARCHAR(30) NOT NULL,
    Transaction_Ref VARCHAR(100) UNIQUE,
    FOREIGN KEY (Appointment_ID) REFERENCES APPOINTMENT(Appointment_ID)
        ON UPDATE CASCADE ON DELETE CASCADE
);
-- ------------------------
-- TABLE 11 INVOICE
-- ------------------------

CREATE TABLE INVOICE (
    Invoice_ID INT PRIMARY KEY AUTO_INCREMENT,
    Appointment_ID INT NOT NULL UNIQUE,
    Invoice_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Subtotal DECIMAL(10,2) NOT NULL,
    Tax DECIMAL(10,2) NOT NULL,
    Total_Amount DECIMAL(10,2) NOT NULL,
    Status VARCHAR(30) NOT NULL,
    FOREIGN KEY (Appointment_ID) REFERENCES APPOINTMENT(Appointment_ID)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- Verify foreign-key relationships
SELECT TABLE_NAME, CONSTRAINT_NAME,
       REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'AutoCareDB'
  AND REFERENCED_TABLE_NAME IS NOT NULL;
  
-- DDL execution verification
SHOW TABLES;

DESC USER_ACCOUNT;
DESC CUSTOMER;
DESC STAFF;
DESC VEHICLE;
DESC SERVICE_TYPE;
DESC APPOINTMENT;
DESC SERVICE_RECORD;
DESC SPARE_PART;
DESC SERVICE_PART;
DESC PAYMENT;
DESC INVOICE;


