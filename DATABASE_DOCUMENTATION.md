# 🗄️ DOCUMENTACIÓN DE BASE DE DATOS - Vanguard Calendar

Documentación completa de la estructura de base de datos PostgreSQL.

---

## 📊 Diagrama de Relaciones

```
┌─────────────────┐
│    usuarios     │◄─────────┐
│  (Usuarios)     │          │
└────────┬────────┘          │
         │                   │
         │ creado_por        │ usuario_id
         │                   │
┌────────▼────────┐    ┌─────┴──────────────┐
│     tareas      │◄───│ tarea_asignaciones │
│    (Tareas)     │    │   (Asignaciones)   │
└────────┬────────┘    └────────────────────┘
         │
         │ project_id
         │
┌────────▼────────┐
│    projects     │
│   (Proyectos)   │
└─────────────────┘

┌─────────────────┐     ┌──────────────────┐
│  task_comments  │     │  task_subtasks   │
│  (Comentarios)  │◄────┤   (Subtareas)    │
└─────────────────┘     └──────────────────┘
         │                       │
         │ task_id               │ task_id
         │                       │
         └───────────┬───────────┘
                     │
              ┌──────▼──────┐
              │   tareas    │
              └─────────────┘
```

---

## 📋 TABLAS PRINCIPALES

### 1. **usuarios** 👥
Tabla principal de usuarios del sistema.

**Ubicación:** Schema público  
**Última modificación:** v1.5.0

