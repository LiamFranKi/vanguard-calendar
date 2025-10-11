-- =====================================================
-- SCRIPT: Crear tablas para EVENTOS del calendario
-- FECHA: 2025-10-11
-- EJECUTAR EN: pgAdmin (Sistema Agenda Calendario)
-- =====================================================

-- ===== TABLA: eventos =====
CREATE TABLE IF NOT EXISTS eventos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP,
    ubicacion VARCHAR(255),
    color VARCHAR(7) DEFAULT '#22c55e',
    todo_el_dia BOOLEAN DEFAULT FALSE,
    creado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===== TABLA: evento_asistentes =====
CREATE TABLE IF NOT EXISTS evento_asistentes (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    estado VARCHAR(50) DEFAULT 'pendiente', -- pendiente, confirmado, rechazado
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(evento_id, usuario_id)
);

-- ===== ÍNDICES para mejorar rendimiento =====
CREATE INDEX IF NOT EXISTS idx_eventos_fecha_inicio ON eventos(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_eventos_creado_por ON eventos(creado_por);
CREATE INDEX IF NOT EXISTS idx_evento_asistentes_evento ON evento_asistentes(evento_id);
CREATE INDEX IF NOT EXISTS idx_evento_asistentes_usuario ON evento_asistentes(usuario_id);

-- ===== DATOS DE PRUEBA (opcional) =====
-- Insertar algunos eventos de ejemplo
INSERT INTO eventos (titulo, descripcion, fecha_inicio, fecha_fin, ubicacion, color, todo_el_dia, creado_por)
VALUES 
    ('Reunión de Equipo', 'Revisión semanal de proyectos', '2025-10-15 10:00:00', '2025-10-15 11:00:00', 'Sala de conferencias', '#3b82f6', FALSE, 1),
    ('Capacitación', 'Curso de nuevas tecnologías', '2025-10-20 14:00:00', '2025-10-20 17:00:00', 'Auditorio', '#8b5cf6', FALSE, 1),
    ('Día festivo', 'Feriado nacional', '2025-10-28 00:00:00', '2025-10-28 23:59:59', NULL, '#ef4444', TRUE, 1)
ON CONFLICT DO NOTHING;

-- ===== COMENTARIOS EN LAS TABLAS =====
COMMENT ON TABLE eventos IS 'Almacena eventos del calendario del sistema';
COMMENT ON TABLE evento_asistentes IS 'Relaciona eventos con usuarios asistentes';

-- ===== VERIFICACIÓN =====
SELECT 'Tablas de eventos creadas exitosamente' as mensaje;
SELECT COUNT(*) as total_eventos FROM eventos;
SELECT COUNT(*) as total_asistentes FROM evento_asistentes;

