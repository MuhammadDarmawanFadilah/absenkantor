-- Check existing absensi data for August 2025
SELECT 
    COUNT(*) as total_records,
    MIN(tanggal) as first_date,
    MAX(tanggal) as last_date
FROM absensi 
WHERE tanggal >= '2025-08-01' AND tanggal <= '2025-08-31';

-- Show detailed records
SELECT 
    a.id,
    p.name as pegawai_name,
    s.nama_shift,
    a.tanggal,
    a.waktu,
    a.type,
    a.status
FROM absensi a
JOIN pegawai p ON a.pegawai_id = p.id
JOIN shift s ON a.shift_id = s.id
WHERE a.tanggal >= '2025-08-01' AND a.tanggal <= '2025-08-31'
ORDER BY a.tanggal, a.waktu;
