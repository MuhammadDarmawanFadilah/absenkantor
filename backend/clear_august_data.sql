-- Clear existing August 2025 absensi data to allow fresh seeding
DELETE FROM absensi 
WHERE tanggal >= '2025-08-01' AND tanggal <= '2025-08-31';
