-- =====================================================================
-- File 3/5 : FUNCTIONS, STORED PROCEDURES (with TRANSACTIONS), TRIGGERS
-- =====================================================================
USE AutoCareDB;
DELIMITER $$

-- ---------- FUNCTIONS ----------
DROP FUNCTION IF EXISTS fn_calc_tax$$
CREATE FUNCTION fn_calc_tax(p_subtotal DECIMAL(10,2)) RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    RETURN ROUND(p_subtotal * 0.18, 2);          -- 18% GST
END$$

DROP FUNCTION IF EXISTS fn_parts_total$$
CREATE FUNCTION fn_parts_total(p_record_id INT) RETURNS DECIMAL(10,2)
READS SQL DATA
BEGIN
    DECLARE v_total DECIMAL(10,2);
    SELECT COALESCE(SUM(Quantity * Unit_Cost),0) INTO v_total
      FROM SERVICE_PART WHERE Service_Record_ID = p_record_id;
    RETURN v_total;
END$$

DROP FUNCTION IF EXISTS fn_warranty_expiry$$
CREATE FUNCTION fn_warranty_expiry(p_appointment_id INT) RETURNS DATE
READS SQL DATA
BEGIN
    DECLARE v_date DATE;
    SELECT DATE_ADD(sr.Completed_Date, INTERVAL st.Warranty_Days DAY) INTO v_date
      FROM SERVICE_RECORD sr
      JOIN APPOINTMENT a ON a.Appointment_ID = sr.Appointment_ID
      JOIN SERVICE_TYPE st ON st.Service_ID = a.Service_ID
     WHERE sr.Appointment_ID = p_appointment_id;
    RETURN v_date;
END$$

-- ---------- TRIGGERS ----------
-- 1. Keep SERVICE_RECORD.Total_Cost = Labor + parts (INSERT / UPDATE)
DROP TRIGGER IF EXISTS trg_sr_bi$$
CREATE TRIGGER trg_sr_bi BEFORE INSERT ON SERVICE_RECORD FOR EACH ROW
BEGIN
    SET NEW.Total_Cost = COALESCE(NEW.Labor_Cost,0);
END$$

DROP TRIGGER IF EXISTS trg_sr_bu$$
CREATE TRIGGER trg_sr_bu BEFORE UPDATE ON SERVICE_RECORD FOR EACH ROW
BEGIN
    SET NEW.Total_Cost = COALESCE(NEW.Labor_Cost,0) + fn_parts_total(NEW.Service_Record_ID);
END$$

-- 2. Parts used: validate + deduct stock, restore on delete, recompute total
DROP TRIGGER IF EXISTS trg_sp_bi$$
CREATE TRIGGER trg_sp_bi BEFORE INSERT ON SERVICE_PART FOR EACH ROW
BEGIN
    DECLARE v_stock INT;
    SELECT Stock_Qty INTO v_stock FROM SPARE_PART WHERE Part_ID = NEW.Part_ID FOR UPDATE;
    IF v_stock < NEW.Quantity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock for the requested spare part';
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_sp_ai$$
CREATE TRIGGER trg_sp_ai AFTER INSERT ON SERVICE_PART FOR EACH ROW
BEGIN
    UPDATE SPARE_PART SET Stock_Qty = Stock_Qty - NEW.Quantity WHERE Part_ID = NEW.Part_ID;
    UPDATE SERVICE_RECORD SET Labor_Cost = Labor_Cost WHERE Service_Record_ID = NEW.Service_Record_ID;
END$$

DROP TRIGGER IF EXISTS trg_sp_ad$$
CREATE TRIGGER trg_sp_ad AFTER DELETE ON SERVICE_PART FOR EACH ROW
BEGIN
    UPDATE SPARE_PART SET Stock_Qty = Stock_Qty + OLD.Quantity WHERE Part_ID = OLD.Part_ID;
    UPDATE SERVICE_RECORD SET Labor_Cost = Labor_Cost WHERE Service_Record_ID = OLD.Service_Record_ID;
