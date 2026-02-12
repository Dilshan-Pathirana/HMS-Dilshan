-- ============================================================
-- AWS Migration Script
-- Run this on the AWS MySQL database to add missing columns
-- that were added during local development.
-- ============================================================

-- ----- PRODUCT TABLE: add 14 new columns -----
ALTER TABLE product
  ADD COLUMN IF NOT EXISTS item_code VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS barcode VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS brand_name VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS current_stock INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_stock INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reorder_level INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reorder_quantity INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS unit_selling_price DECIMAL(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS expiry_date VARCHAR(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS product_store_location VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS warranty_serial VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS warranty_duration VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS warranty_type VARCHAR(50) DEFAULT NULL;

-- ----- SUPPLIER TABLE: add 10 new columns -----
ALTER TABLE supplier
  ADD COLUMN IF NOT EXISTS supplier_city VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS supplier_country VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS supplier_type VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS products_supplied TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS delivery_time VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bank_details TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rating VARCHAR(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS discounts_agreements TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS return_policy TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS note TEXT DEFAULT NULL;

-- Done!
SELECT 'Migration complete — product and supplier tables updated.' AS status;
