-- Script SQL para crear usuario administrador
-- DNI: 11111111
-- Clave: waltito10

-- IMPORTANTE: Primero debes hashear la contraseña con bcrypt
-- Ejecuta: node backend/scripts/crearAdmin.js

-- O si prefieres SQL directo, usa este INSERT con la clave ya hasheada:
-- (debes ejecutar el script de Node.js primero para obtener el hash)

INSERT INTO usuarios (
  dni, 
  nombre, 
  apellidos, 
  email, 
  clave, 
  rol, 
  activo, 
  created_at, 
  updated_at
) VALUES (
  '11111111',
  'Administrador',
  'Sistema',
  'admin@sistema.com',
  '$2b$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',  -- Esto es un ejemplo, ejecuta el script .js
  'administrador',
  true,
  NOW(),
  NOW()
);