END$$

-- 3. Invoice integrity: total always = subtotal + tax
DROP TRIGGER IF EXISTS trg_inv_bi$$
CREATE TRIGGER trg_inv_bi BEFORE INSERT ON INVOICE FOR EACH ROW
BEGIN
    SET NEW.Total_Amount = NEW.Subtotal + NEW.Tax;
END$$

-- 4. Audit appointment status changes
DROP TRIGGER IF EXISTS trg_appt_au$$
CREATE TRIGGER trg_appt_au AFTER UPDATE ON APPOINTMENT FOR EACH ROW
BEGIN
    IF OLD.Status <> NEW.Status THEN
        INSERT INTO APPOINTMENT_AUDIT (Appointment_ID, Old_Status, New_Status)
        VALUES (NEW.Appointment_ID, OLD.Status, NEW.Status);
    END IF;
END$$

-- 5. Only completed appointments can be invoiced
DROP TRIGGER IF EXISTS trg_inv_check_appt$$
CREATE TRIGGER trg_inv_check_appt BEFORE INSERT ON INVOICE FOR EACH ROW
BEGIN
    DECLARE v_status VARCHAR(30);
    SELECT Status INTO v_status FROM APPOINTMENT WHERE Appointment_ID = NEW.Appointment_ID;
    IF v_status <> 'Completed' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invoice can only be generated for a Completed appointment';
    END IF;
END$$

-- 6. After a successful payment, refresh invoice status
DROP TRIGGER IF EXISTS trg_pay_ai$$
CREATE TRIGGER trg_pay_ai AFTER INSERT ON PAYMENT FOR EACH ROW
BEGIN
    DECLARE v_paid DECIMAL(10,2);
    DECLARE v_total DECIMAL(10,2);
    IF NEW.Payment_Status = 'Paid' THEN
        SELECT COALESCE(SUM(Amount),0) INTO v_paid FROM PAYMENT
         WHERE Appointment_ID = NEW.Appointment_ID AND Payment_Status = 'Paid';
        SELECT Total_Amount INTO v_total FROM INVOICE WHERE Appointment_ID = NEW.Appointment_ID;
        UPDATE INVOICE
           SET Status = CASE WHEN v_paid >= v_total THEN 'Paid' ELSE 'Partially Paid' END
         WHERE Appointment_ID = NEW.Appointment_ID;
    END IF;
END$$

