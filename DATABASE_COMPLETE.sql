-- =====================================================
-- SCRIPT SQL COMPLETO - VANGUARD CALENDAR
-- Sistema de gestión de calendario educativo
-- =====================================================

-- Crear base de datos (ejecutar en PostgreSQL)
-- CREATE DATABASE vanguard_calendar;

-- =====================================================
-- 1. TABLA DE USUARIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    dni VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(20),
    clave VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario')),
    activo BOOLEAN DEFAULT true,
    avatar VARCHAR(255),
    ultimo_acceso TIMESTAMP,
    configuracion JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 2. TABLA DE CONFIGURACIÓN DEL SISTEMA
-- =====================================================
CREATE TABLE IF NOT EXISTS configuracion_sistema (
    id SERIAL PRIMARY KEY,
    nombre_proyecto VARCHAR(100) DEFAULT 'Vanguard Calendar',
    descripcion_proyecto TEXT DEFAULT 'Sistema moderno de agenda y calendario con notificaciones',
    logo VARCHAR(255),
    favicon VARCHAR(255),
    color_primario VARCHAR(7) DEFAULT '#2563eb',
    color_secundario VARCHAR(7) DEFAULT '#764ba2',
    email_sistema VARCHAR(100),
    telefono_sistema VARCHAR(20),
    direccion_sistema TEXT DEFAULT 'Lima, Perú',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 3. TABLA DE PROYECTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 4. TABLA DE TAREAS
-- =====================================================
CREATE TABLE IF NOT EXISTS tareas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'completada', 'cancelada')),
    prioridad VARCHAR(10) DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
    fecha_vencimiento DATE,
    hora_vencimiento TIME,
    progreso INTEGER DEFAULT 0 CHECK (progreso >= 0 AND progreso <= 100),
    tags TEXT[],
    proyecto_id INTEGER REFERENCES projects(id),
    creador_id INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 5. TABLA DE ASIGNACIONES DE TAREAS
-- =====================================================
CREATE TABLE IF NOT EXISTS tarea_asignaciones (
    id SERIAL PRIMARY KEY,
    tarea_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tarea_id, usuario_id)
);

-- =====================================================
-- 6. TABLA DE COMENTARIOS EN TAREAS
-- =====================================================
CREATE TABLE IF NOT EXISTS task_comments (
    id SERIAL PRIMARY KEY,
    tarea_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    comentario TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 7. TABLA DE HISTORIAL DE TAREAS
-- =====================================================
CREATE TABLE IF NOT EXISTS task_history (
    id SERIAL PRIMARY KEY,
    tarea_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id),
    accion VARCHAR(50) NOT NULL,
    detalles JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 8. TABLA DE EVENTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS eventos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE NOT NULL,
    hora_inicio TIME,
    fecha_fin DATE,
    hora_fin TIME,
    color VARCHAR(7) DEFAULT '#10b981',
    ubicacion VARCHAR(200),
    tipo VARCHAR(50) DEFAULT 'general',
    creador_id INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 9. TABLA DE ASISTENTES A EVENTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS evento_asignaciones (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER REFERENCES eventos(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    rol VARCHAR(20) DEFAULT 'asistente' CHECK (rol IN ('organizador', 'asistente')),
    confirmado BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(evento_id, usuario_id)
);

-- =====================================================
-- 10. TABLA DE NOTIFICACIONES
-- =====================================================
CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    relacionado_tipo VARCHAR(50),
    relacionado_id INTEGER,
    leida BOOLEAN DEFAULT false,
    enviada_push BOOLEAN DEFAULT false,
    enviada_email BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_relacionado_tipo CHECK (
        relacionado_tipo IN (
            'tarea', 'evento', 'comentario', 'asignacion', 
            'cambio_estado', 'cambio_prioridad', 'evento_recordatorio_1dia', 
            'evento_recordatorio_hoy', 'tarea_recordatorio_1dia', 'tarea_recordatorio_hoy'
        )
    )
);

-- =====================================================
-- 11. TABLA DE SUSCRIPCIONES PUSH
-- =====================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(endpoint)
);

