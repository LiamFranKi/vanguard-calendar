-- Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de preferencias de usuario
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  receive_email_notifications BOOLEAN DEFAULT true,
  receive_push_notifications BOOLEAN DEFAULT true,
  calendar_view VARCHAR(20) DEFAULT 'month',
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'es',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Índices
CREATE INDEX idx_settings_key ON settings(key);
CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);

-- Datos iniciales de configuración
INSERT INTO settings (key, value, description) VALUES
  ('system_name', 'Sistema de Agenda y Calendario', 'Nombre del sistema'),
  ('system_version', '1.0.0', 'Versión del sistema'),
  ('allow_registration', 'true', 'Permitir registro de nuevos usuarios'),
  ('default_role', 'estudiante', 'Rol por defecto para nuevos usuarios')
ON CONFLICT (key) DO NOTHING;

-- Comentarios
COMMENT ON TABLE settings IS 'Configuración global del sistema';
COMMENT ON TABLE user_preferences IS 'Preferencias individuales de cada usuario';
COMMENT ON COLUMN user_preferences.calendar_view IS 'Vistas: day, week, month, agenda';
COMMENT ON COLUMN user_preferences.theme IS 'Temas: light, dark, auto';


