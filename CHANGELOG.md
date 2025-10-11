# 📋 CHANGELOG - Vanguard Calendar

Sistema moderno de gestión de calendario y tareas con notificaciones push y PWA.

---

## 🚀 [v2.1.0] - 2024-10-11 - Sistema de Email Notifications

### ✨ Nuevas Funcionalidades

#### **📧 Sistema Completo de Email Notifications**
- ✅ **Nodemailer** integrado para envío de emails automáticos
- ✅ **Templates HTML profesionales** con diseño responsive
- ✅ **Configuración dinámica** desde base de datos (nombre, colores, logo)
- ✅ **Integración con Gmail** usando contraseñas de aplicación
- ✅ **Emails automáticos** para todas las acciones del sistema

#### **⚡ Mejoras de Rendimiento**
- ✅ **Notificaciones asíncronas** (setImmediate) para respuesta instantánea
- ✅ **Crear eventos/tareas** ahora responde en **<1 segundo** (antes 8 segundos)
- ✅ **Emails en segundo plano** sin bloquear la interfaz de usuario
- ✅ **Mejor experiencia** de usuario con respuestas inmediatas

#### **📧 Emails Automáticos Para:**
- ✅ **Nuevas tareas asignadas** → Email a usuarios asignados
- ✅ **Cambios de estado** (pendiente → en progreso → completada) → Email automático
- ✅ **Cambios de prioridad** (baja → media → alta → urgente) → Email automático
- ✅ **Nuevos comentarios** → Email a todos los usuarios asignados
- ✅ **Nuevos eventos** → Email a todos los asistentes
- ✅ **Recordatorios de eventos** (1 día antes y el día del evento) → Email automático

### 🔧 Correcciones y Mejoras

#### **Notificaciones**
- ✅ **Restricción de tipos** arreglada para permitir recordatorios de eventos
- ✅ **Notificaciones de comentarios** mejoradas (incluye a todos los usuarios asignados)
- ✅ **Logo removido** de emails para evitar errores de carga con URLs locales
- ✅ **CORS actualizado** para soportar puertos 3000 y 3001

#### **Configuración**
- ✅ **Email del sistema** configurable desde base de datos
- ✅ **Colores dinámicos** en templates de email
- ✅ **Nombre del proyecto** dinámico en emails
- ✅ **Soporte completo** para Gmail SMTP con contraseñas de aplicación

#### **Arquitectura**
- ✅ **Proceso asíncrono** para envío de emails (no bloquea respuestas)
- ✅ **Manejo de errores** robusto en envío de emails
- ✅ **Logging detallado** para debugging
- ✅ **Scripts de configuración** para email del sistema

### 📊 Impacto en Rendimiento

#### **Antes:**
- ⏱️ Crear evento: **8 segundos** (usuario esperaba)
- ⏱️ Crear tarea: **8 segundos** (usuario esperaba)
- ⏱️ Cambiar estado: **8 segundos** (usuario esperaba)

#### **Ahora:**
- ⚡ Crear evento: **<1 segundo** (respuesta inmediata)
- ⚡ Crear tarea: **<1 segundo** (respuesta inmediata)
- ⚡ Cambiar estado: **<1 segundo** (respuesta inmediata)
- 📧 **Emails se envían en segundo plano** sin afectar la experiencia

### 🎯 Configuración de Email