-- =====================================================
-- 12. TABLA DE ADJUNTOS DE TAREAS
-- =====================================================
CREATE TABLE IF NOT EXISTS task_attachments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 13. TABLA DE PLANTILLAS DE TAREAS
-- =====================================================
CREATE TABLE IF NOT EXISTS task_templates (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    plantilla JSONB NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 14. TABLA DE REGISTROS DE TIEMPO
-- =====================================================
CREATE TABLE IF NOT EXISTS task_time_entries (
    id SERIAL PRIMARY KEY,
    tarea_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha DATE NOT NULL,
    tiempo_inicio TIME,
    tiempo_fin TIME,
    duracion_minutos INTEGER,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 15. TABLA DE SUBTAREAS
-- =====================================================
CREATE TABLE IF NOT EXISTS task_subtasks (
    id SERIAL PRIMARY KEY,
    tarea_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    completada BOOLEAN DEFAULT false,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_dni ON usuarios(dni);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- Índices para tareas
CREATE INDEX IF NOT EXISTS idx_tareas_estado ON tareas(estado);
CREATE INDEX IF NOT EXISTS idx_tareas_prioridad ON tareas(prioridad);
CREATE INDEX IF NOT EXISTS idx_tareas_fecha_vencimiento ON tareas(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_tareas_creador ON tareas(creador_id);
CREATE INDEX IF NOT EXISTS idx_tareas_proyecto ON tareas(proyecto_id);

-- Índices para eventos
CREATE INDEX IF NOT EXISTS idx_eventos_fecha_inicio ON eventos(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_eventos_creador ON eventos(creador_id);

-- Índices para notificaciones
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON notificaciones(tipo);

-- Índices para push subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_usuario ON push_subscriptions(usuario_id);

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar configuración inicial del sistema
INSERT INTO configuracion_sistema (
    nombre_proyecto, 
    descripcion_proyecto, 
    color_primario, 
    color_secundario,
    direccion_sistema,
    email_sistema
) VALUES (
    'Vanguard Calendar',
    'Sistema moderno de agenda y calendario con notificaciones. Gestiona eventos, tareas y mantén tu equipo organizado.',
    '#2563eb',
    '#764ba2',
    'Lima, Perú',
    'admin@vanguardcalendar.com'
) ON CONFLICT DO NOTHING;

-- Insertar proyectos por defecto
INSERT INTO projects (nombre, descripcion, color) VALUES
('General', 'Proyecto general para tareas sin categoría específica', '#3b82f6'),
('Desarrollo', 'Tareas relacionadas con desarrollo de software', '#10b981'),
('Marketing', 'Tareas de marketing y promoción', '#f59e0b'),
('Administración', 'Tareas administrativas y de gestión', '#8b5cf6')
ON CONFLICT DO NOTHING;

-- Insertar plantillas de tareas
INSERT INTO task_templates (nombre, descripcion, plantilla) VALUES
('Reunión de equipo', 'Plantilla para reuniones de equipo', '{"titulo": "Reunión de equipo - [TEMA]", "descripcion": "Agenda:\n1. Revisión de tareas pendientes\n2. [PUNTO 1]\n3. [PUNTO 2]\n4. Próximos pasos", "prioridad": "media", "tags": ["reunion", "equipo"]}'),
('Desarrollo de funcionalidad', 'Plantilla para desarrollo de nuevas funcionalidades', '{"titulo": "Desarrollar: [FUNCIONALIDAD]", "descripcion": "Objetivo: [OBJETIVO]\n\nCriterios de aceptación:\n- [ ] Criterio 1\n- [ ] Criterio 2\n- [ ] Criterio 3", "prioridad": "alta", "tags": ["desarrollo", "funcionalidad"]}'),
('Revisión de código', 'Plantilla para revisiones de código', '{"titulo": "Revisar código: [MÓDULO]", "descripcion": "Revisar:\n- [ ] Estructura del código\n- [ ] Cumplimiento de estándares\n- [ ] Pruebas unitarias\n- [ ] Documentación", "prioridad": "media", "tags": ["codigo", "revision"]}')
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracion_sistema_updated_at BEFORE UPDATE ON configuracion_sistema FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tareas_updated_at BEFORE UPDATE ON tareas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_eventos_updated_at BEFORE UPDATE ON eventos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notificaciones_updated_at BEFORE UPDATE ON notificaciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_attachments_updated_at BEFORE UPDATE ON task_attachments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_templates_updated_at BEFORE UPDATE ON task_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_time_entries_updated_at BEFORE UPDATE ON task_time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_subtasks_updated_at BEFORE UPDATE ON task_subtasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CONFIGURACIÓN DE TIMEZONE
-- =====================================================

-- Configurar timezone para Perú
SET timezone = 'America/Lima';

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

-- Este script crea la estructura completa de la base de datos
-- para el sistema Vanguard Calendar con todas las funcionalidades:
-- - Gestión de usuarios y autenticación
-- - Sistema de tareas y proyectos
-- - Calendario de eventos
-- - Notificaciones push y por email
-- - PWA y Service Worker
-- - Archivos adjuntos
-- - Plantillas de tareas
-- - Registro de tiempo
-- - Subtareas y comentarios

-- Para ejecutar este script:
-- 1. Crear la base de datos: CREATE DATABASE vanguard_calendar;
-- 2. Ejecutar este script completo
-- 3. Crear usuario administrador con el script crearAdmin.js
