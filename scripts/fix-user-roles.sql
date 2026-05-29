-- Corriger les rôles directement en base (MySQL, schéma geranceee).
-- Adapter les e-mails avant d'exécuter.
-- Valeurs valides : ROLE_SUPER_ADMIN, ROLE_ADMIN_COMMERCIAL, ROLE_ADMIN_TECHNIQUE,
--                   ROLE_COMMERCIAL, ROLE_TECHNIQUE, ROLE_ADMINISTRATEUR

USE geranceee;

SELECT id, email, role FROM user ORDER BY id;

-- Exemples (décommenter et modifier) :
-- UPDATE user SET role = 'ROLE_SUPER_ADMIN' WHERE email = 'admin@example.com';
-- UPDATE user SET role = 'ROLE_ADMIN_TECHNIQUE' WHERE email = 'tech@example.com';

-- Vérification :
-- SELECT id, email, role FROM user ORDER BY id;
