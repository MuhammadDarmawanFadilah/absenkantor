-- Update existing laporan tukin to set isPersonalReport flag
-- Personal reports are identified by "Pribadi" in the title

UPDATE laporan_tukin 
SET is_personal_report = true 
WHERE judul LIKE '%Pribadi%' 
AND (is_personal_report IS NULL OR is_personal_report = false);

UPDATE laporan_tukin 
SET is_personal_report = false 
WHERE judul NOT LIKE '%Pribadi%' 
AND is_personal_report IS NULL;