#### Estructura:
```sql
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombres VARCHAR(255) NOT NULL,
  apellidos VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  telefono VARCHAR(20),
  dni VARCHAR(8) NOT NULL UNIQUE,
  clave VARCHAR(255) NOT NULL,
  rol VARCHAR(50) DEFAULT 'Usuario',
  activo BOOLEAN DEFAULT true,
  avatar VARCHAR(500),
  ultimo_acceso TIMESTAMP,
  configuracion JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### Campos:
| Campo | Tipo | Descripción | Valores |
|-------|------|-------------|---------|
| `id` | SERIAL | ID único autoincremental | PK |
| `nombres` | VARCHAR(255) | Nombre(s) del usuario | NOT NULL |
| `apellidos` | VARCHAR(255) | Apellidos del usuario | NOT NULL |
| `email` | VARCHAR(255) | Email único | UNIQUE, NOT NULL |
| `telefono` | VARCHAR(20) | Teléfono de contacto | NULL |
| `dni` | VARCHAR(8) | DNI único (usado para login) | UNIQUE, NOT NULL |
| `clave` | VARCHAR(255) | Hash bcrypt de contraseña | NOT NULL |
| `rol` | VARCHAR(50) | Rol del usuario | 'Administrador', 'Usuario' |
| `activo` | BOOLEAN | Estado de la cuenta | true/false |
| `avatar` | VARCHAR(500) | Ruta del avatar | NULL |
| `ultimo_acceso` | TIMESTAMP | Última vez que inició sesión | NULL |
| `configuracion` | JSONB | Configuración personal | {} |
| `created_at` | TIMESTAMP | Fecha de creación | now() |
| `updated_at` | TIMESTAMP | Fecha de actualización | now() |

#### Índices:
```sql
CREATE INDEX idx_usuarios_dni ON usuarios(dni);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
```

#### Ejemplo:
```sql
INSERT INTO usuarios (nombres, apellidos, email, dni, clave, rol) 
VALUES ('Walter', 'Admin', 'admin@vanguard.com', '11111111', '$2b$10$...', 'Administrador');
```

---

### 2. **tareas** 📋
Tabla principal de tareas del sistema.

**Ubicación:** Schema público  
**Última modificación:** v2.0.0

#### Estructura:
```sql
CREATE TABLE tareas (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fecha_vencimiento TIMESTAMP,
  prioridad VARCHAR(20) DEFAULT 'media',
  estado VARCHAR(20) DEFAULT 'pendiente',
  categoria VARCHAR(50) DEFAULT 'general',
  color VARCHAR(7) DEFAULT '#ff9800',
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  estimacion_horas DECIMAL(5,2),
  progreso INTEGER DEFAULT 0 CHECK (progreso >= 0 AND progreso <= 100),
  tags TEXT[],
  fecha_inicio TIMESTAMP,
  recordatorios JSONB,
  metadata JSONB,
  creado_por INTEGER NOT NULL REFERENCES usuarios(id),
  completado_por INTEGER REFERENCES usuarios(id),
  fecha_completado TIMESTAMP,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### Campos:
| Campo | Tipo | Descripción | Valores Posibles |
|-------|------|-------------|------------------|
| `id` | SERIAL | ID único | PK |
| `titulo` | VARCHAR(255) | Título de la tarea | NOT NULL |
| `descripcion` | TEXT | Descripción detallada | NULL |
| `fecha_vencimiento` | TIMESTAMP | Fecha límite | NULL |
| `prioridad` | VARCHAR(20) | Prioridad | 'baja', 'media', 'alta', 'urgente' |
| `estado` | VARCHAR(20) | Estado actual | 'pendiente', 'en_progreso', 'en_revision', 'completada', 'cancelada' |
| `categoria` | VARCHAR(50) | Categoría | 'general', 'desarrollo', 'diseño', etc. |
| `color` | VARCHAR(7) | Color hex | '#ff9800' |
| `project_id` | INTEGER | ID del proyecto | FK → projects.id |
| `estimacion_horas` | DECIMAL(5,2) | Horas estimadas | 0.00 - 999.99 |
| `progreso` | INTEGER | Porcentaje completado | 0-100 |
| `tags` | TEXT[] | Array de etiquetas | ['bug', 'feature'] |
| `fecha_inicio` | TIMESTAMP | Fecha de inicio | NULL |
| `recordatorios` | JSONB | Config recordatorios | {"15min": true} |
| `metadata` | JSONB | Datos adicionales | {} |
| `creado_por` | INTEGER | Creador | FK → usuarios.id |
| `completado_por` | INTEGER | Quien completó | FK → usuarios.id |
| `fecha_completado` | TIMESTAMP | Cuándo se completó | NULL |

#### Índices:
```sql
CREATE INDEX idx_tareas_estado ON tareas(estado);
CREATE INDEX idx_tareas_prioridad ON tareas(prioridad);
CREATE INDEX idx_tareas_creado_por ON tareas(creado_por);
CREATE INDEX idx_tareas_project ON tareas(project_id);
CREATE INDEX idx_tareas_tags ON tareas USING GIN(tags);
```

---

### 3. **projects** 📁
Proyectos para organizar tareas.

**Ubicación:** Schema público  
**Última modificación:** v2.0.0

#### Estructura:
```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3b82f6',
  created_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### Campos:
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | ID único |
| `name` | VARCHAR(255) | Nombre del proyecto |
| `description` | TEXT | Descripción |
| `color` | VARCHAR(7) | Color identificador hex |
| `created_by` | INTEGER | Creador del proyecto |

#### Datos Iniciales:
```sql
INSERT INTO projects (name, description, color) VALUES 
('General', 'Tareas generales del sistema', '#6b7280'),
('Desarrollo', 'Tareas de desarrollo y programación', '#3b82f6'),
('Diseño', 'Tareas de diseño y UX/UI', '#8b5cf6'),
('Marketing', 'Tareas de marketing y promoción', '#f59e0b'),
('Soporte', 'Tareas de soporte y mantenimiento', '#10b981');
```

---

### 4. **tarea_asignaciones** 👥
Asignaciones múltiples de usuarios a tareas.

**Ubicación:** Schema público  
**Última modificación:** v2.0.0

#### Estructura:
```sql
CREATE TABLE tarea_asignaciones (
  id SERIAL PRIMARY KEY,
  tarea_id INTEGER NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  rol VARCHAR(20) DEFAULT 'asignado',
  assigned_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP DEFAULT now(),
  notificado BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(tarea_id, usuario_id)
);
```

#### Campos:
| Campo | Tipo | Descripción | Valores |
|-------|------|-------------|---------|
| `tarea_id` | INTEGER | ID de la tarea | FK → tareas.id |
| `usuario_id` | INTEGER | ID del usuario asignado | FK → usuarios.id |
| `rol` | VARCHAR(20) | Rol en la tarea | 'asignado', 'responsable', 'colaborador' |
| `assigned_by` | INTEGER | Quien asignó | FK → usuarios.id |
| `notificado` | BOOLEAN | Si fue notificado | true/false |

---

### 5. **task_comments** 💬
Comentarios en tareas con menciones y reacciones.

**Ubicación:** Schema público  
**Última modificación:** v2.0.0

#### Estructura:
```sql
CREATE TABLE task_comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'comment',
  parent_id INTEGER REFERENCES task_comments(id) ON DELETE CASCADE,
  mentions INTEGER[] DEFAULT '{}',
  attachments TEXT[] DEFAULT '{}',
  reactions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### Campos:
| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `task_id` | INTEGER | Tarea relacionada | FK → tareas.id |
| `user_id` | INTEGER | Autor del comentario | FK → usuarios.id |
| `content` | TEXT | Contenido del comentario | "Excelente trabajo!" |
| `type` | VARCHAR(20) | Tipo | 'comment', 'mention', 'system' |
| `parent_id` | INTEGER | Comentario padre (threads) | NULL o ID |
| `mentions` | INTEGER[] | IDs usuarios mencionados | {1, 5, 8} |
| `attachments` | TEXT[] | Archivos adjuntos | {'file1.pdf'} |
| `reactions` | JSONB | Reacciones | {"👍": [1,2], "❤️": [3]} |

#### Ejemplo de reactions:
```json
{
  "👍": [1, 5, 8],
  "❤️": [2, 3],
  "😮": [4]
}
```

---

### 6. **task_history** 📊
Historial completo de cambios en tareas.

**Ubicación:** Schema público  
**Última modificación:** v2.0.0

#### Estructura:
```sql
CREATE TABLE task_history (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  changes JSONB,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);
```

#### Campos:
| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `action` | VARCHAR(100) | Acción realizada | 'created', 'updated', 'assigned', 'commented' |
| `changes` | JSONB | Qué cambió | {"status": {"old": "pendiente", "new": "completada"}} |
| `old_values` | JSONB | Valores anteriores | {"status": "pendiente"} |
| `new_values` | JSONB | Valores nuevos | {"status": "completada"} |
| `metadata` | JSONB | Info adicional | {"ip": "192.168.1.1"} |

---

### 7. **task_subtasks** ✅
Subtareas y checklist de tareas principales.

**Ubicación:** Schema público  
**Última modificación:** v2.0.0

#### Estructura:
```sql
CREATE TABLE task_subtasks (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  completed_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### Campos:
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `task_id` | INTEGER | Tarea padre |
| `title` | VARCHAR(255) | Título de subtarea |
| `completed` | BOOLEAN | Si está completada |
| `completed_by` | INTEGER | Quien la completó |
| `order_index` | INTEGER | Orden de visualización |

---

### 8. **task_templates** 📄
Templates reutilizables para crear tareas.

**Ubicación:** Schema público  
**Última modificación:** v2.0.0

#### Estructura:
```sql
CREATE TABLE task_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  category VARCHAR(100),
  created_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### Campos:
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | VARCHAR(255) | Nombre del template |
| `template_data` | JSONB | Estructura de la tarea |
| `category` | VARCHAR(100) | Categoría |
| `is_public` | BOOLEAN | Si es público o privado |
| `usage_count` | INTEGER | Veces usado |

#### Ejemplo template_data:
```json
{
  "title": "🐛 [BUG] ",
  "description": "## Descripción del Bug\n\n## Pasos para reproducir\n\n## Comportamiento esperado",
  "prioridad": "alta",
  "tags": ["bug", "fix"]
}
```

---

### 9. **task_time_entries** ⏱️
Registro de tiempo trabajado en tareas.

**Ubicación:** Schema público  
**Última modificación:** v2.0.0

#### Estructura:
```sql
CREATE TABLE task_time_entries (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_minutes INTEGER,
  description TEXT,
  is_running BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);
```

#### Campos:
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `start_time` | TIMESTAMP | Inicio del tracking |
| `end_time` | TIMESTAMP | Fin del tracking |
| `duration_minutes` | INTEGER | Duración en minutos (calculado) |
| `is_running` | BOOLEAN | Si el cronómetro está corriendo |

---

### 10. **eventos** 📅
Eventos y citas del calendario.

**Ubicación:** Schema público  
**Última modificación:** v1.0.0

#### Estructura:
```sql
CREATE TABLE eventos (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fecha_inicio TIMESTAMP NOT NULL,
  fecha_fin TIMESTAMP NOT NULL,
  ubicacion VARCHAR(255),
  tipo_evento VARCHAR(50) DEFAULT 'general',
  color VARCHAR(7) DEFAULT '#1976d2',
  todo_el_dia BOOLEAN DEFAULT false,
  recordatorio_minutos INTEGER DEFAULT 15,
  creado_por INTEGER NOT NULL REFERENCES usuarios(id),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

### 11. **evento_asignaciones** 👥
Asignaciones de usuarios a eventos.

**Ubicación:** Schema público  
**Última modificación:** v1.0.0

#### Estructura:
```sql
CREATE TABLE evento_asignaciones (
  id SERIAL PRIMARY KEY,
  evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  rol VARCHAR(20) DEFAULT 'participante',
  notificado BOOLEAN DEFAULT false,
  confirmado BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
```

---

### 12. **notificaciones** 🔔
Sistema de notificaciones.

**Ubicación:** Schema público  
**Última modificación:** v1.0.0

#### Estructura:
```sql
CREATE TABLE notificaciones (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  tipo VARCHAR(50) DEFAULT 'info',
  relacionado_tipo VARCHAR(50),
  relacionado_id INTEGER,
  leida BOOLEAN DEFAULT false,
  enviada_push BOOLEAN DEFAULT false,
  enviada_email BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
```

---

### 13. **configuracion_sistema** ⚙️
Configuración global del sistema.

**Ubicación:** Schema público  
**Última modificación:** v1.5.0

#### Estructura:
```sql
CREATE TABLE configuracion_sistema (
  id SERIAL PRIMARY KEY,
  nombre_proyecto VARCHAR(255) DEFAULT 'Vanguard Calendar',
  logo VARCHAR(500),
  logo_favicon VARCHAR(500),
  color_primario VARCHAR(7) DEFAULT '#667eea',
  color_secundario VARCHAR(7) DEFAULT '#764ba2',
  email_sistema VARCHAR(255) DEFAULT 'noreply@vanguardcalendar.com',
  telefono_sistema VARCHAR(20),
  direccion_sistema TEXT,
  descripcion_proyecto TEXT DEFAULT 'Sistema moderno de gestión de calendario',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

### 14. **archivos_sistema** 📎
Gestión de archivos del sistema.

**Ubicación:** Schema público  
**Última modificación:** v1.0.0

#### Estructura:
```sql
CREATE TABLE archivos_sistema (
  id SERIAL PRIMARY KEY,
  nombre_archivo VARCHAR(255) NOT NULL,
  ruta_archivo VARCHAR(500) NOT NULL,
  tipo_archivo VARCHAR(50) NOT NULL,
  tamaño_archivo BIGINT,
  mime_type VARCHAR(100),
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

## 🔗 RELACIONES PRINCIPALES

### Relaciones de tareas:
```
usuarios (1) ──┬─── (N) tareas (creado_por)
               │
               ├─── (N) tarea_asignaciones (usuario_id)
               │
               ├─── (N) task_comments (user_id)
               │
               ├─── (N) task_history (user_id)
               │
               └─── (N) task_time_entries (user_id)

projects (1) ────── (N) tareas (project_id)

tareas (1) ──┬─── (N) tarea_asignaciones (tarea_id)
             │
             ├─── (N) task_comments (task_id)
             │
             ├─── (N) task_history (task_id)
             │
             ├─── (N) task_subtasks (task_id)
             │
             └─── (N) task_time_entries (task_id)

task_comments (1) ──── (N) task_comments (parent_id) [auto-referencia]
```

---

## 📊 ESTADÍSTICAS DE LA BASE DE DATOS

### Total de Tablas: **14**

#### Por categoría:
- **Usuarios y Autenticación:** 1 tabla
- **Tareas:** 8 tablas (tareas + 7 relacionadas)
- **Eventos:** 2 tablas
- **Notificaciones:** 1 tabla
- **Configuración:** 1 tabla
- **Archivos:** 1 tabla

#### Total de Índices: **~25**
#### Total de Foreign Keys: **~30**
#### Total de Constraints: **~15**

---

## 🔒 SEGURIDAD

### Políticas:
- ✅ Contraseñas hasheadas con bcrypt (cost: 10)
- ✅ Foreign keys con ON DELETE CASCADE/SET NULL
- ✅ Constraints de validación (progreso 0-100, etc.)
- ✅ Campos UNIQUE para evitar duplicados
- ✅ Timestamps automáticos con triggers

### Backups Recomendados:
```bash
# Backup completo
pg_dump -U postgres -d vanguard_calendar > backup_$(date +%Y%m%d).sql

# Backup solo datos
pg_dump -U postgres -d vanguard_calendar --data-only > data_backup.sql

# Backup solo estructura
pg_dump -U postgres -d vanguard_calendar --schema-only > schema_backup.sql
```

---

## 📝 QUERIES ÚTILES

### Ver todas las tareas con proyecto:
```sql
SELECT t.id, t.titulo, p.name as proyecto, t.estado, t.prioridad
FROM tareas t
LEFT JOIN projects p ON t.project_id = p.id
ORDER BY t.created_at DESC;
```

### Ver usuarios asignados a una tarea:
```sql
SELECT u.nombres, u.apellidos, ta.rol
FROM tarea_asignaciones ta
JOIN usuarios u ON ta.usuario_id = u.id
WHERE ta.tarea_id = 1;
```

### Estadísticas de proyectos:
```sql
SELECT 
  p.name,
  COUNT(t.id) as total_tareas,
  COUNT(CASE WHEN t.estado = 'completada' THEN 1 END) as completadas
FROM projects p
LEFT JOIN tareas t ON p.id = t.project_id
GROUP BY p.id, p.name;
```

---

**Última actualización:** 10 de Octubre, 2024  
**Versión de BD:** v2.0.0  
**Motor:** PostgreSQL 14+
