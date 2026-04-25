-- BCrypt hash for password "12345678"
UPDATE user SET password = '$2a$10$UxNK.3I8g6c0.95xJPzEiuiTlwVA1j2J36TsC7k4Nz5VJLCvKgxjW' WHERE email='a@gmail.com';

-- Verify
SELECT email, password FROM user WHERE email='a@gmail.com';
