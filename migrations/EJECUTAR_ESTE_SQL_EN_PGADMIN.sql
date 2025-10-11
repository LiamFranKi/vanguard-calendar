-- ========================================
-- EJECUTAR ESTE SCRIPT EN PGADMIN
-- ========================================
-- 1. Abre pgAdmin
-- 2. Conecta a la base de datos 'agenda_calendario'
-- 3. Ejecuta todo este script

-- Crear tabla para adjuntos de tareas
CREATE TABLE task_attachments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES usuarios(id),
    filename VARCHAR(255) NOT NULL, -- Nombre único en el servidor
    original_name VARCHAR(255) NOT NULL, -- Nombre original del archivo
    file_path VARCHAR(500) NOT NULL, -- Ruta completa del archivo
    file_size INTEGER NOT NULL, -- Tamaño en bytes
    file_type VARCHAR(100) NOT NULL, -- MIME type
    version INTEGER DEFAULT 1, -- Versión del archivo
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX idx_task_attachments_user_id ON task_attachments(user_id);
CREATE INDEX idx_task_attachments_created_at ON task_attachments(created_at);

-- Comentarios para documentación
COMMENT ON TABLE task_attachments IS 'Archivos adjuntos a tareas del sistema';
COMMENT ON COLUMN task_attachments.filename IS 'Nombre único del archivo en el servidor';
COMMENT ON COLUMN task_attachments.original_name IS 'Nombre original del archivo subido por el usuario';
COMMENT ON COLUMN task_attachments.file_path IS 'Ruta completa donde se almacena el archivo';
COMMENT ON COLUMN task_attachments.version IS 'Número de versión del archivo (para historial)';

-- ========================================
-- ¡LISTO! Ahora puedes usar los adjuntos
-- ========================================
