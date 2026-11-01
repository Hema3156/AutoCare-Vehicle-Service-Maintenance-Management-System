-- AutoCare | Step 4: Audit table, functions, stored procedures, triggers
USE AutoCareDB;

CREATE TABLE IF NOT EXISTS INVENTORY_LOG (
    Log_ID INT PRIMARY KEY AUTO_INCREMENT,
    Part_ID INT NOT NULL,
    Change_Qty INT NOT NULL,
    Reason VARCHAR(60) NOT NULL,
    Logged_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Part_ID) REFERENCES SPARE_PART(Part_ID) ON UPDATE CASCADE ON DELETE CASCADE
);

DROP FUNCTION IF EXISTS fn_invoice_balance;
DROP FUNCTION IF EXISTS fn_warranty_valid;
DROP FUNCTION IF EXISTS fn_staff_is_free;
DROP PROCEDURE IF EXISTS sp_book_appointment;
DROP PROCEDURE IF EXISTS sp_generate_invoice;
DROP PROCEDURE IF EXISTS sp_complete_service;
DROP PROCEDURE IF EXISTS sp_record_payment;
DROP PROCEDURE IF EXISTS sp_restock_part;
DROP TRIGGER IF EXISTS trg_sp_before_insert;
DROP TRIGGER IF EXISTS trg_sp_after_insert;
DROP TRIGGER IF EXISTS trg_sp_after_update;
DROP TRIGGER IF EXISTS trg_sp_after_delete;
DROP TRIGGER IF EXISTS trg_sr_before_insert;
DROP TRIGGER IF EXISTS trg_sr_before_update;
DROP TRIGGER IF EXISTS trg_pay_after_insert;
DROP TRIGGER IF EXISTS trg_pay_after_update;
DROP TRIGGER IF EXISTS trg_appt_before_update;

DELIMITER $$

-- ---------------------------- FUNCTIONS ----------------------------
CREATE FUNCTION fn_invoice_balance(p_appt INT) RETURNS DECIMAL(10,2)
READS SQL DATA
BEGIN
    DECLARE v_total DECIMAL(10,2) DEFAULT 0;
    DECLARE v_paid  DECIMAL(10,2) DEFAULT 0;
    SELECT COALESCE(Total_Amount,0) INTO v_total FROM INVOICE WHERE Appointment_ID = p_appt;
    SELECT COALESCE(SUM(Amount),0) INTO v_paid FROM PAYMENT
      WHERE Appointment_ID = p_appt AND Payment_Status = 'Completed';
    RETURN v_total - v_paid;
END$$

CREATE FUNCTION fn_warranty_valid(p_record INT) RETURNS TINYINT
READS SQL DATA
BEGIN
    DECLARE v_until DATE;
    SELECT DATE_ADD(sr.Completed_Date, INTERVAL st.Warranty_Days DAY) INTO v_until
    FROM SERVICE_RECORD sr
    JOIN APPOINTMENT a ON a.Appointment_ID = sr.Appointment_ID
    JOIN SERVICE_TYPE st ON st.Service_ID = a.Service_ID
    WHERE sr.Service_Record_ID = p_record;
    RETURN IF(v_until IS NOT NULL AND v_until >= CURDATE(), 1, 0);
END$$

-- Is the mechanic free for [p_start, p_start + duration)?  Duration in minutes.
CREATE FUNCTION fn_staff_is_free(p_staff INT, p_start DATETIME, p_minutes INT, p_exclude INT) RETURNS TINYINT
READS SQL DATA
BEGIN
    DECLARE v_conflicts INT;
    SELECT COUNT(*) INTO v_conflicts
    FROM APPOINTMENT a JOIN SERVICE_TYPE s ON s.Service_ID = a.Service_ID
    WHERE a.Staff_ID = p_staff
      AND a.Status IN ('Scheduled','In Progress')
      AND (p_exclude IS NULL OR a.Appointment_ID <> p_exclude)
      AND a.Appointment_DateTime < DATE_ADD(p_start, INTERVAL p_minutes MINUTE)
      AND DATE_ADD(a.Appointment_DateTime, INTERVAL COALESCE(s.Estimated_Duration,60) MINUTE) > p_start;
    RETURN IF(v_conflicts = 0, 1, 0);
