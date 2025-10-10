-- Configurar zona horaria de Perú (Lima) en PostgreSQL
-- Ejecutar este script en pgAdmin

-- Establecer zona horaria de la sesión
SET timezone = 'America/Lima';

-- Verificar zona horaria actual
SHOW timezone;

-- Para que sea permanente, también ejecuta este comando en pgAdmin:
-- ALTER DATABASE nombre_de_tu_bd SET timezone TO 'America/Lima';

-- Ejemplo: Si tu BD se llama sistema_agenda:
-- ALTER DATABASE sistema_agenda SET timezone TO 'America/Lima';

-- Verificar la hora actual del servidor
SELECT NOW() as hora_actual_servidor;
SELECT CURRENT_TIMESTAMP as hora_con_timezone;