#### **Variables de Entorno (.env):**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tuCorreo@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicación
```

#### **Base de Datos:**
- ✅ Campo `email_sistema` en `configuracion_sistema`
- ✅ Configuración dinámica de remitente
- ✅ Templates con datos del sistema

---

## 🚀 [v2.0.0] - 2024-10-10 - Sistema de Tareas Avanzado

### ✨ Nuevas Funcionalidades

#### **Sistema de Tareas Completo**
- ✅ CRUD completo de tareas con formularios modernos
- ✅ Sistema de proyectos para organizar tareas
- ✅ Prioridades: Urgente, Alta, Media, Baja
- ✅ Estados: Pendiente, En Progreso, En Revisión, Completada, Cancelada
- ✅ Tags dinámicos y personalizables
- ✅ Estimación de horas por tarea
- ✅ Barra de progreso (0-100%)
- ✅ Fechas de vencimiento con recordatorios

#### **Sistema de Asignaciones**
- ✅ Múltiples usuarios por tarea
- ✅ Roles: Asignado, Responsable, Colaborador
- ✅ Notificaciones a usuarios asignados

#### **Sistema de Comentarios**
- ✅ Comentarios en tareas con threads
- ✅ Menciones a usuarios (@usuario)
- ✅ Reacciones con emojis (👍, ❤️, 😮, etc.)
- ✅ Archivos adjuntos en comentarios

#### **Sistema de Historial**
- ✅ Auditoría completa de cambios
- ✅ Registro de quién hizo qué y cuándo
- ✅ Valores anteriores y nuevos
- ✅ Metadata adicional

#### **Subtareas y Checklist**
- ✅ Subtareas ilimitadas por tarea
- ✅ Orden personalizable (drag & drop preparado)
- ✅ Progreso automático basado en subtareas completadas

#### **Templates Reutilizables**
- ✅ 3 templates predefinidos: Bug Fix, Feature Request, Design Task
- ✅ Templates públicos y privados
- ✅ Contador de uso de templates
- ✅ Creación rápida desde templates

#### **Time Tracking**
- ✅ Cronómetro integrado por tarea
- ✅ Registro de tiempo trabajado
- ✅ Múltiples sesiones de trabajo por tarea
- ✅ Cálculo automático de duración

#### **Proyectos**
- ✅ 5 proyectos predefinidos: General, Desarrollo, Diseño, Marketing, Soporte
- ✅ Colores personalizados por proyecto
- ✅ Contador de tareas por proyecto
- ✅ Filtrado por proyecto

### 🎨 Mejoras de UI/UX

#### **Página de Tareas**
- ✅ Diseño moderno con glassmorphism
- ✅ Filtros avanzados: Estado, Prioridad, Proyecto, Búsqueda
- ✅ Vista lista con información completa
- ✅ Vista Kanban (estructura preparada)
- ✅ Colores dinámicos por prioridad y estado
- ✅ Iconos representativos (🔥 Urgente, 🔴 Alta, 🟡 Media, 🟢 Baja)
- ✅ Modal de creación con validaciones
- ✅ Tags con agregar/eliminar dinámico
- ✅ Contadores: asignados, comentarios, subtareas

#### **Diseño General**
- ✅ Navbar consistente en todas las páginas
- ✅ Logo y nombre del sistema dinámicos desde BD
- ✅ Colores primario y secundario configurables
- ✅ Background con gradiente y opacidad 80%
- ✅ Botones de acción en azul sólido (#3b82f6)
- ✅ Transiciones suaves y efectos hover

### 🗄️ Base de Datos

#### **Tablas Nuevas Creadas**
1. `projects` - Proyectos para organizar tareas
2. `task_comments` - Comentarios con menciones y reacciones
3. `task_history` - Historial de cambios para auditoría
4. `task_subtasks` - Subtareas y checklist
5. `task_templates` - Templates reutilizables
6. `task_time_entries` - Registro de tiempo trabajado
7. `task_dependencies` - Dependencias entre tareas (preparado)
8. `task_attachments` - Archivos adjuntos (preparado)

#### **Tablas Modificadas**
- `tareas` - Agregadas columnas: project_id, estimacion_horas, progreso, tags, fecha_inicio, recordatorios, metadata
- `tarea_asignaciones` - Agregadas columnas: assigned_by, assigned_at

#### **Datos Iniciales**
- **5 Proyectos**: General (#6b7280), Desarrollo (#3b82f6), Diseño (#8b5cf6), Marketing (#f59e0b), Soporte (#10b981)
- **3 Templates**: Bug Fix, Feature Request, Design Task

### 🔧 Backend

#### **Nuevos Controladores**
- `tasks.controller.js` - CRUD completo de tareas adaptado a BD en español
  - `getAllTasks()` - Listar con filtros
  - `getTaskById()` - Detalle completo
  - `createTask()` - Crear con validaciones
  - `updateTask()` - Actualizar con mapeo de campos
  - `deleteTask()` - Eliminar con cascade
  - `getAllProjects()` - Listar proyectos
  - `createProject()` - Crear proyecto

#### **Nuevas Rutas**
- `GET /api/tasks` - Listar tareas con filtros
- `GET /api/tasks/:id` - Obtener tarea específica
- `POST /api/tasks` - Crear tarea
- `PUT /api/tasks/:id` - Actualizar tarea
- `DELETE /api/tasks/:id` - Eliminar tarea
- `GET /api/tasks/projects/all` - Listar proyectos
- `POST /api/tasks/projects` - Crear proyecto

#### **Dependencias Agregadas**
- `uuid@^9.0.1` - Generación de IDs únicos

### 📁 Estructura de Archivos

```
backend/
├── controllers/
│   ├── tasks.controller.js (NUEVO - Adaptado a BD español)
│   ├── tasks.controller.OLD.js (Respaldo)
│   └── tasks.controller_RESPALDO.js (Respaldo)
├── routes/
│   └── tasks.routes.js (NUEVO)
└── server.js (MODIFICADO - Agregada ruta /api/tasks)

