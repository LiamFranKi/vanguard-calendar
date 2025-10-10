# Documentación de la API

## Base URL
```
http://localhost:5000/api
```

## Autenticación

Todas las rutas protegidas requieren un token JWT en el header:
```
Authorization: Bearer {token}
```

---

## 🔐 Autenticación

### Registrar Usuario
```http
POST /api/auth/register
```

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "password123",
  "name": "Juan Pérez",
  "role": "estudiante"
}
```

**Roles disponibles:** `estudiante`, `docente`, `administrativo`

**Response:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "name": "Juan Pérez",
    "role": "estudiante"
  }
}
```

### Iniciar Sesión
```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "name": "Juan Pérez",
    "role": "estudiante"
  }
}
```

### Obtener Usuario Actual
```http
GET /api/auth/me
```

**Headers:** Requiere token

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "name": "Juan Pérez",
    "role": "estudiante",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

### Cerrar Sesión
```http
POST /api/auth/logout
```

**Headers:** Requiere token

### Cambiar Contraseña
```http
PUT /api/auth/change-password
```

**Headers:** Requiere token

**Body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

---

## 📅 Eventos (Próximamente)

### Listar Eventos
```http
GET /api/events
```

### Crear Evento
```http
POST /api/events
```

### Obtener Evento por ID
```http
GET /api/events/:id
```

### Actualizar Evento
```http
PUT /api/events/:id
```

### Eliminar Evento
```http
DELETE /api/events/:id
```

---

## ✅ Tareas (Próximamente)

### Listar Tareas
```http
GET /api/tasks
```

### Crear Tarea
```http
POST /api/tasks
```

### Obtener Tarea por ID
```http
GET /api/tasks/:id
```

### Actualizar Tarea
```http
PUT /api/tasks/:id
```

### Completar Tarea
```http
PUT /api/tasks/:id/complete
```

### Eliminar Tarea
```http
DELETE /api/tasks/:id
```

---

## 🔔 Notificaciones (Próximamente)

### Listar Notificaciones
```http
GET /api/notifications
```

### Marcar como Leída
```http
PUT /api/notifications/:id/read
```

### Marcar Todas como Leídas
```http
PUT /api/notifications/read-all
```

---

## 📊 Reportes (Próximamente)

### Generar Reporte PDF
```http
POST /api/reports/pdf
```

**Body:**
```json
{
  "type": "events",
  "params": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31"
  }
}
```

### Generar Reporte Excel
```http
POST /api/reports/excel
```

---

## Códigos de Estado

- `200` - OK
- `201` - Creado
- `400` - Solicitud incorrecta
- `401` - No autenticado
- `403` - No autorizado
- `404` - No encontrado
- `500` - Error del servidor

## Errores

Formato de respuesta de error:
```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": []
}
```


