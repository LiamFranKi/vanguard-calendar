-- ========================================
-- SCRIPT PARA EJECUTAR EN PGADMIN
-- Sistema de Tareas Avanzado - Vanguard Calendar
-- ========================================

-- 1. Crear tabla de proyectos
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3b82f6',
  created_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Agregar columnas nuevas a la tabla tareas existente (si no existen)
DO $$ 
BEGIN
  -- Agregar project_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tareas' AND column_name='project_id') THEN
    ALTER TABLE tareas ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;
  END IF;

  -- Agregar estimacion_horas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tareas' AND column_name='estimacion_horas') THEN
    ALTER TABLE tareas ADD COLUMN estimacion_horas DECIMAL(5,2);
  END IF;

  -- Agregar progreso
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tareas' AND column_name='progreso') THEN
    ALTER TABLE tareas ADD COLUMN progreso INTEGER DEFAULT 0 CHECK (progreso >= 0 AND progreso <= 100);
  END IF;

  -- Agregar tags
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tareas' AND column_name='tags') THEN
    ALTER TABLE tareas ADD COLUMN tags TEXT[];
  END IF;

  -- Agregar fecha_inicio
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tareas' AND column_name='fecha_inicio') THEN
    ALTER TABLE tareas ADD COLUMN fecha_inicio TIMESTAMP;
  END IF;

  -- Agregar recordatorios
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tareas' AND column_name='recordatorios') THEN
    ALTER TABLE tareas ADD COLUMN recordatorios JSONB;
  END IF;

  -- Agregar metadata
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tareas' AND column_name='metadata') THEN
    ALTER TABLE tareas ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- 3. Crear tabla de comentarios de tareas
CREATE TABLE IF NOT EXISTS task_comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'comment',
  parent_id INTEGER REFERENCES task_comments(id) ON DELETE CASCADE,
  mentions INTEGER[] DEFAULT '{}',
  attachments TEXT[] DEFAULT '{}',
  reactions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Crear tabla de historial de tareas
CREATE TABLE IF NOT EXISTS task_history (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  changes JSONB,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Crear tabla de subtareas
CREATE TABLE IF NOT EXISTS task_subtasks (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  completed_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Crear tabla de templates de tareas
CREATE TABLE IF NOT EXISTS task_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  category VARCHAR(100),
  created_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Crear tabla de time tracking
CREATE TABLE IF NOT EXISTS task_time_entries (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_minutes INTEGER,
  description TEXT,
  is_running BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Crear tabla de archivos adjuntos (si no existe con otro nombre)
CREATE TABLE IF NOT EXISTS task_attachments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  uploaded_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Crear tabla de dependencias entre tareas
CREATE TABLE IF NOT EXISTS task_dependencies (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
  depends_on_task_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
  dependency_type VARCHAR(20) DEFAULT 'blocks',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, depends_on_task_id),
  CHECK (task_id != depends_on_task_id)
);

-- 10. Modificar tabla tarea_asignaciones existente para agregar nueva columna
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tarea_asignaciones' AND column_name='assigned_by') THEN
    ALTER TABLE tarea_asignaciones ADD COLUMN assigned_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tarea_asignaciones' AND column_name='assigned_at') THEN
    ALTER TABLE tarea_asignaciones ADD COLUMN assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- 11. Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_tareas_project ON tareas(project_id);
CREATE INDEX IF NOT EXISTS idx_tareas_tags ON tareas USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_mentions ON task_comments USING GIN(mentions);
CREATE INDEX IF NOT EXISTS idx_task_history_task ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_task ON task_subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_entries_task ON task_time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_entries_user ON task_time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task ON task_dependencies(task_id);

-- 12. Agregar comentarios a las tablas
COMMENT ON TABLE projects IS 'Proyectos para organizar tareas';
COMMENT ON TABLE task_comments IS 'Comentarios y discusiones en tareas con menciones y reacciones';
COMMENT ON TABLE task_history IS 'Historial completo de cambios en tareas para auditoría';
COMMENT ON TABLE task_subtasks IS 'Subtareas o checklist de una tarea principal';
COMMENT ON TABLE task_templates IS 'Templates reutilizables para crear tareas rápidamente';
COMMENT ON TABLE task_time_entries IS 'Registro de tiempo trabajado en tareas';
COMMENT ON TABLE task_dependencies IS 'Dependencias entre tareas (bloqueos, requerimientos)';

-- 13. Insertar datos iniciales - Proyectos por defecto
INSERT INTO projects (name, description, color) VALUES 
('General', 'Tareas generales del sistema', '#6b7280'),
('Desarrollo', 'Tareas de desarrollo y programación', '#3b82f6'),
('Diseño', 'Tareas de diseño y UX/UI', '#8b5cf6'),
('Marketing', 'Tareas de marketing y promoción', '#f59e0b'),
('Soporte', 'Tareas de soporte y mantenimiento', '#10b981')
ON CONFLICT DO NOTHING;

-- 14. Insertar templates iniciales
INSERT INTO task_templates (name, description, template_data, category, is_public) VALUES 
('Bug Fix', 'Template para reportar y solucionar bugs', 
 '{"title": "🐛 [BUG] ", "description": "## Descripción del Bug\n\n## Pasos para reproducir\n\n## Comportamiento esperado\n\n## Comportamiento actual\n\n## Información adicional", "prioridad": "alta", "tags": ["bug", "fix"]}', 
 'development', true),
('Feature Request', 'Template para solicitar nuevas funcionalidades',
 '{"title": "✨ [FEATURE] ", "description": "## Descripción de la funcionalidad\n\n## Casos de uso\n\n## Criterios de aceptación\n\n## Consideraciones técnicas", "prioridad": "media", "tags": ["feature", "enhancement"]}',
 'development', true),
('Design Task', 'Template para tareas de diseño',
 '{"title": "🎨 [DESIGN] ", "description": "## Brief del diseño\n\n## Objetivos\n\n## Target audience\n\n## Referencias\n\n## Entregables", "prioridad": "media", "tags": ["design", "ux"]}',
 'design', true)
ON CONFLICT DO NOTHING;

-- ========================================
-- FIN DEL SCRIPT
-- ========================================

-- Verificar que todo se creó correctamente
SELECT 'Proyectos creados: ' || COUNT(*) FROM projects;
SELECT 'Templates creados: ' || COUNT(*) FROM task_templates;
SELECT 'Tablas nuevas creadas exitosamente!' as mensaje;
