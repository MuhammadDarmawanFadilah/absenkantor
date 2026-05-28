-- Update any existing MODERATOR roles to VERIFICATOR
UPDATE roles SET role_name = 'VERIFICATOR' WHERE role_name = 'MODERATOR';

-- Update any users with MODERATOR role to VERIFICATOR
UPDATE users SET role_id = (SELECT role_id FROM roles WHERE role_name = 'VERIFICATOR') 
WHERE role_id = (SELECT role_id FROM roles WHERE role_name = 'MODERATOR');

-- Check the results
SELECT * FROM roles WHERE role_name IN ('ADMIN', 'VERIFICATOR', 'PEGAWAI');
SELECT u.id, u.nama_lengkap, u.email, r.role_name 
FROM users u 
JOIN roles r ON u.role_id = r.role_id 
WHERE r.role_name IN ('ADMIN', 'VERIFICATOR', 'PEGAWAI')
ORDER BY r.role_name, u.nama_lengkap;