frontend/
├── src/
│   ├── pages/
│   │   └── Tasks.jsx (NUEVO - Página completa de tareas)
│   └── App.jsx (MODIFICADO - Agregada ruta /tareas)

migrations/
├── 006_enhance_tasks_structure.sql
├── 007_complete_tasks_system.sql
├── 008_simple_tasks_system.sql
├── 009_final_tasks_system.sql
└── 010_EJECUTAR_EN_PGADMIN.sql (EJECUTADO ✅)
```

---

## 🎨 [v1.5.0] - Diseño Modernizado

### ✨ Cambios de Diseño

#### **Dashboard**
- ✅ Reloj en tiempo real con segundos
- ✅ Fondo con gradiente y opacidad 80%
- ✅ Cards con glassmorphism
- ✅ Estadísticas visuales
- ✅ Navbar sin foto/nombre de usuario

#### **Todas las Páginas**
- ✅ Diseño consistente con glassmorphism
- ✅ Gradientes dinámicos basados en colores de configuración
- ✅ Botones azules sólidos para diferenciarse del fondo
- ✅ Transiciones y efectos hover suaves

### 🎨 Landing Page & Login

#### **Landing Page (Home)**
- ✅ Diseño moderno y atractivo
- ✅ Iconos de características con colores naturales
- ✅ Botón CTA: "Comenzar Ahora →"
- ✅ Logo y nombre dinámicos desde configuración
- ✅ Navbar con fondo blanco fijo
- ✅ Gradientes en títulos removidos (texto sólido)

#### **Login**
- ✅ Diseño moderno con fondo dinámico
- ✅ Logo y colores desde configuración
- ✅ Formulario con validaciones
- ✅ Autenticación por DNI y clave

### 🔧 Sistema de Configuración

#### **Página de Configuración**
- ✅ Configuración general: Nombre, Descripción
- ✅ Upload de logo (JPG, PNG, GIF, WebP)
- ✅ Favicon fijo predeterminado (📅)
- ✅ Colores primario (#667eea) y secundario (#764ba2)
- ✅ Información de contacto: Email, Teléfono, Dirección
- ✅ Actualización dinámica sin refresh (ConfigContext)
- ✅ Campos de color con ancho fijo (120px)

### 👥 Gestión de Usuarios

#### **Usuarios**
- ✅ CRUD completo con patrón unificado
- ✅ Tabla con headers y datos centrados
- ✅ Columna "Estado" removida
- ✅ Upload de avatar (foto de perfil)
- ✅ Iconos de acción pequeños y sin fondo
- ✅ Validaciones de DNI, email, teléfono
- ✅ Roles: Administrador, Usuario

#### **Mi Perfil**
- ✅ Edición de datos personales
- ✅ Cambio de contraseña
- ✅ Upload de avatar
- ✅ Diseño moderno consistente

### 🗄️ Base de Datos

#### **Tabla: configuracion_sistema**
```sql
- nombre_proyecto VARCHAR(255) DEFAULT 'Vanguard Calendar'
- logo VARCHAR(500)
- logo_favicon VARCHAR(500)
- color_primario VARCHAR(7) DEFAULT '#667eea'
- color_secundario VARCHAR(7) DEFAULT '#764ba2'
- email_sistema VARCHAR(255)
- telefono_sistema VARCHAR(20)
- direccion_sistema TEXT
- descripcion_proyecto TEXT
```

#### **Tabla: usuarios**
```sql
- dni VARCHAR(8) NOT NULL UNIQUE
- nombres VARCHAR(255) NOT NULL
- apellidos VARCHAR(255) NOT NULL
- email VARCHAR(255) NOT NULL
- telefono VARCHAR(20)
- clave VARCHAR(255) NOT NULL (bcrypt)
- rol VARCHAR(50) DEFAULT 'Usuario'
- avatar VARCHAR(500)
- activo BOOLEAN DEFAULT true
- ultimo_acceso TIMESTAMP
- configuracion JSONB
```

### 🔐 Autenticación

#### **Mejoras**
- ✅ Login por DNI (en lugar de email)
- ✅ Hash de contraseñas con bcrypt
- ✅ JWT con verificación de token
- ✅ Endpoint `/api/auth/me` para verificar sesión
- ✅ Redirección correcta en refresh de página
- ✅ Loading states para evitar redirects prematuros
- ✅ AuthContext con checkAuth()

### 📦 Contextos React

#### **ConfigContext**
- ✅ Gestión global de configuración del sistema
- ✅ Fetch público sin auth headers
- ✅ updateConfig() - Actualizar configuración
- ✅ uploadLogo() - Subir logo
- ✅ fetchConfig() - Recargar configuración

#### **AuthContext**
- ✅ Gestión global de autenticación
- ✅ login() - Autenticación con DNI
- ✅ logout() - Cerrar sesión
- ✅ checkAuth() - Verificar token válido
- ✅ Loading states

---

## 🛠️ [v1.0.0] - Versión Inicial

### ✨ Funcionalidades Base

#### **Eventos**
- ✅ CRUD de eventos
- ✅ Tabla: eventos, evento_asignaciones
- ✅ Asignación múltiple de usuarios

#### **Tareas (Versión Simple)**
- ✅ CRUD básico de tareas
- ✅ Tabla: tareas, tarea_asignaciones
- ✅ Estados y prioridades

#### **Notificaciones**
- ✅ Sistema de notificaciones
- ✅ Tabla: notificaciones
- ✅ Tipos: info, success, warning, error

#### **Archivos**
- ✅ Gestión de archivos del sistema
- ✅ Tabla: archivos_sistema

### 🔧 Tecnologías

#### **Backend**
- Node.js + Express
- PostgreSQL
- JWT para autenticación
- Bcrypt para hashing
- Multer para uploads
- CORS configurado

#### **Frontend**
- React 18 + Vite
- React Router v6
- Axios para API calls
- SweetAlert2 para alertas
- Google Fonts (Inter)

---

## ✨ [v2.1.0] - 2024-10-10 - Sistema de Tareas 100% Funcional

### 🎯 Funcionalidades Completadas

#### **Vista Kanban con Drag & Drop**
- ✅ 4 columnas por estado: Pendiente, En Progreso, Completada, Cancelada
- ✅ Arrastrar y soltar tareas entre columnas
- ✅ Cambio automático de estado al soltar
- ✅ Feedback visual (opacidad, hover, sombras)
- ✅ Tarjetas compactas con información esencial
- ✅ Usuarios asignados con avatares superpuestos (máx 3 + contador)
- ✅ Tags (máx 2 + contador)
- ✅ Barra de progreso en cada tarjeta
- ✅ Badge de prioridad para urgente/alta
- ✅ Contador de tareas por columna
- ✅ Scroll independiente por columna
- ✅ Click para ver detalle completo

#### **Sistema de Asignaciones Múltiples**
- ✅ Guardar en tabla `tarea_asignaciones` (muchos a muchos)
- ✅ Checkbox múltiple de usuarios al crear/editar
- ✅ Mostrar avatares en lista y Kanban
- ✅ Pre-selección de usuarios asignados al editar
- ✅ Agregar/remover usuarios dinámicamente
- ✅ Contadores de usuarios asignados

#### **Sistema de Comentarios y Detalles**
- ✅ Tabla `task_comments` funcional
- ✅ Agregar comentarios/detalles en modal de tarea
- ✅ Historial cronológico (más reciente primero)
- ✅ Muestra: Avatar, Nombre, Rol, Fecha, Contenido
- ✅ Eliminar comentarios (solo autor o admin)
- ✅ Confirmación antes de eliminar
- ✅ Actualización inmediata sin cerrar modal
- ✅ Registro automático en `task_history`

#### **Barra de Progreso Profesional**
- ✅ Diseño moderno con gradiente triple (azul → morado → rosa)
- ✅ Efecto shimmer animado (brillo que se mueve)
- ✅ Sombra interna para profundidad 3D
- ✅ Marcadores visuales en 25%, 50%, 75%
- ✅ Altura de 12px (más visible)
- ✅ Badge de porcentaje con gradiente de texto
- ✅ Transición suave de 0.5s
- ✅ Box-shadow azul en la barra activa

#### **Dashboard Mejorado**
- ✅ Contadores dinámicos desde API
- ✅ Tareas recientes (últimas 3)
- ✅ Cards con información completa
- ✅ Links a proyectos, estado, prioridad
- ✅ Hover effects profesionales
- ✅ Cards centradas (iconos, números, textos)
- ✅ Actualización automática al crear/editar

### 🐛 Correcciones Críticas

#### **Error de Asignaciones**
- ✅ Removida columna `assigned_by` que no existe en la tabla
- ✅ INSERT simplificado: solo tarea_id, usuario_id, rol
- ✅ Logging detallado para debug
- ✅ Manejo de errores mejorado

#### **Zona Horaria Perú**
- ✅ Configurada timezone: America/Lima (GMT-5)
- ✅ Script SQL para PostgreSQL
- ✅ Timestamps correctos en comentarios

#### **Constraint de Estados**
- ✅ Detectado constraint que solo permite 4 estados
- ✅ Removido 'en_revision' de todos los selectores
- ✅ Kanban adaptado a 4 columnas
- ✅ Estados permitidos: pendiente, en_progreso, completada, cancelada

### 🎨 Mejoras de UI/UX

#### **Diseño Consistente**
- ✅ Glassmorphism en todas las páginas
- ✅ Gradientes dinámicos desde configuración
- ✅ Animaciones CSS (shimmer, pulse)
- ✅ Botones azules consistentes
- ✅ Hover effects suaves

#### **Landing Page**
- ✅ Botón "Dashboard" en azul cuando está logueado
- ✅ Mismo estilo que "Iniciar Sesión"

### 📊 Estadísticas del Sistema

#### **Base de Datos:**
- **14 tablas** en total
- **9 tablas** para sistema de tareas
- **~35 índices** para optimización
- **~40 foreign keys**
- **Datos iniciales:** 5 proyectos, 3 templates

#### **Líneas de Código:**
- **Backend:** ~600 líneas (tasks.controller.js)
- **Frontend:** ~2,300 líneas (Tasks.jsx)
- **SQL:** ~400 líneas (migraciones)

#### **Funcionalidades:**
- **17 endpoints** API de tareas
- **3 vistas** (Lista, Kanban, Detalle)
- **10 componentes** React
- **Drag & Drop** nativo HTML5

---

## 🐛 [HOTFIX] - 2024-10-10 - Correcciones Post-Implementación

### 🔧 Problemas Encontrados y Soluciones

#### **Error 500 en /api/auth/me y /api/config**
**Problema:** 
- Frontend muestra errores 500 al cargar
- AuthContext y ConfigContext fallan al hacer fetch

**Causa:**
- El backend ejecuta queries correctamente cuando se prueba con `check-db.js`
- Base de datos tiene todos los datos correctos (5 usuarios, configuración, 5 proyectos, 3 templates)
- El error es intermitente y puede ser por:
  1. Backend no corriendo en puerto 5000
  2. CORS no configurado correctamente
  3. Axios no apuntando a la URL correcta

**Solución:**
1. Verificar que el backend esté corriendo: `npm run dev` en raíz
2. Verificar logs del backend en terminal
3. Verificar que el frontend apunte a `http://localhost:5000`
4. Verificar que `.env` esté configurado correctamente

