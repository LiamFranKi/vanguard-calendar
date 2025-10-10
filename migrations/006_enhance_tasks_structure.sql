-- Migración para mejorar la estructura de tareas
-- Fecha: 2024

-- Agregar nuevas columnas a la tabla tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS categoria VARCHAR(100) DEFAULT 'general';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimacion_horas DECIMAL(5,2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS progreso INTEGER DEFAULT 0 CHECK (progreso >= 0 AND progreso <= 100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[]; -- Array de tags
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS fecha_inicio TIMESTAMP;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recordatorios JSONB; -- Configuración de recordatorios
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS metadata JSONB; -- Datos adicionales flexibles

-- Crear tabla de asignaciones múltiples (muchos a muchos)
CREATE TABLE IF NOT EXISTS task_assignments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'collaborator', -- owner, collaborator, observer
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(task_id, user_id)
);

-- Crear tabla de comentarios
CREATE TABLE IF NOT EXISTS task_comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'comment', -- comment, mention, system
  parent_id INTEGER REFERENCES task_comments(id) ON DELETE CASCADE, -- Para threads
  mentions INTEGER[] DEFAULT '{}', -- Array de IDs de usuarios mencionados
  attachments TEXT[] DEFAULT '{}', -- Array de archivos adjuntos
  reactions JSONB DEFAULT '{}', -- Reacciones: {"👍": [user_ids], "❤️": [user_ids]}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de historial de cambios
CREATE TABLE IF NOT EXISTS task_history (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- created, updated, assigned, commented, etc.
  changes JSONB, -- Cambios específicos realizados
  old_values JSONB, -- Valores anteriores
  new_values JSONB, -- Valores nuevos
  metadata JSONB, -- Información adicional del cambio
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de dependencias entre tareas
CREATE TABLE IF NOT EXISTS task_dependencies (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type VARCHAR(20) DEFAULT 'blocks', -- blocks, requires, related
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, depends_on_task_id),
  CHECK (task_id != depends_on_task_id) -- Evitar dependencias circulares
);

-- Crear tabla de subtareas
CREATE TABLE IF NOT EXISTS task_subtasks (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  completed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de proyectos/categorías
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3b82f6', -- Color hex para identificación visual
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agregar referencia a proyecto en tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;

-- Crear tabla de templates de tareas
CREATE TABLE IF NOT EXISTS task_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL, -- Estructura de la tarea template
  category VARCHAR(100),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de time tracking
CREATE TABLE IF NOT EXISTS task_time_entries (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_minutes INTEGER, -- Calculado automáticamente
  description TEXT,
  is_running BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user ON task_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_history_task ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends ON task_dependencies(depends_on_task_id);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_task ON task_subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(categoria);
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON tasks USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_task_comments_mentions ON task_comments USING GIN(mentions);
CREATE INDEX IF NOT EXISTS idx_task_comments_reactions ON task_comments USING GIN(reactions);

-- Triggers para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a las tablas que lo necesitan
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_comments_updated_at ON task_comments;
CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_subtasks_updated_at ON task_subtasks;
CREATE TRIGGER update_task_subtasks_updated_at BEFORE UPDATE ON task_subtasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_templates_updated_at ON task_templates;
CREATE TRIGGER update_task_templates_updated_at BEFORE UPDATE ON task_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular duración automáticamente
CREATE OR REPLACE FUNCTION calculate_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
        NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
        NEW.is_running = FALSE;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS calculate_duration_trigger ON task_time_entries;
CREATE TRIGGER calculate_duration_trigger BEFORE UPDATE ON task_time_entries FOR EACH ROW EXECUTE FUNCTION calculate_duration();

-- Comentarios para documentación
COMMENT ON TABLE task_assignments IS 'Asignaciones múltiples de usuarios a tareas con roles específicos';
COMMENT ON TABLE task_comments IS 'Comentarios y discusiones en tareas con mención y reacciones';
COMMENT ON TABLE task_history IS 'Historial completo de cambios en tareas para auditoría';
COMMENT ON TABLE task_dependencies IS 'Dependencias entre tareas (bloqueos, requerimientos)';
COMMENT ON TABLE task_subtasks IS 'Subtareas o checklist de una tarea principal';
COMMENT ON TABLE projects IS 'Proyectos o categorías principales para organizar tareas';
COMMENT ON TABLE task_templates IS 'Templates reutilizables para crear tareas rápidamente';
COMMENT ON TABLE task_time_entries IS 'Registro de tiempo trabajado en tareas';

-- Datos iniciales
INSERT INTO projects (name, description, color) VALUES 
('General', 'Tareas generales del sistema', '#6b7280'),
('Desarrollo', 'Tareas de desarrollo y programación', '#3b82f6'),
('Diseño', 'Tareas de diseño y UX/UI', '#8b5cf6'),
('Marketing', 'Tareas de marketing y promoción', '#f59e0b'),
('Soporte', 'Tareas de soporte y mantenimiento', '#10b981')
ON CONFLICT DO NOTHING;

-- Templates iniciales
INSERT INTO task_templates (name, description, template_data, category, is_public) VALUES 
('Bug Fix', 'Template para reportar y solucionar bugs', 
 '{"title": "🐛 [BUG] ", "description": "## Descripción del Bug\n\n## Pasos para reproducir\n\n## Comportamiento esperado\n\n## Comportamiento actual\n\n## Información adicional", "priority": "alta", "tags": ["bug", "fix"]}', 
 'development', true),
('Feature Request', 'Template para solicitar nuevas funcionalidades',
 '{"title": "✨ [FEATURE] ", "description": "## Descripción de la funcionalidad\n\n## Casos de uso\n\n## Criterios de aceptación\n\n## Consideraciones técnicas", "priority": "media", "tags": ["feature", "enhancement"]}',
 'development', true),
('Design Task', 'Template para tareas de diseño',
 '{"title": "🎨 [DESIGN] ", "description": "## Brief del diseño\n\n## Objetivos\n\n## Target audience\n\n## Referencias\n\n## Entregables", "priority": "media", "tags": ["design", "ux"]}',
 'design', true)
ON CONFLICT DO NOTHING;