END$$

-- ---------------------------- PROCEDURES ----------------------------
CREATE PROCEDURE sp_book_appointment(
    IN p_vehicle INT, IN p_service INT, IN p_staff INT,
    IN p_datetime DATETIME, IN p_problem TEXT, OUT p_appt_id INT)
BEGIN
    DECLARE v_minutes INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

    START TRANSACTION;
    IF p_datetime <= NOW() THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Appointment must be in the future';
    END IF;
    SELECT COALESCE(Estimated_Duration,60) INTO v_minutes FROM SERVICE_TYPE WHERE Service_ID = p_service;
    IF p_staff IS NOT NULL AND fn_staff_is_free(p_staff, p_datetime, v_minutes, NULL) = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Selected mechanic is already booked for that slot';
    END IF;
    INSERT INTO APPOINTMENT (Vehicle_ID, Service_ID, Staff_ID, Appointment_DateTime, Status, Problem_Description)
    VALUES (p_vehicle, p_service, p_staff, p_datetime, 'Scheduled', p_problem);
    SET p_appt_id = LAST_INSERT_ID();
    COMMIT;
END$$

CREATE PROCEDURE sp_generate_invoice(IN p_appt INT)
BEGIN
    DECLARE v_sub DECIMAL(10,2);
    SELECT Total_Cost INTO v_sub FROM SERVICE_RECORD WHERE Appointment_ID = p_appt;
    IF v_sub IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No service record exists for this appointment';
    END IF;
    INSERT INTO INVOICE (Appointment_ID, Subtotal, Tax, Total_Amount, Status)
    VALUES (p_appt, v_sub, ROUND(v_sub*0.18,2), v_sub + ROUND(v_sub*0.18,2), 'Unpaid')
    ON DUPLICATE KEY UPDATE Subtotal = VALUES(Subtotal), Tax = VALUES(Tax), Total_Amount = VALUES(Total_Amount);
END$$

-- p_parts is a JSON array: [{"part_id":1,"quantity":2}, ...]  (unit cost taken from SPARE_PART)
CREATE PROCEDURE sp_complete_service(
    IN p_appt INT, IN p_inspection TEXT, IN p_diagnosis TEXT, IN p_labor DECIMAL(10,2), IN p_parts JSON)
BEGIN
    DECLARE v_status VARCHAR(30);
    DECLARE v_record INT;
    DECLARE v_i INT DEFAULT 0; DECLARE v_n INT DEFAULT 0; DECLARE v_part INT; DECLARE v_qty INT; DECLARE v_price DECIMAL(10,2);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

    START TRANSACTION;
    SELECT Status INTO v_status FROM APPOINTMENT WHERE Appointment_ID = p_appt FOR UPDATE;
    IF v_status IS NULL OR v_status NOT IN ('Scheduled','In Progress') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Appointment is not open for completion';
    END IF;

    INSERT INTO SERVICE_RECORD (Appointment_ID, Inspection_Summary, Diagnosis, Labor_Cost, Total_Cost, Completed_Date)
    VALUES (p_appt, p_inspection, p_diagnosis, p_labor, p_labor, CURDATE());
    SET v_record = LAST_INSERT_ID();

    -- Insert part lines one by one (an INSERT..SELECT reading SPARE_PART would clash with the
    -- stock-deducting trigger, error 1442)
    IF p_parts IS NOT NULL THEN
        SET v_n = JSON_LENGTH(p_parts);
        WHILE v_i < v_n DO
            SET v_part = JSON_EXTRACT(p_parts, CONCAT('$[', v_i, '].part_id'));
            SET v_qty  = JSON_EXTRACT(p_parts, CONCAT('$[', v_i, '].quantity'));
            SET v_price = NULL;
            SELECT Unit_Price INTO v_price FROM SPARE_PART WHERE Part_ID = v_part;
            IF v_price IS NULL THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unknown spare part in the parts list';
            END IF;
            INSERT INTO SERVICE_PART (Service_Record_ID, Part_ID, Quantity, Unit_Cost) VALUES (v_record, v_part, v_qty, v_price);
            SET v_i = v_i + 1;
        END WHILE;
    END IF;

    UPDATE APPOINTMENT SET Status = 'Completed' WHERE Appointment_ID = p_appt;
    CALL sp_generate_invoice(p_appt);
    COMMIT;
