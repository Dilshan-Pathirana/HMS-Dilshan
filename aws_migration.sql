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

DROP PROCEDURE IF EXISTS add_column_if_missing;

-- Done!
SELECT 'Migration complete — product and supplier tables updated.' AS status;
