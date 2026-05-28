-- SQL script to change MODERATOR role to VERIFICATOR
-- This script should be run on the database to update existing data

-- Update role name in roles table
UPDATE roles SET role_name = 'VERIFICATOR', description = 'Verificator dengan akses tertentu' WHERE role_name = 'MODERATOR';

-- Update any users that have MODERATOR role
UPDATE users SET role_name = 'VERIFICATOR' WHERE role_name = 'MODERATOR';

-- Update pegawai table if it has role references
UPDATE pegawai SET role = 'VERIFICATOR' WHERE role = 'MODERATOR';

-- Show updated roles
SELECT * FROM roles WHERE role_name = 'VERIFICATOR';

-- Show count of affected records
SELECT 'Roles updated' as message, COUNT(*) as count FROM roles WHERE role_name = 'VERIFICATOR'
UNION ALL
SELECT 'Users updated' as message, COUNT(*) as count FROM users WHERE role_name = 'VERIFICATOR'
UNION ALL  
SELECT 'Pegawai updated' as message, COUNT(*) as count FROM pegawai WHERE role = 'VERIFICATOR';