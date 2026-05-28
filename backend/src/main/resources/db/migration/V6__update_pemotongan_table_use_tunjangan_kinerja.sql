-- Migration to update pemotongan table to use tunjangan_kinerja instead of gaji_pokok
-- V6__update_pemotongan_table_use_tunjangan_kinerja.sql

-- Add tunjangan_kinerja column
ALTER TABLE pemotongan ADD COLUMN tunjangan_kinerja DECIMAL(15,2);

-- Copy data from gaji_pokok to tunjangan_kinerja if exists
UPDATE pemotongan 
SET tunjangan_kinerja = gaji_pokok 
WHERE gaji_pokok IS NOT NULL;

-- Drop the old gaji_pokok column
ALTER TABLE pemotongan DROP COLUMN gaji_pokok;

-- Update nominal_pemotongan based on tunjangan_kinerja
UPDATE pemotongan 
SET nominal_pemotongan = (tunjangan_kinerja * persentase_pemotongan / 100)
WHERE tunjangan_kinerja IS NOT NULL 
  AND persentase_pemotongan IS NOT NULL 
  AND nominal_pemotongan IS NULL;
