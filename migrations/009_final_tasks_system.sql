-- Migración final del sistema de tareas
-- Fecha: 2024

-- 1. Crear tabla de proyectos primero
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3b82f6',
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear tabla de tareas principal
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
  assigned_to INTEGER,
  created_by INTEGER,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Crear tabla de asignaciones múltiples
CREATE TABLE IF NOT EXISTS task_assignments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER,
  user_id INTEGER,
  role VARCHAR(50) DEFAULT 'collaborator',
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INTEGER
);

-- 4. Crear tabla de comentarios
CREATE TABLE IF NOT EXISTS task_comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER,
  user_id INTEGER,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'comment',
  parent_id INTEGER,
  mentions INTEGER[] DEFAULT '{}',
  attachments TEXT[] DEFAULT '{}',
  reactions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Crear tabla de historial
CREATE TABLE IF NOT EXISTS task_history (
  id SERIAL PRIMARY KEY,
  task_id INTEGER,
  user_id INTEGER,
  action VARCHAR(100) NOT NULL,
  changes JSONB,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Crear tabla de subtareas
CREATE TABLE IF NOT EXISTS task_subtasks (
  id SERIAL PRIMARY KEY,
  task_id INTEGER,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  completed_by INTEGER,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Crear tabla de templates
CREATE TABLE IF NOT EXISTS task_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  category VARCHAR(100),
  created_by INTEGER,
  is_public BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Crear tabla de time tracking
CREATE TABLE IF NOT EXISTS task_time_entries (
  id SERIAL PRIMARY KEY,
  task_id INTEGER,
  user_id INTEGER,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_minutes INTEGER,
  description TEXT,
  is_running BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Crear tabla de archivos adjuntos
CREATE TABLE IF NOT EXISTS attachments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  uploaded_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Agregar foreign keys después de crear todas las tablas
ALTER TABLE projects ADD CONSTRAINT fk_projects_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE task_assignments ADD CONSTRAINT fk_task_assignments_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE task_assignments ADD CONSTRAINT fk_task_assignments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE task_assignments ADD CONSTRAINT fk_task_assignments_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE task_comments ADD CONSTRAINT fk_task_comments_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE task_comments ADD CONSTRAINT fk_task_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE task_comments ADD CONSTRAINT fk_task_comments_parent FOREIGN KEY (parent_id) REFERENCES task_comments(id) ON DELETE CASCADE;
ALTER TABLE task_history ADD CONSTRAINT fk_task_history_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE task_history ADD CONSTRAINT fk_task_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE task_subtasks ADD CONSTRAINT fk_task_subtasks_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE task_subtasks ADD CONSTRAINT fk_task_subtasks_completed_by FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE task_templates ADD CONSTRAINT fk_task_templates_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE task_time_entries ADD CONSTRAINT fk_task_time_entries_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE task_time_entries ADD CONSTRAINT fk_task_time_entries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE attachments ADD CONSTRAINT fk_attachments_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE attachments ADD CONSTRAINT fk_attachments_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

-- 11. Agregar unique constraint para task_assignments
ALTER TABLE task_assignments ADD CONSTRAINT uk_task_assignments_task_user UNIQUE (task_id, user_id);

-- 12. Índices básicos
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

-- 13. Comentarios
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

-- 14. Datos iniciales
INSERT INTO projects (name, description, color) VALUES 
('General', 'Tareas generales del sistema', '#6b7280'),
('Desarrollo', 'Tareas de desarrollo y programación', '#3b82f6'),
('Diseño', 'Tareas de diseño y UX/UI', '#8b5cf6'),
('Marketing', 'Tareas de marketing y promoción', '#f59e0b'),
('Soporte', 'Tareas de soporte y mantenimiento', '#10b981')
ON CONFLICT DO NOTHING;

-- 15. Templates iniciales
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
