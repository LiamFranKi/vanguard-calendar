import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares de seguridad y rendimiento
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(morgan('dev'));

// CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3000'
  ],
  credentials: true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Carpeta de uploads
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Carpeta public para archivos estáticos del backend
app.use('/public', express.static(join(__dirname, 'public')));

// Endpoint para servir favicon dinámico
app.get('/favicon.ico', async (req, res) => {
  try {
    const { query } = await import('./config/database.js');
    const result = await query('SELECT logo_favicon FROM configuracion_sistema LIMIT 1');
    
    if (result.rows.length > 0 && result.rows[0].logo_favicon) {
      const faviconPath = join(__dirname, result.rows[0].logo_favicon);
      res.sendFile(faviconPath);
    } else {
      // Favicon por defecto si no hay uno configurado
      res.sendFile(join(__dirname, 'public/favicon.svg'));
    }
  } catch (error) {
    console.error('Error al servir favicon:', error);
    res.sendFile(join(__dirname, 'public/favicon.svg'));
  }
});

// Rutas de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'Vanguard Calendar - API',
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Importar rutas
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import profileRoutes from './routes/profile.routes.js';
import configRoutes from './routes/config.routes.js';
import taskRoutes from './routes/tasks.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import calendarRoutes from './routes/calendar.routes.js';
import reportsRoutes from './routes/reports.routes.js';

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/config', configRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/reports', reportsRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Importar sistema de recordatorios
import { startReminderJobs } from './jobs/reminders.job.js';

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📝 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  
  // Iniciar sistema de recordatorios automáticos
  startReminderJobs();
});

export default app;