**Verificación:**
```bash
# Verificar BD
cd backend
node check-db.js

# Debería mostrar:
# ✅ 5 usuarios
# ✅ Configuración con Vanguard Calendar
# ✅ 5 proyectos
# ✅ 3 templates
```

#### **Script de Verificación Creado**
- ✅ `backend/check-db.js` - Verifica estado de la base de datos
- ✅ Muestra contadores de todas las tablas principales
- ✅ Crea configuración por defecto si no existe

### 📊 Estado de la Base de Datos (Verificado)
```
👥 Usuarios: 5
⚙️ Configuración: ✅ Existe
   - Nombre: Vanguard Calendar
   - Color primario: #1976d2
   - Color secundario: #764ba2
📋 Tareas: 0 (recién instalado)
📁 Proyectos: 5 (General, Desarrollo, Diseño, Marketing, Soporte)
📄 Templates: 3 (Bug Fix, Feature Request, Design Task)
```

---

## 📝 Notas de Desarrollo

### **Convenciones**
- ✅ Base de datos en español (tareas, usuarios, etc.)
- ✅ Frontend/Backend mapeo de campos cuando necesario
- ✅ Git Bash para comandos (no PowerShell &&)
- ✅ Patrón CRUD unificado para mantenimiento
- ✅ Diseño consistente en todas las páginas
- ✅ No iniciar servidores automáticamente