END$$

CREATE PROCEDURE sp_record_payment(
    IN p_appt INT, IN p_amount DECIMAL(10,2), IN p_method VARCHAR(30), IN p_ref VARCHAR(100))
BEGIN
    DECLARE v_balance DECIMAL(10,2);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

    START TRANSACTION;
    IF NOT EXISTS (SELECT 1 FROM INVOICE WHERE Appointment_ID = p_appt FOR UPDATE) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No invoice exists for this appointment';
    END IF;
    SET v_balance = fn_invoice_balance(p_appt);
    IF p_amount > v_balance THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment exceeds outstanding balance';
    END IF;
    INSERT INTO PAYMENT (Appointment_ID, Amount, Payment_Method, Payment_Status, Transaction_Ref)
    VALUES (p_appt, p_amount, p_method, 'Completed', p_ref);
    COMMIT;
END$$

CREATE PROCEDURE sp_restock_part(IN p_part INT, IN p_qty INT)
BEGIN
    IF p_qty <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Restock quantity must be positive';
    END IF;
    UPDATE SPARE_PART SET Stock_Qty = Stock_Qty + p_qty, Last_Restocked = NOW() WHERE Part_ID = p_part;
    INSERT INTO INVENTORY_LOG (Part_ID, Change_Qty, Reason) VALUES (p_part, p_qty, 'Restock');
END$$

-- ----------------------------- TRIGGERS -----------------------------
-- Parts used on a job: validate stock, deduct stock, keep SERVICE_RECORD.Total_Cost in sync
CREATE TRIGGER trg_sp_before_insert BEFORE INSERT ON SERVICE_PART FOR EACH ROW
BEGIN
    DECLARE v_stock INT;
    SELECT Stock_Qty INTO v_stock FROM SPARE_PART WHERE Part_ID = NEW.Part_ID FOR UPDATE;
    IF v_stock IS NULL OR v_stock < NEW.Quantity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock for requested spare part';
    END IF;
END$$

CREATE TRIGGER trg_sp_after_insert AFTER INSERT ON SERVICE_PART FOR EACH ROW
BEGIN
    UPDATE SPARE_PART SET Stock_Qty = Stock_Qty - NEW.Quantity WHERE Part_ID = NEW.Part_ID;
    INSERT INTO INVENTORY_LOG (Part_ID, Change_Qty, Reason) VALUES (NEW.Part_ID, -NEW.Quantity, 'Used in service');
    UPDATE SERVICE_RECORD SET Total_Cost = Labor_Cost +
        (SELECT COALESCE(SUM(Quantity*Unit_Cost),0) FROM SERVICE_PART WHERE Service_Record_ID = NEW.Service_Record_ID)
    WHERE Service_Record_ID = NEW.Service_Record_ID;
END$$

CREATE TRIGGER trg_sp_after_update AFTER UPDATE ON SERVICE_PART FOR EACH ROW
BEGIN
    UPDATE SPARE_PART SET Stock_Qty = Stock_Qty + OLD.Quantity - NEW.Quantity WHERE Part_ID = NEW.Part_ID;
    UPDATE SERVICE_RECORD SET Total_Cost = Labor_Cost +
        (SELECT COALESCE(SUM(Quantity*Unit_Cost),0) FROM SERVICE_PART WHERE Service_Record_ID = NEW.Service_Record_ID)
    WHERE Service_Record_ID = NEW.Service_Record_ID;
