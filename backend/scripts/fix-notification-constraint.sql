-- Arreglar la restricción de tipos de notificaciones
-- para permitir recordatorios de eventos

ALTER TABLE notificaciones DROP CONSTRAINT IF EXISTS chk_relacionado_tipo;

ALTER TABLE notificaciones ADD CONSTRAINT chk_relacionado_tipo 
CHECK (relacionado_tipo IN (
  'tarea',
  'evento', 
  'tarea_recordatorio_1dia',
  'tarea_recordatorio_hoy',
  'evento_recordatorio_1dia',
  'evento_recordatorio_hoy',
  'comentario',
  'asignacion',
  'estado',
  'prioridad'
));