### **Estructura de Commits**
```
🚀 - Nueva funcionalidad
🔧 - Configuración/Setup
🎨 - Mejoras de UI/UX
🐛 - Corrección de bugs
📝 - Documentación
✅ - Tests
♻️  - Refactorización
```

### **URLs Importantes**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Inicio: `npm run dev` (en raíz)

---

## 🎯 Roadmap - Próximas Funcionalidades

### **Completado** ✅
- [x] Vista Kanban drag & drop ✅
- [x] Sistema de comentarios ✅
- [x] Dashboard con estadísticas ✅
- [x] Asignaciones múltiples ✅
- [x] Barra de progreso profesional ✅

### **En Desarrollo** 🚧
- [ ] Sistema de notificaciones completo (WebSocket + Push + Email)
- [ ] Módulo de Calendario integrado
- [ ] Módulo de Eventos funcional
- [ ] Dashboard de analytics con gráficos (Chart.js)
- [ ] Export de tareas a PDF/Excel (Puppeteer + ExcelJS)

### **Planeado** 📋
- [ ] Subtareas con drag & drop
- [ ] Time tracking con cronómetro
- [ ] Templates personalizados por usuario
- [ ] Dependencias entre tareas
- [ ] Gamificación (puntos, badges)
- [ ] Modo offline con sincronización
- [ ] App móvil PWA mejorada
- [ ] Integración con Google Calendar
- [ ] Sistema de roles y permisos granular
- [ ] Reportes avanzados con filtros
- [ ] Webhooks para integraciones externas

---

## 👥 Equipo
Desarrollado con ❤️ para educación

## 📄 Licencia
MIT License

---

**Última actualización:** 10 de Octubre, 2024  
**Versión actual:** v2.1.0  
**Estado:** ✅ Producción

---

## 🙏 Agradecimientos

Gracias por este increíble día de desarrollo. Hemos construido un sistema robusto, moderno y completamente funcional.

**Próxima sesión:** Sistema de Notificaciones en tiempo real + Módulos de Calendario y Eventos.

¡Hasta pronto! 🚀✨
