-- ============================================================
-- AWS Migration Script
-- Run this on the AWS MySQL database to add missing columns
-- that were added during local development.
-- ============================================================

-- Uses information_schema + dynamic SQL for compatibility with MySQL versions
-- where "ADD COLUMN IF NOT EXISTS" is not supported.

DELIMITER $$

DROP PROCEDURE IF EXISTS add_column_if_missing $$
CREATE PROCEDURE add_column_if_missing(
  IN in_table_name VARCHAR(64),
  IN in_column_name VARCHAR(64),
  IN in_column_definition TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = in_table_name
      AND COLUMN_NAME = in_column_name
  ) THEN
    SET @ddl = CONCAT(
      'ALTER TABLE `', in_table_name,
      '` ADD COLUMN `', in_column_name,
      '` ', in_column_definition
    );
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END $$

DELIMITER ;

-- ----- PRODUCT TABLE: add 14 new columns -----
CALL add_column_if_missing('product', 'item_code', 'VARCHAR(100) DEFAULT NULL');
CALL add_column_if_missing('product', 'barcode', 'VARCHAR(100) DEFAULT NULL');
CALL add_column_if_missing('product', 'brand_name', 'VARCHAR(255) DEFAULT NULL');
CALL add_column_if_missing('product', 'current_stock', 'INT DEFAULT 0');
CALL add_column_if_missing('product', 'min_stock', 'INT DEFAULT 0');
CALL add_column_if_missing('product', 'reorder_level', 'INT DEFAULT 0');
CALL add_column_if_missing('product', 'reorder_quantity', 'INT DEFAULT 0');
CALL add_column_if_missing('product', 'unit_cost', 'DECIMAL(12,2) DEFAULT 0.00');
CALL add_column_if_missing('product', 'unit_selling_price', 'DECIMAL(12,2) DEFAULT 0.00');
CALL add_column_if_missing('product', 'expiry_date', 'VARCHAR(20) DEFAULT NULL');
CALL add_column_if_missing('product', 'product_store_location', 'VARCHAR(255) DEFAULT NULL');
CALL add_column_if_missing('product', 'warranty_serial', 'VARCHAR(100) DEFAULT NULL');
CALL add_column_if_missing('product', 'warranty_duration', 'VARCHAR(50) DEFAULT NULL');
CALL add_column_if_missing('product', 'warranty_type', 'VARCHAR(50) DEFAULT NULL');

-- ----- SUPPLIER TABLE: add 10 new columns -----
CALL add_column_if_missing('supplier', 'supplier_city', 'VARCHAR(255) DEFAULT NULL');
CALL add_column_if_missing('supplier', 'supplier_country', 'VARCHAR(255) DEFAULT NULL');
CALL add_column_if_missing('supplier', 'supplier_type', 'VARCHAR(100) DEFAULT NULL');
CALL add_column_if_missing('supplier', 'products_supplied', 'TEXT DEFAULT NULL');
CALL add_column_if_missing('supplier', 'delivery_time', 'VARCHAR(100) DEFAULT NULL');
CALL add_column_if_missing('supplier', 'bank_details', 'TEXT DEFAULT NULL');
CALL add_column_if_missing('supplier', 'rating', 'VARCHAR(20) DEFAULT NULL');
CALL add_column_if_missing('supplier', 'discounts_agreements', 'TEXT DEFAULT NULL');
CALL add_column_if_missing('supplier', 'return_policy', 'TEXT DEFAULT NULL');
CALL add_column_if_missing('supplier', 'note', 'TEXT DEFAULT NULL');

-- ----- APPOINTMENT TABLE: add 3 missing columns -----
CALL add_column_if_missing('appointment', 'reschedule_count', 'INT NOT NULL DEFAULT 0');
CALL add_column_if_missing('appointment', 'original_appointment_date', 'DATETIME DEFAULT NULL');
CALL add_column_if_missing('appointment', 'nurse_assessment_status', 'VARCHAR(20) DEFAULT NULL');

-- ----- DOCTOR SCHEDULE CLEANUP: normalize malformed legacy rows -----
-- Keep durations and capacities within valid ranges
UPDATE doctor_schedule
SET slot_duration_minutes = 30
WHERE slot_duration_minutes IS NULL
  OR slot_duration_minutes <= 0
  OR slot_duration_minutes > 240;

UPDATE doctor_schedule
SET max_patients = 20
WHERE max_patients IS NULL
  OR max_patients <= 0;

-- Normalize recurrence + status defaults when blank/null
UPDATE doctor_schedule
SET recurrence_type = 'weekly'
WHERE recurrence_type IS NULL
  OR TRIM(recurrence_type) = '';

UPDATE doctor_schedule
SET status = 'active'
WHERE status IS NULL
  OR TRIM(status) = '';

-- Disable impossible schedules that cannot produce valid slots
UPDATE doctor_schedule
SET status = 'inactive'
WHERE start_time IS NULL
  OR end_time IS NULL
  OR end_time <= start_time
  OR day_of_week IS NULL
  OR day_of_week < 0
  OR day_of_week > 6;

DROP PROCEDURE IF EXISTS add_column_if_missing;

-- ----- FIX: Allow 'pending_payment' in appointment status -----
-- The CHECK constraint was created without 'pending_payment'; online bookings need it.
SET @has_ck = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'appointment'
    AND CONSTRAINT_NAME = 'ck_appointment_status'
);

SET @drop_sql = IF(@has_ck > 0,
  'ALTER TABLE appointment DROP CHECK ck_appointment_status',
  'SELECT 1');
PREPARE stmt FROM @drop_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE appointment ADD CONSTRAINT ck_appointment_status
  CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled','no_show','pending_payment'));

-- Done!
SELECT 'Migration complete — product/supplier/appointment schema updated, constraint fixed, and doctor_schedule normalized.' AS status;