END$$

CREATE TRIGGER trg_sp_after_delete AFTER DELETE ON SERVICE_PART FOR EACH ROW
BEGIN
    UPDATE SPARE_PART SET Stock_Qty = Stock_Qty + OLD.Quantity WHERE Part_ID = OLD.Part_ID;
    INSERT INTO INVENTORY_LOG (Part_ID, Change_Qty, Reason) VALUES (OLD.Part_ID, OLD.Quantity, 'Returned to stock');
    UPDATE SERVICE_RECORD SET Total_Cost = Labor_Cost +
        (SELECT COALESCE(SUM(Quantity*Unit_Cost),0) FROM SERVICE_PART WHERE Service_Record_ID = OLD.Service_Record_ID)
    WHERE Service_Record_ID = OLD.Service_Record_ID;
END$$

-- Labor changes must flow into the total
CREATE TRIGGER trg_sr_before_insert BEFORE INSERT ON SERVICE_RECORD FOR EACH ROW
BEGIN
    IF NEW.Total_Cost < NEW.Labor_Cost THEN SET NEW.Total_Cost = NEW.Labor_Cost; END IF;
END$$

CREATE TRIGGER trg_sr_before_update BEFORE UPDATE ON SERVICE_RECORD FOR EACH ROW
BEGIN
    IF NEW.Labor_Cost <> OLD.Labor_Cost THEN
        SET NEW.Total_Cost = NEW.Labor_Cost +
            (SELECT COALESCE(SUM(Quantity*Unit_Cost),0) FROM SERVICE_PART WHERE Service_Record_ID = NEW.Service_Record_ID);
    END IF;
END$$

-- Payments drive invoice status
CREATE TRIGGER trg_pay_after_insert AFTER INSERT ON PAYMENT FOR EACH ROW
BEGIN
    DECLARE v_paid DECIMAL(10,2);
    DECLARE v_total DECIMAL(10,2);
    SELECT COALESCE(SUM(Amount),0) INTO v_paid FROM PAYMENT
      WHERE Appointment_ID = NEW.Appointment_ID AND Payment_Status = 'Completed';
    SELECT Total_Amount INTO v_total FROM INVOICE WHERE Appointment_ID = NEW.Appointment_ID;
    IF v_total IS NOT NULL THEN
        UPDATE INVOICE SET Status = CASE WHEN v_paid >= v_total THEN 'Paid'
                                         WHEN v_paid > 0 THEN 'Partially Paid' ELSE 'Unpaid' END
        WHERE Appointment_ID = NEW.Appointment_ID AND Status <> 'Cancelled';
    END IF;
END$$

CREATE TRIGGER trg_pay_after_update AFTER UPDATE ON PAYMENT FOR EACH ROW
BEGIN
    DECLARE v_paid DECIMAL(10,2);
    DECLARE v_total DECIMAL(10,2);
    SELECT COALESCE(SUM(Amount),0) INTO v_paid FROM PAYMENT
      WHERE Appointment_ID = NEW.Appointment_ID AND Payment_Status = 'Completed';
    SELECT Total_Amount INTO v_total FROM INVOICE WHERE Appointment_ID = NEW.Appointment_ID;
    IF v_total IS NOT NULL THEN
        UPDATE INVOICE SET Status = CASE WHEN v_paid >= v_total THEN 'Paid'
                                         WHEN v_paid > 0 THEN 'Partially Paid' ELSE 'Unpaid' END
        WHERE Appointment_ID = NEW.Appointment_ID AND Status <> 'Cancelled';
    END IF;
END$$

-- Appointment lifecycle guard: terminal states are final
CREATE TRIGGER trg_appt_before_update BEFORE UPDATE ON APPOINTMENT FOR EACH ROW
BEGIN
    IF OLD.Status IN ('Completed','Cancelled') AND NEW.Status <> OLD.Status THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Completed or cancelled appointments cannot change status';
    END IF;
END$$

DELIMITER ;
