-- =====================================================
-- MIGRACIÓN 014: TABLA DE PUSH SUBSCRIPTIONS
-- Sistema de Notificaciones Push (PWA)
-- =====================================================

-- Crear tabla de suscripciones push
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(usuario_id, endpoint)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_usuario_id 
ON push_subscriptions(usuario_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint 
ON push_subscriptions(endpoint);

-- Comentarios
COMMENT ON TABLE push_subscriptions IS 'Almacena las suscripciones de push notifications de los usuarios';
COMMENT ON COLUMN push_subscriptions.usuario_id IS 'ID del usuario suscrito';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'URL del endpoint de push';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'Clave pública del cliente para encriptación';
COMMENT ON COLUMN push_subscriptions.auth IS 'Token de autenticación del cliente';

-- Insertar mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Tabla push_subscriptions creada exitosamente';
    RAISE NOTICE '📊 Sistema de Push Notifications (PWA) listo';
END $$;