-- ---------- STORED PROCEDURES (each wrapped in a TRANSACTION) ----------
DROP PROCEDURE IF EXISTS sp_book_appointment$$
CREATE PROCEDURE sp_book_appointment(
    IN p_vehicle INT, IN p_service INT, IN p_staff INT,
    IN p_datetime DATETIME, IN p_problem TEXT, OUT p_appt_id INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    IF p_datetime < NOW() THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Appointment must be in the future';
    END IF;
    START TRANSACTION;
    IF p_staff IS NOT NULL AND EXISTS (
        SELECT 1 FROM APPOINTMENT WHERE Staff_ID = p_staff AND Appointment_DateTime = p_datetime
           AND Status IN ('Scheduled','In Progress') FOR UPDATE) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Selected staff member is already booked for that slot';
    END IF;
    INSERT INTO APPOINTMENT (Vehicle_ID, Service_ID, Staff_ID, Appointment_DateTime, Status, Problem_Description)
    VALUES (p_vehicle, p_service, p_staff, p_datetime, 'Scheduled', p_problem);
    SET p_appt_id = LAST_INSERT_ID();
    COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_complete_service$$
CREATE PROCEDURE sp_complete_service(
    IN p_appt INT, IN p_inspection TEXT, IN p_diagnosis TEXT, IN p_labor DECIMAL(10,2),
    OUT p_record_id INT)
BEGIN
    DECLARE v_status VARCHAR(30);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    SELECT Status INTO v_status FROM APPOINTMENT WHERE Appointment_ID = p_appt FOR UPDATE;
    IF v_status IS NULL OR v_status IN ('Completed','Cancelled') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Appointment not found or already closed';
    END IF;
    INSERT INTO SERVICE_RECORD (Appointment_ID, Inspection_Summary, Diagnosis, Labor_Cost, Completed_Date)
    VALUES (p_appt, p_inspection, p_diagnosis, p_labor, NULL);
    SET p_record_id = LAST_INSERT_ID();
    UPDATE APPOINTMENT SET Status = 'In Progress' WHERE Appointment_ID = p_appt;
    COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_add_part_to_service$$
CREATE PROCEDURE sp_add_part_to_service(IN p_record INT, IN p_part INT, IN p_qty INT)
BEGIN
    DECLARE v_price DECIMAL(10,2);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    SELECT Unit_Price INTO v_price FROM SPARE_PART WHERE Part_ID = p_part;
    IF v_price IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Spare part not found';
    END IF;
    INSERT INTO SERVICE_PART (Service_Record_ID, Part_ID, Quantity, Unit_Cost)
    VALUES (p_record, p_part, p_qty, v_price);      -- triggers deduct stock + update total
    COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_finish_service$$
CREATE PROCEDURE sp_finish_service(IN p_appt INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    UPDATE SERVICE_RECORD SET Completed_Date = CURDATE() WHERE Appointment_ID = p_appt;
    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No service record exists for this appointment';
    END IF;
    UPDATE APPOINTMENT SET Status = 'Completed' WHERE Appointment_ID = p_appt;
    COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_generate_invoice$$
CREATE PROCEDURE sp_generate_invoice(IN p_appt INT, OUT p_invoice_id INT)
BEGIN
    DECLARE v_base DECIMAL(10,2);
    DECLARE v_work DECIMAL(10,2);
    DECLARE v_sub DECIMAL(10,2);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    SELECT st.Base_Price, sr.Total_Cost INTO v_base, v_work
      FROM APPOINTMENT a
      JOIN SERVICE_TYPE st ON st.Service_ID = a.Service_ID
      JOIN SERVICE_RECORD sr ON sr.Appointment_ID = a.Appointment_ID
     WHERE a.Appointment_ID = p_appt;
    IF v_base IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No service record found for this appointment';
    END IF;
    SET v_sub = v_base + v_work;
    INSERT INTO INVOICE (Appointment_ID, Subtotal, Tax, Total_Amount, Status)
    VALUES (p_appt, v_sub, fn_calc_tax(v_sub), v_sub + fn_calc_tax(v_sub), 'Unpaid');
    SET p_invoice_id = LAST_INSERT_ID();
    COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_record_payment$$
CREATE PROCEDURE sp_record_payment(
    IN p_appt INT, IN p_amount DECIMAL(10,2), IN p_method VARCHAR(30), IN p_ref VARCHAR(100))
BEGIN
    DECLARE v_due DECIMAL(10,2);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    SELECT Balance_Due INTO v_due FROM vw_invoice_balance WHERE Appointment_ID = p_appt;
    IF v_due IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No invoice exists for this appointment';
    ELSEIF p_amount > v_due THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment exceeds the outstanding balance';
    END IF;
    INSERT INTO PAYMENT (Appointment_ID, Amount, Payment_Method, Payment_Status, Transaction_Ref)
    VALUES (p_appt, p_amount, p_method, 'Paid', p_ref);
    COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_cancel_appointment$$
CREATE PROCEDURE sp_cancel_appointment(IN p_appt INT)
BEGIN
    DECLARE v_status VARCHAR(30);
    SELECT Status INTO v_status FROM APPOINTMENT WHERE Appointment_ID = p_appt;
    IF v_status <> 'Scheduled' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only Scheduled appointments can be cancelled';
    END IF;
    UPDATE APPOINTMENT SET Status = 'Cancelled' WHERE Appointment_ID = p_appt;
END$$

DELIMITER ;
