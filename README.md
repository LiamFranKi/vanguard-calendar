# Sistema de Agenda y Calendario Educativo

Sistema completo de gestión de agenda y calendario para instituciones educativas con soporte PWA.

## Características

- 📅 Calendario interactivo con eventos y tareas
- 👥 Gestión de usuarios (estudiantes, docentes, administrativos)
- 📝 Agenda de actividades y recordatorios
- 📊 Reportes en PDF y Excel profesionales
- 🔔 Notificaciones push
- 📧 Notificaciones por email
- 📱 PWA - Funciona como app nativa
- 🔒 Autenticación y autorización segura

## Tecnologías

### Backend
- Node.js + Express
- PostgreSQL
- JWT para autenticación
- Puppeteer (reportes PDF)
- ExcelJS (reportes Excel)
- Chart.js (gráficos)
- Nodemailer (emails)
- Web Push (notificaciones)

### Frontend
- React 18
- Vite
- React Router
- React Big Calendar
- Chart.js
- PWA Support

## Instalación

### Prerrequisitos
- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### Pasos

1. Clonar el repositorio
\`\`\`bash
git clone <url>
cd sistema-agenda-calendario
\`\`\`

2. Instalar dependencias

Backend:
\`\`\`bash
cd backend
npm install
\`\`\`

Frontend:
\`\`\`bash
cd frontend
npm install
\`\`\`

3. Configurar variables de entorno

Copiar `.env.example` a `.env` en backend y frontend y configurar valores.

4. Crear base de datos PostgreSQL
\`\`\`sql
CREATE DATABASE sistema_agenda;
\`\`\`

5. Ejecutar migraciones
\`\`\`bash
cd backend
npm run migrate
\`\`\`

6. Iniciar servidores

Backend (puerto 5000):
\`\`\`bash
cd backend
npm run dev
\`\`\`

Frontend (puerto 5173):
\`\`\`bash
cd frontend
npm run dev
\`\`\`

## Estructura del Proyecto

\`\`\`
sistema-agenda-calendario/
├── backend/
│   ├── config/         # Configuración (DB, etc)
│   ├── controllers/    # Lógica de negocio
│   ├── middleware/     # Middlewares (auth, etc)
│   ├── routes/         # Rutas de la API
│   ├── utils/          # Utilidades (reportes, emails)
│   └── server.js       # Punto de entrada
├── frontend/
│   ├── public/         # Archivos estáticos
│   └── src/
│       ├── assets/     # Imágenes, estilos
│       ├── components/ # Componentes React
│       ├── contexts/   # Context API
│       ├── pages/      # Páginas
│       ├── services/   # Servicios API
│       └── utils/      # Utilidades
└── migrations/         # Migraciones de BD

\`\`\`

## Licencia

MIT

