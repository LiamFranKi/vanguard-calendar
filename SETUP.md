# Guía de Configuración - Sistema de Agenda y Calendario

## 📋 Prerrequisitos

- Node.js 18+ instalado
- PostgreSQL 14+ instalado y corriendo
- Git Bash o terminal
- Editor de código (VS Code recomendado)

## 🚀 Pasos de Instalación

### 1. Dependencias Instaladas ✅

Las dependencias ya fueron instaladas:
- Backend: 399 paquetes
- Frontend: 501 paquetes

### 2. Configurar Base de Datos PostgreSQL

#### Crear la base de datos:

```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE sistema_agenda;

# Verificar
\l

# Salir
\q
```

### 3. Configurar Variables de Entorno

#### Backend (`backend/.env`):

El archivo ya está creado. **IMPORTANTE**: Actualiza estos valores:

```env
# Database - ACTUALIZA ESTOS VALORES
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sistema_agenda
DB_USER=postgres
DB_PASSWORD=TU_PASSWORD_DE_POSTGRES_AQUI

# JWT - Puedes dejar el valor por defecto o cambiarlo
JWT_SECRET=sistema_agenda_secret_key_2025_muy_segura
```

#### Frontend (`frontend/.env`):

El archivo ya está creado y no necesita cambios por ahora.

### 4. Ejecutar Migraciones de Base de Datos

```bash
cd backend
npm run migrate
```

Esto creará todas las tablas necesarias:
- users (usuarios)
- events (eventos)
- event_participants (participantes de eventos)
- tasks (tareas)
- attachments (archivos adjuntos)
- notifications (notificaciones)
- push_subscriptions (suscripciones push)
- settings (configuración)
- user_preferences (preferencias de usuario)

### 5. (Opcional) Generar Claves VAPID para Notificaciones Push

```bash
cd backend
node utils/generateVapidKeys.js
```

Copia las claves generadas al archivo `.env`:
```env
VAPID_PUBLIC_KEY=clave_generada_aqui
VAPID_PRIVATE_KEY=clave_generada_aqui
```

### 6. (Opcional) Configurar Email

Para enviar notificaciones por email, configura estas variables en `backend/.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_app_password_de_gmail
```

**Nota para Gmail**: 
1. Ir a cuenta de Google → Seguridad
2. Activar verificación en 2 pasos
3. Generar "Contraseña de aplicación"
4. Usar esa contraseña en `EMAIL_PASSWORD`

## ▶️ Iniciar el Sistema

### Opción 1: Iniciar Backend y Frontend por separado

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
El backend correrá en: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
El frontend correrá en: http://localhost:5173

### Opción 2: Usando los scripts del package.json raíz

**Terminal 1:**
```bash
npm run dev:backend
```

**Terminal 2:**
```bash
npm run dev:frontend
```

## ✅ Verificar Instalación

1. **Backend**: Abre http://localhost:5000 - Deberías ver:
   ```json
   {
     "message": "Sistema de Agenda y Calendario - API",
     "version": "1.0.0",
     "status": "running"
   }
   ```

2. **Frontend**: Abre http://localhost:5173 - Deberías ver la página de inicio

3. **Health Check**: http://localhost:5000/api/health

## 🔧 Solución de Problemas

### Error de conexión a PostgreSQL

```bash
# Verificar que PostgreSQL está corriendo (Windows)
# En Services.msc buscar "postgresql" y verificar que esté running

# O desde línea de comandos
pg_ctl status
```

### Error "database does not exist"

```bash
psql -U postgres
CREATE DATABASE sistema_agenda;
\q
```

### Puerto ya en uso

Si el puerto 5000 o 5173 están en uso:

- Backend: Cambiar `PORT` en `backend/.env`
- Frontend: Cambiar `server.port` en `frontend/vite.config.js`

## 📝 Próximos Pasos

1. ✅ Instalación completada
2. ✅ Configuración de base de datos
3. ✅ Migraciones ejecutadas
4. 🔄 Crear primer usuario (a través de la API o frontend)
5. 🔄 Implementar módulos adicionales (eventos, tareas, reportes)

## 📚 Estructura del Proyecto

```
sistema-agenda-calendario/
├── backend/                 # API Node.js + Express
│   ├── config/             # Configuración (DB)
│   ├── controllers/        # Lógica de negocio
│   ├── middleware/         # Middlewares (auth, validación)
│   ├── routes/             # Rutas de la API
│   ├── utils/              # Utilidades (email, reportes)
│   └── server.js           # Punto de entrada
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── contexts/      # Context API (AuthContext)
│   │   ├── pages/         # Páginas (Home, Login, Dashboard)
│   │   ├── services/      # Servicios API
│   │   └── utils/         # Utilidades
│   └── vite.config.js     # Configuración Vite + PWA
└── migrations/             # Migraciones SQL

```

## 🎯 Endpoints Disponibles

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/logout` - Cerrar sesión
- `PUT /api/auth/change-password` - Cambiar contraseña

## 📞 Soporte

Si encuentras algún problema, revisa:
1. Logs del backend en la terminal
2. Consola del navegador (F12)
3. Archivo `SETUP.md`
4. README.md principal


