-- Migración simple del sistema de tareas
-- Fecha: 2024

-- Crear tabla de tareas principal
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP,
  priority VARCHAR(20) DEFAULT 'media',
  status VARCHAR(20) DEFAULT 'pendiente',
  categoria VARCHAR(100) DEFAULT 'general',
  project_id INTEGER,
  estimacion_horas DECIMAL(5,2),
  progreso INTEGER DEFAULT 0 CHECK (progreso >= 0 AND progreso <= 100),
  tags TEXT[],
  fecha_inicio TIMESTAMP,
  recordatorios JSONB,
  metadata JSONB,
  assigned_to INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de proyectos
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3b82f6',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agregar referencia a proyecto en tareas
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- Crear tabla de asignaciones múltiples
CREATE TABLE IF NOT EXISTS task_assignments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'collaborator',
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
  type VARCHAR(20) DEFAULT 'comment',
  parent_id INTEGER REFERENCES task_comments(id) ON DELETE CASCADE,
  mentions INTEGER[] DEFAULT '{}',
  attachments TEXT[] DEFAULT '{}',
  reactions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de historial
CREATE TABLE IF NOT EXISTS task_history (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  changes JSONB,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- Crear tabla de templates
CREATE TABLE IF NOT EXISTS task_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
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
  duration_minutes INTEGER,
  description TEXT,
  is_running BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de archivos adjuntos
CREATE TABLE IF NOT EXISTS attachments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices básicos
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user ON task_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_history_task ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_task ON task_subtasks(task_id);

-- Comentarios
COMMENT ON TABLE tasks IS 'Tabla principal de tareas';
COMMENT ON COLUMN tasks.priority IS 'Prioridades: baja, media, alta, urgente';
COMMENT ON COLUMN tasks.status IS 'Estados: pendiente, en_progreso, en_revision, completada, cancelada';
COMMENT ON TABLE task_assignments IS 'Asignaciones múltiples de usuarios a tareas';
COMMENT ON TABLE task_comments IS 'Comentarios y discusiones en tareas';
COMMENT ON TABLE task_history IS 'Historial de cambios en tareas';
COMMENT ON TABLE task_subtasks IS 'Subtareas o checklist de una tarea principal';
COMMENT ON TABLE projects IS 'Proyectos para organizar tareas';
COMMENT ON TABLE task_templates IS 'Templates reutilizables para crear tareas';
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
