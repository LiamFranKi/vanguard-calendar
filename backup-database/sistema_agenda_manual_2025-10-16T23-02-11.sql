-- ================================================
-- BACKUP MANUAL - SISTEMA AGENDA CALENDARIO
-- Fecha: 16/10/2025, 18:02:11
-- ================================================

SET timezone = 'America/Lima';

-- ================================================
-- TABLA: ARCHIVOS_SISTEMA
-- ================================================

DROP TABLE IF EXISTS "archivos_sistema" CASCADE;
CREATE TABLE "archivos_sistema" (
  "id" integer NOT NULL DEFAULT nextval('archivos_sistema_id_seq'::regclass),
  "nombre_archivo" character varying(255) NOT NULL,
  "ruta_archivo" character varying(500) NOT NULL,
  "tipo_archivo" character varying(50) NOT NULL,
  "tamaño_archivo" bigint,
  "mime_type" character varying(100),
  "descripcion" text,
  "activo" boolean DEFAULT true,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now()
);

ALTER TABLE "archivos_sistema" ADD CONSTRAINT "archivos_sistema_pkey" PRIMARY KEY ("id");

-- ================================================
-- TABLA: CONFIGURACION_SISTEMA
-- ================================================

DROP TABLE IF EXISTS "configuracion_sistema" CASCADE;
CREATE TABLE "configuracion_sistema" (
  "id" integer NOT NULL DEFAULT nextval('configuracion_sistema_id_seq'::regclass),
  "nombre_proyecto" character varying(255) DEFAULT 'Vanguard Calendar'::character varying,
  "logo" character varying(500),
  "logo_favicon" character varying(500),
  "color_primario" character varying(7) DEFAULT '#1976d2'::character varying,
  "color_secundario" character varying(7) DEFAULT '#ff9800'::character varying,
  "email_sistema" character varying(255) DEFAULT 'noreply@vanguardcalendar.com'::character varying,
  "telefono_sistema" character varying(20),
  "direccion_sistema" text,
  "descripcion_proyecto" text DEFAULT 'Sistema moderno de agenda y calendario con notificaciones push y PWA.'::text,
  "activo" boolean DEFAULT true,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now()
);

ALTER TABLE "configuracion_sistema" ADD CONSTRAINT "configuracion_sistema_pkey" PRIMARY KEY ("id");

-- Datos de configuracion_sistema
INSERT INTO "configuracion_sistema" ("id", "nombre_proyecto", "logo", "logo_favicon", "color_primario", "color_secundario", "email_sistema", "telefono_sistema", "direccion_sistema", "descripcion_proyecto", "activo", "created_at", "updated_at") VALUES
(1, 'Vanguard Calendar', '/uploads/avatar-1760641465099-582260177.png', '/uploads/avatar-1760122286963-446875693.png', '#1976d2', '#764ba2', 'walterlozanoalcalde@gmail.com', '+51 970 877 642', 'Lima, Perú', 'Sistema moderno de agenda y calendario con notificaciones. Gestiona eventos, tareas y mantén tu equipo organizado.', TRUE, '2025-10-10T19:55:02.381Z', '2025-10-16T20:48:24.357Z');

-- ================================================
-- TABLA: EVENTO_ASIGNACIONES
-- ================================================

DROP TABLE IF EXISTS "evento_asignaciones" CASCADE;
CREATE TABLE "evento_asignaciones" (
  "id" integer NOT NULL DEFAULT nextval('evento_asignaciones_id_seq'::regclass),
  "evento_id" integer NOT NULL,
  "usuario_id" integer NOT NULL,
  "rol" character varying(20) DEFAULT 'participante'::character varying,
  "notificado" boolean DEFAULT false,
  "confirmado" boolean DEFAULT false,
  "created_at" timestamp without time zone DEFAULT now()
);

ALTER TABLE "evento_asignaciones" ADD CONSTRAINT "fk_evento_asignacion_evento" FOREIGN KEY ("evento_id") REFERENCES "eventos" ("id");
ALTER TABLE "evento_asignaciones" ADD CONSTRAINT "fk_evento_asignacion_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id");
ALTER TABLE "evento_asignaciones" ADD CONSTRAINT "evento_asignaciones_pkey" PRIMARY KEY ("id");
ALTER TABLE "evento_asignaciones" ADD CONSTRAINT "uq_evento_usuario" UNIQUE ("usuario_id");
ALTER TABLE "evento_asignaciones" ADD CONSTRAINT "uq_evento_usuario" UNIQUE ("usuario_id");
ALTER TABLE "evento_asignaciones" ADD CONSTRAINT "uq_evento_usuario" UNIQUE ("evento_id");
ALTER TABLE "evento_asignaciones" ADD CONSTRAINT "uq_evento_usuario" UNIQUE ("evento_id");

-- Datos de evento_asignaciones
INSERT INTO "evento_asignaciones" ("id", "evento_id", "usuario_id", "rol", "notificado", "confirmado", "created_at") VALUES
(6, 2, 2, 'participante', FALSE, FALSE, '2025-10-11T16:46:27.546Z'),
(7, 2, 1, 'participante', FALSE, FALSE, '2025-10-11T16:46:27.552Z'),
(8, 3, 2, 'participante', FALSE, FALSE, '2025-10-11T16:48:10.414Z'),
(9, 3, 1, 'participante', FALSE, FALSE, '2025-10-11T16:48:10.420Z'),
(10, 4, 2, 'participante', FALSE, FALSE, '2025-10-11T16:49:59.076Z'),
(11, 4, 1, 'participante', FALSE, FALSE, '2025-10-11T16:49:59.078Z'),
(12, 5, 2, 'participante', FALSE, FALSE, '2025-10-11T16:51:54.737Z'),
(13, 5, 1, 'participante', FALSE, FALSE, '2025-10-11T16:51:54.738Z'),
(25, 7, 2, 'participante', FALSE, FALSE, '2025-10-11T19:24:07.238Z'),
(26, 7, 1, 'participante', FALSE, FALSE, '2025-10-11T19:24:07.241Z'),
(39, 13, 1, 'participante', FALSE, FALSE, '2025-10-16T22:50:56.841Z');

-- ================================================
-- TABLA: EVENTOS
-- ================================================

DROP TABLE IF EXISTS "eventos" CASCADE;
CREATE TABLE "eventos" (
  "id" integer NOT NULL DEFAULT nextval('eventos_id_seq'::regclass),
  "titulo" character varying(255) NOT NULL,
  "descripcion" text,
  "fecha_inicio" timestamp without time zone NOT NULL,
  "fecha_fin" timestamp without time zone NOT NULL,
  "ubicacion" character varying(255),
  "tipo_evento" character varying(50) DEFAULT 'general'::character varying,
  "color" character varying(7) DEFAULT '#1976d2'::character varying,
  "todo_el_dia" boolean DEFAULT false,
  "recordatorio_minutos" integer DEFAULT 15,
  "creado_por" integer NOT NULL,
  "activo" boolean DEFAULT true,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now()
);

ALTER TABLE "eventos" ADD CONSTRAINT "fk_evento_creador" FOREIGN KEY ("creado_por") REFERENCES "usuarios" ("id");
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_pkey" PRIMARY KEY ("id");

-- Datos de eventos
INSERT INTO "eventos" ("id", "titulo", "descripcion", "fecha_inicio", "fecha_fin", "ubicacion", "tipo_evento", "color", "todo_el_dia", "recordatorio_minutos", "creado_por", "activo", "created_at", "updated_at") VALUES
(2, 'Evento Prueba 1', ' Evento Prueba 1 ok', '2025-10-12T12:00:00.000Z', '2025-10-12T14:00:00.000Z', 'Vanguard Schools', 'general', '#b5a245', FALSE, 15, 1, TRUE, '2025-10-11T16:46:27.542Z', '2025-10-11T16:46:27.542Z'),
(3, 'Evento Prueba 2', 'Evento Prueba 2', '2025-10-11T10:00:00.000Z', '2025-10-11T10:00:00.000Z', 'Cancha Vanguard', 'general', '#f3311b', TRUE, 15, 1, TRUE, '2025-10-11T16:48:10.407Z', '2025-10-11T16:48:10.407Z'),
(4, 'Evento Prueba 3', 'Evento Prueba 3 si', '2025-10-25T10:00:00.000Z', '2025-10-25T10:00:00.000Z', 'Piscina Vanguard', 'general', '#22c55e', TRUE, 15, 1, TRUE, '2025-10-11T16:49:59.074Z', '2025-10-11T16:49:59.074Z'),
(5, 'Evento Nuevo 4', 'Evento Nuevo 4', '2025-10-18T10:00:00.000Z', '2025-10-18T10:00:00.000Z', 'Biblioteca Vanguard', 'general', '#583894', FALSE, 15, 1, TRUE, '2025-10-11T16:51:54.735Z', '2025-10-11T16:51:54.735Z'),
(7, 'Evento de Prueba - Fiesta Romana', 'Inciamos una fiesta romana', '2025-10-15T22:00:00.000Z', '2025-10-16T04:00:00.000Z', 'Vanguard Schools', 'general', '#09953c', FALSE, 15, 1, TRUE, '2025-10-11T19:24:07.236Z', '2025-10-11T19:24:07.236Z'),
(13, 'Evento 5', 'Ecento de Prueba', '2025-10-21T03:50:00.000Z', '2025-10-21T03:50:00.000Z', 'Vanguard', 'general', '#22c55e', FALSE, 15, 1, TRUE, '2025-10-16T22:50:56.838Z', '2025-10-16T22:50:56.838Z');

-- ================================================
-- TABLA: NOTIFICACIONES
-- ================================================

DROP TABLE IF EXISTS "notificaciones" CASCADE;
CREATE TABLE "notificaciones" (
  "id" integer NOT NULL DEFAULT nextval('notificaciones_id_seq'::regclass),
  "usuario_id" integer NOT NULL,
  "titulo" character varying(255) NOT NULL,
  "mensaje" text NOT NULL,
  "tipo" character varying(50) DEFAULT 'info'::character varying,
  "relacionado_tipo" character varying(50),
  "relacionado_id" integer,
  "leida" boolean DEFAULT false,
  "enviada_push" boolean DEFAULT false,
  "enviada_email" boolean DEFAULT false,
  "created_at" timestamp without time zone DEFAULT now()
);

ALTER TABLE "notificaciones" ADD CONSTRAINT "fk_notificacion_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id");
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id");

-- Datos de notificaciones
INSERT INTO "notificaciones" ("id", "usuario_id", "titulo", "mensaje", "tipo", "relacionado_tipo", "relacionado_id", "leida", "enviada_push", "enviada_email", "created_at") VALUES
(1, 1, '📋 Nueva tarea asignada', 'Has sido asignado a la tarea: "Tarea de Prueba"', 'info', 'tarea', 5, TRUE, FALSE, FALSE, '2025-10-11T15:08:37.756Z'),
(2, 2, '📋 Nueva tarea asignada', 'Has sido asignado a la tarea: "Tarea de Prueba"', 'info', 'tarea', 5, TRUE, FALSE, FALSE, '2025-10-11T15:08:37.757Z'),
(3, 3, '📋 Nueva tarea asignada', 'Has sido asignado a la tarea: "Tarea de Prueba"', 'info', 'tarea', 5, FALSE, FALSE, FALSE, '2025-10-11T15:08:37.758Z'),
(4, 1, '📋 Nueva tarea asignada', 'Has sido asignado a la tarea: "Tarea Prueba"', 'info', 'tarea', 6, TRUE, FALSE, FALSE, '2025-10-11T15:30:52.036Z'),
(5, 2, '📋 Nueva tarea asignada', 'Has sido asignado a la tarea: "Tarea Prueba"', 'info', 'tarea', 6, TRUE, FALSE, FALSE, '2025-10-11T15:30:52.039Z'),
(6, 3, '📋 Nueva tarea asignada', 'Has sido asignado a la tarea: "Tarea Prueba"', 'info', 'tarea', 6, FALSE, FALSE, FALSE, '2025-10-11T15:30:52.040Z'),
(7, 2, '📋 Nueva tarea asignada', 'Has sido asignado a la tarea: "Tarea Prueba"', 'info', 'tarea', 7, TRUE, FALSE, FALSE, '2025-10-11T16:45:01.028Z'),
(8, 1, '📋 Nueva tarea asignada', 'Has sido asignado a la tarea: "Tarea Prueba"', 'info', 'tarea', 7, TRUE, FALSE, FALSE, '2025-10-11T16:45:01.029Z'),
(9, 2, '🎉 Invitación a evento', 'Has sido invitado al evento: "Evento Prueba 1"', 'info', 'evento', 2, FALSE, FALSE, FALSE, '2025-10-11T16:46:27.554Z'),
(10, 1, '🎉 Invitación a evento', 'Has sido invitado al evento: "Evento Prueba 1"', 'info', 'evento', 2, TRUE, FALSE, FALSE, '2025-10-11T16:46:27.555Z'),
(11, 2, '🎉 Invitación a evento', 'Has sido invitado al evento: "Evento Prueba 2"', 'info', 'evento', 3, FALSE, FALSE, FALSE, '2025-10-11T16:48:10.422Z'),
(12, 1, '🎉 Invitación a evento', 'Has sido invitado al evento: "Evento Prueba 2"', 'info', 'evento', 3, TRUE, FALSE, FALSE, '2025-10-11T16:48:10.423Z'),
(16, 2, '🎉 Invitación a evento', 'Has sido invitado al evento: "Evento Prueba 3"', 'info', 'evento', 4, FALSE, FALSE, FALSE, '2025-10-11T16:49:59.079Z'),
(17, 1, '🎉 Invitación a evento', 'Has sido invitado al evento: "Evento Prueba 3"', 'info', 'evento', 4, TRUE, FALSE, FALSE, '2025-10-11T16:49:59.081Z'),
(18, 2, '🎉 Invitación a evento', 'Has sido invitado al evento: "Evento Nuevo 4"', 'info', 'evento', 5, FALSE, FALSE, FALSE, '2025-10-11T16:51:54.739Z'),
(19, 1, '🎉 Invitación a evento', 'Has sido invitado al evento: "Evento Nuevo 4"', 'info', 'evento', 5, TRUE, FALSE, FALSE, '2025-10-11T16:51:54.740Z'),
(20, 2, '🔔 Tarea cancelada ❌', 'La tarea "Tarea Prueba" fue cancelada ❌', 'warning', 'tarea', 7, FALSE, FALSE, FALSE, '2025-10-11T16:54:10.110Z'),
(23, 2, '✅ Tarea completada', 'La tarea "Tarea Prueba" fue completada', 'success', 'tarea', 7, FALSE, FALSE, TRUE, '2025-10-11T16:57:39.083Z'),
(30, 2, '🎉 Invitación a evento', 'Has sido invitado al evento: "Evento Borrar"', 'info', 'evento', 6, FALSE, FALSE, FALSE, '2025-10-11T17:07:28.928Z'),
(31, 3, '🎉 Invitación a evento', 'Has sido invitado al evento: "Evento Borrar"', 'info', 'evento', 6, FALSE, FALSE, FALSE, '2025-10-11T17:07:28.929Z'),
(32, 4, '🎉 Invitación a evento', 'Has sido invitado al evento: "Evento Borrar"', 'info', 'evento', 6, FALSE, FALSE, FALSE, '2025-10-11T17:07:28.930Z'),
(33, 5, '🎉 Invitación a evento', 'Has sido invitado al evento: "Evento Borrar"', 'info', 'evento', 6, FALSE, FALSE, FALSE, '2025-10-11T17:07:28.931Z'),
(34, 1, '🎉 Invitación a evento', 'Has sido invitado al evento: "Evento Borrar"', 'info', 'evento', 6, TRUE, FALSE, FALSE, '2025-10-11T17:07:28.932Z'),
(38, 2, '💬 Nuevo comentario', 'Walter Lozano Alcalde comentó en: "Tarea Prueba"', 'info', 'tarea', 7, FALSE, FALSE, FALSE, '2025-10-11T17:16:52.015Z'),
(39, 2, '🔄 Tarea en progreso', 'La tarea "Desarrollo Vangard Calendar" ahora está en progreso', 'info', 'tarea', 2, FALSE, FALSE, FALSE, '2025-10-11T17:17:56.028Z'),
(50, 2, '✅ Tarea completada', 'La tarea "Tarea Prueba" fue completada', 'success', 'tarea', 7, FALSE, FALSE, TRUE, '2025-10-11T17:56:37.212Z'),
(51, 2, '🟡 Prioridad cambiada', 'La prioridad de "Tarea Prueba" cambió a: MEDIA', 'info', 'tarea', 7, FALSE, FALSE, FALSE, '2025-10-11T17:56:37.213Z'),
(66, 1, '🎉 Recordatorio: Evento mañana', 'El evento "Evento Prueba 1" es mañana a las 07:00 en Vanguard Schools', 'info', 'evento_recordatorio_1dia', 2, FALSE, FALSE, TRUE, '2025-10-11T18:56:11.561Z'),
(67, 2, '🎉 Recordatorio: Evento mañana', 'El evento "Evento Prueba 1" es mañana a las 07:00 en Vanguard Schools', 'info', 'evento_recordatorio_1dia', 2, FALSE, FALSE, TRUE, '2025-10-11T18:56:11.569Z'),
(68, 1, '🎉 ¡Evento HOY!', 'El evento "Evento Prueba 2" es HOY a las todo el día en Cancha Vanguard', 'success', 'evento_recordatorio_hoy', 3, FALSE, FALSE, TRUE, '2025-10-11T18:56:17.884Z'),
(69, 2, '🎉 ¡Evento HOY!', 'El evento "Evento Prueba 2" es HOY a las todo el día en Cancha Vanguard', 'success', 'evento_recordatorio_hoy', 3, FALSE, FALSE, TRUE, '2025-10-11T18:56:17.886Z'),
(70, 1, '📋 Nueva tarea asignada', 'Has sido asignado a la tarea: "Tarea de Prueba - Inicio 4to Bimestre"', 'info', 'tarea', 8, FALSE, FALSE, FALSE, '2025-10-11T19:06:58.086Z'),
(71, 2, '📋 Nueva tarea asignada', 'Has sido asignado a la tarea: "Tarea de Prueba - Inicio 4to Bimestre"', 'info', 'tarea', 8, FALSE, FALSE, FALSE, '2025-10-11T19:06:58.087Z'),
(72, 1, '📋 Nueva tarea asignada', 'Has sido asignado a la tarea: "Tarea de Prueba - Inicio 4to Bimestre"', 'info', 'tarea', 9, FALSE, FALSE, TRUE, '2025-10-11T19:07:00.342Z'),
(73, 2, '📋 Nueva tarea asignada', 'Has sido asignado a la tarea: "Tarea de Prueba - Inicio 4to Bimestre"', 'info', 'tarea', 9, FALSE, FALSE, TRUE, '2025-10-11T19:07:00.345Z'),
(74, 2, '📋 Nueva tarea asignada', 'Has sido asignado a la tarea: "Tarea de Prueba - 4to Bimestre"', 'info', 'tarea', 10, FALSE, FALSE, TRUE, '2025-10-11T19:16:32.656Z'),
(75, 1, '📋 Nueva tarea asignada', 'Has sido asignado a la tarea: "Tarea de Prueba - 4to Bimestre"', 'info', 'tarea', 10, FALSE, FALSE, TRUE, '2025-10-11T19:16:32.664Z'),
(76, 3, '📋 Nueva tarea asignada', 'Has sido asignado a la tarea: "Tarea de Prueba - 4to Bimestre"', 'info', 'tarea', 10, FALSE, FALSE, TRUE, '2025-10-11T19:16:32.667Z'),
(77, 2, '💬 Nuevo comentario', 'Walter Lozano Alcalde comentó en: "Tarea de Prueba - 4to Bimestre"', 'info', 'tarea', 10, FALSE, FALSE, TRUE, '2025-10-11T19:17:30.662Z'),
(78, 3, '💬 Nuevo comentario', 'Walter Lozano Alcalde comentó en: "Tarea de Prueba - 4to Bimestre"', 'info', 'tarea', 10, FALSE, FALSE, TRUE, '2025-10-11T19:17:30.666Z'),
(79, 2, '💬 Nuevo comentario', 'Walter Lozano Alcalde comentó en: "Tarea de Prueba - 4to Bimestre"', 'info', 'tarea', 10, FALSE, FALSE, TRUE, '2025-10-11T19:22:22.510Z'),
(80, 1, '💬 Nuevo comentario', 'Walter Lozano Alcalde comentó en: "Tarea de Prueba - 4to Bimestre"', 'info', 'tarea', 10, FALSE, FALSE, TRUE, '2025-10-11T19:22:22.512Z'),
(81, 3, '💬 Nuevo comentario', 'Walter Lozano Alcalde comentó en: "Tarea de Prueba - 4to Bimestre"', 'info', 'tarea', 10, FALSE, FALSE, TRUE, '2025-10-11T19:22:22.514Z'),
(82, 2, '🎉 Invitación a evento', 'Has sido invitado al evento: "Evento de Prueba - Fiesta Romana"', 'info', 'evento', 7, FALSE, FALSE, TRUE, '2025-10-11T19:24:07.244Z'),
(83, 1, '🎉 Invitación a evento', 'Has sido invitado al evento: "Evento de Prueba - Fiesta Romana"', 'info', 'evento', 7, FALSE, FALSE, TRUE, '2025-10-11T19:24:07.245Z'),
(84, 2, '📋 Nueva tarea asignada', 'Has sido asignado a la tarea: "Mejoremos El Contrato de Servicios 2026"', 'info', 'tarea', 11, FALSE, FALSE, FALSE, '2025-10-11T20:59:23.422Z'),
(85, 1, '📋 Nueva tarea asignada', 'Has sido asignado a la tarea: "Mejoremos El Contrato de Servicios 2026"', 'info', 'tarea', 11, FALSE, FALSE, FALSE, '2025-10-11T20:59:23.429Z'),
(86, 1, '🔴 ¡Urgente! Tarea vence HOY', 'La tarea "Mejoremos El Contrato de Servicios 2026" vence HOY (11/10/2025)', 'error', 'tarea_recordatorio_hoy', 11, FALSE, FALSE, TRUE, '2025-10-11T20:59:55.226Z'),
(87, 2, '🔴 ¡Urgente! Tarea vence HOY', 'La tarea "Mejoremos El Contrato de Servicios 2026" vence HOY (11/10/2025)', 'error', 'tarea_recordatorio_hoy', 11, FALSE, FALSE, TRUE, '2025-10-11T20:59:55.228Z'),
(88, 2, '💬 Nuevo comentario', 'Walter Lozano Alcalde comentó en: "Mejoremos El Contrato de Servicios 2026"', 'info', 'tarea', 11, FALSE, FALSE, TRUE, '2025-10-11T21:00:33.405Z'),
(89, 1, '💬 Nuevo comentario', 'Walter Lozano Alcalde comentó en: "Mejoremos El Contrato de Servicios 2026"', 'info', 'tarea', 11, FALSE, FALSE, TRUE, '2025-10-11T21:00:33.406Z'),
(90, 2, '💬 Nuevo comentario', 'Rosario Maravi Lagos comentó en: "Mejoremos El Contrato de Servicios 2026"', 'info', 'tarea', 11, FALSE, FALSE, TRUE, '2025-10-11T21:07:44.382Z'),
(91, 1, '💬 Nuevo comentario', 'Rosario Maravi Lagos comentó en: "Mejoremos El Contrato de Servicios 2026"', 'info', 'tarea', 11, FALSE, FALSE, TRUE, '2025-10-11T21:07:44.384Z'),
(92, 1, '📋 Nueva tarea asignada', 'Has sido asignado a la tarea: "BORARRR"', 'info', 'tarea', 12, FALSE, FALSE, TRUE, '2025-10-11T21:09:41.690Z'),
(93, 3, '📋 Nueva tarea asignada', 'Has sido asignado a la tarea: "BORARRR"', 'info', 'tarea', 12, FALSE, FALSE, TRUE, '2025-10-11T21:09:41.697Z'),
(94, 1, '🎉 ¡Evento HOY!', 'El evento "Evento Prueba 1" es HOY a las 07:00 en Vanguard Schools', 'success', 'evento_recordatorio_hoy', 2, FALSE, FALSE, TRUE, '2025-10-12T00:04:04.842Z'),
(95, 2, '🎉 ¡Evento HOY!', 'El evento "Evento Prueba 1" es HOY a las 07:00 en Vanguard Schools', 'success', 'evento_recordatorio_hoy', 2, FALSE, FALSE, TRUE, '2025-10-12T00:04:04.846Z'),
(96, 1, '🔴 Recordatorio: Tarea vence mañana', 'La tarea "Tarea de Prueba - 4to Bimestre" vence mañana (14/10/2025)', 'warning', 'tarea_recordatorio_1dia', 10, FALSE, FALSE, TRUE, '2025-10-13T12:35:21.114Z'),
(97, 2, '🔴 Recordatorio: Tarea vence mañana', 'La tarea "Tarea de Prueba - 4to Bimestre" vence mañana (14/10/2025)', 'warning', 'tarea_recordatorio_1dia', 10, FALSE, FALSE, TRUE, '2025-10-13T12:35:21.122Z'),
(98, 3, '🔴 Recordatorio: Tarea vence mañana', 'La tarea "Tarea de Prueba - 4to Bimestre" vence mañana (14/10/2025)', 'warning', 'tarea_recordatorio_1dia', 10, FALSE, FALSE, TRUE, '2025-10-13T12:35:21.124Z'),
(99, 1, '🔴 ¡Urgente! Tarea vence HOY', 'La tarea "Tarea de Prueba - 4to Bimestre" vence HOY (14/10/2025)', 'error', 'tarea_recordatorio_hoy', 10, FALSE, FALSE, TRUE, '2025-10-14T00:00:00.048Z'),
(100, 2, '🔴 ¡Urgente! Tarea vence HOY', 'La tarea "Tarea de Prueba - 4to Bimestre" vence HOY (14/10/2025)', 'error', 'tarea_recordatorio_hoy', 10, FALSE, FALSE, TRUE, '2025-10-14T00:00:00.054Z'),
(101, 3, '🔴 ¡Urgente! Tarea vence HOY', 'La tarea "Tarea de Prueba - 4to Bimestre" vence HOY (14/10/2025)', 'error', 'tarea_recordatorio_hoy', 10, FALSE, FALSE, TRUE, '2025-10-14T00:00:00.055Z'),
(102, 1, '🎉 Recordatorio: Evento mañana', 'El evento "Evento de Prueba - Fiesta Romana" es mañana a las 17:00 en Vanguard Schools', 'info', 'evento_recordatorio_1dia', 7, FALSE, FALSE, TRUE, '2025-10-14T00:00:07.406Z'),
(103, 2, '🎉 Recordatorio: Evento mañana', 'El evento "Evento de Prueba - Fiesta Romana" es mañana a las 17:00 en Vanguard Schools', 'info', 'evento_recordatorio_1dia', 7, FALSE, FALSE, TRUE, '2025-10-14T00:00:07.407Z'),
(104, 1, '🔴 ¡Urgente! Tarea vence HOY', 'La tarea "Tarea de Prueba - 4to Bimestre" vence HOY (14/10/2025)', 'error', 'tarea_recordatorio_hoy', 10, FALSE, FALSE, TRUE, '2025-10-14T12:48:40.438Z'),
(105, 2, '🔴 ¡Urgente! Tarea vence HOY', 'La tarea "Tarea de Prueba - 4to Bimestre" vence HOY (14/10/2025)', 'error', 'tarea_recordatorio_hoy', 10, FALSE, FALSE, TRUE, '2025-10-14T12:48:40.445Z'),
(106, 3, '🔴 ¡Urgente! Tarea vence HOY', 'La tarea "Tarea de Prueba - 4to Bimestre" vence HOY (14/10/2025)', 'error', 'tarea_recordatorio_hoy', 10, FALSE, FALSE, TRUE, '2025-10-14T12:48:40.446Z'),
(107, 1, '🎉 Recordatorio: Evento mañana', 'El evento "Evento de Prueba - Fiesta Romana" es mañana a las 17:00 en Vanguard Schools', 'info', 'evento_recordatorio_1dia', 7, FALSE, FALSE, TRUE, '2025-10-14T12:48:48.698Z'),
(108, 2, '🎉 Recordatorio: Evento mañana', 'El evento "Evento de Prueba - Fiesta Romana" es mañana a las 17:00 en Vanguard Schools', 'info', 'evento_recordatorio_1dia', 7, FALSE, FALSE, TRUE, '2025-10-14T12:48:48.699Z'),
(109, 2, '❌ Tarea cancelada', 'La tarea "Tarea Prueba" fue cancelada', 'warning', 'tarea', 7, FALSE, FALSE, TRUE, '2025-10-14T19:58:31.813Z'),
(110, 2, '✅ Tarea completada', 'La tarea "Tarea Prueba" fue completada', 'success', 'tarea', 7, FALSE, FALSE, TRUE, '2025-10-14T19:58:34.744Z'),
(111, 1, '🎉 ¡Evento HOY!', 'El evento "Evento de Prueba - Fiesta Romana" es HOY a las 17:00 en Vanguard Schools', 'success', 'evento_recordatorio_hoy', 7, FALSE, FALSE, TRUE, '2025-10-15T22:33:09.139Z'),
(112, 2, '🎉 ¡Evento HOY!', 'El evento "Evento de Prueba - Fiesta Romana" es HOY a las 17:00 en Vanguard Schools', 'success', 'evento_recordatorio_hoy', 7, FALSE, FALSE, TRUE, '2025-10-15T22:33:09.142Z'),
(113, 2, '❌ Tarea cancelada', 'La tarea "Tarea Prueba" fue cancelada', 'warning', 'tarea', 7, FALSE, FALSE, TRUE, '2025-10-16T21:15:34.344Z'),
(114, 2, '✅ Tarea completada', 'La tarea "Tarea Prueba" fue completada', 'success', 'tarea', 7, FALSE, FALSE, TRUE, '2025-10-16T21:15:40.546Z'),
(115, 1, '📋 Nueva tarea asignada', 'Has sido asignado a la tarea: "Prueba Borrar"', 'info', 'tarea', 13, FALSE, FALSE, TRUE, '2025-10-16T21:16:41.875Z'),
(116, 2, '📋 Nueva tarea asignada', 'Has sido asignado a la tarea: "Prueba Borrar"', 'info', 'tarea', 13, FALSE, FALSE, TRUE, '2025-10-16T21:16:41.884Z'),
(117, 1, '💬 Nuevo comentario', 'Walter Lozano Alcalde comentó en: "Prueba Borrar"', 'info', 'tarea', 13, FALSE, FALSE, TRUE, '2025-10-16T21:17:40.517Z'),
(118, 2, '💬 Nuevo comentario', 'Walter Lozano Alcalde comentó en: "Prueba Borrar"', 'info', 'tarea', 13, FALSE, FALSE, TRUE, '2025-10-16T21:17:40.519Z'),
(119, 1, '🟡 Recordatorio: Tarea vence mañana', 'La tarea "Prueba Borraryaaaa" vence mañana (17/10/2025)', 'warning', 'tarea_recordatorio_1dia', 13, FALSE, FALSE, FALSE, '2025-10-16T21:21:33.118Z'),
(120, 1, '📎 Nuevo archivo adjunto', 'Walter Lozano Alcalde subió el archivo "HORARIO WALTER.pdf" a: "Prueba Borraryaaaa"', 'info', 'tarea', 13, FALSE, FALSE, TRUE, '2025-10-16T21:24:04.229Z'),
(121, 2, '🎉 Invitación a evento', 'Has sido invitado al evento: "Evento Vanguard"', 'info', 'evento', 8, FALSE, FALSE, TRUE, '2025-10-16T21:38:30.730Z'),
(122, 3, '🎉 Invitación a evento', 'Has sido invitado al evento: "Evento Vanguard"', 'info', 'evento', 8, FALSE, FALSE, TRUE, '2025-10-16T21:38:30.733Z'),
(123, 1, '🎉 Invitación a evento', 'Has sido invitado al evento: "Evento Vanguard"', 'info', 'evento', 8, FALSE, FALSE, TRUE, '2025-10-16T21:38:30.734Z'),
(124, 1, '🎉 Invitación a evento', 'Has sido invitado al evento: "Borrame"', 'info', 'evento', 9, FALSE, FALSE, TRUE, '2025-10-16T21:43:01.892Z'),
(125, 1, '🎉 Invitación a evento', 'Has sido invitado al evento: "borrame ultimo"', 'info', 'evento', 10, FALSE, FALSE, FALSE, '2025-10-16T22:21:08.179Z'),
(126, 3, '🎉 Invitación a evento', 'Has sido invitado al evento: "Fiesta Romana - Descontrol Total"', 'info', 'evento', 11, FALSE, FALSE, TRUE, '2025-10-16T22:37:24.411Z'),
(127, 2, '🎉 Invitación a evento', 'Has sido invitado al evento: "Fiesta Romana - Descontrol Total"', 'info', 'evento', 11, FALSE, FALSE, TRUE, '2025-10-16T22:37:24.414Z'),
(128, 1, '🎉 Invitación a evento', 'Has sido invitado al evento: "Fiesta Romana - Descontrol Total"', 'info', 'evento', 11, FALSE, FALSE, TRUE, '2025-10-16T22:37:24.415Z'),
(129, 1, '🎉 Invitación a evento', 'Has sido invitado al evento: "Ejemplode Correo"', 'info', 'evento', 12, FALSE, FALSE, TRUE, '2025-10-16T22:41:30.501Z'),
(130, 1, '🎉 Invitación a evento', 'Has sido invitado al evento: "Evento 5"', 'info', 'evento', 13, FALSE, FALSE, TRUE, '2025-10-16T22:50:56.844Z');

-- ================================================
-- TABLA: PROJECTS
-- ================================================

DROP TABLE IF EXISTS "projects" CASCADE;
CREATE TABLE "projects" (
  "id" integer NOT NULL DEFAULT nextval('projects_id_seq'::regclass),
  "name" character varying(255) NOT NULL,
  "description" text,
  "color" character varying(7) DEFAULT '#3b82f6'::character varying,
  "created_by" integer,
  "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios" ("id");
ALTER TABLE "projects" ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");

-- Datos de projects
INSERT INTO "projects" ("id", "name", "description", "color", "created_by", "created_at", "updated_at") VALUES
(1, 'General', 'Tareas generales del sistema', '#6b7280', NULL, '2025-10-11T01:24:45.810Z', '2025-10-11T01:24:45.810Z'),
(2, 'Desarrollo', 'Tareas de desarrollo y programación', '#3b82f6', NULL, '2025-10-11T01:24:45.810Z', '2025-10-11T01:24:45.810Z'),
(3, 'Diseño', 'Tareas de diseño y UX/UI', '#8b5cf6', NULL, '2025-10-11T01:24:45.810Z', '2025-10-11T01:24:45.810Z'),
(4, 'Marketing', 'Tareas de marketing y promoción', '#f59e0b', NULL, '2025-10-11T01:24:45.810Z', '2025-10-11T01:24:45.810Z'),
(5, 'Soporte', 'Tareas de soporte y mantenimiento', '#10b981', NULL, '2025-10-11T01:24:45.810Z', '2025-10-11T01:24:45.810Z');

-- ================================================
-- TABLA: PUSH_SUBSCRIPTIONS
-- ================================================

DROP TABLE IF EXISTS "push_subscriptions" CASCADE;
CREATE TABLE "push_subscriptions" (
  "id" integer NOT NULL DEFAULT nextval('push_subscriptions_id_seq'::regclass),
  "usuario_id" integer NOT NULL,
  "endpoint" text NOT NULL,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now()
);

ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id");
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_usuario_id_endpoint_key" UNIQUE ("endpoint");
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_usuario_id_endpoint_key" UNIQUE ("endpoint");
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_usuario_id_endpoint_key" UNIQUE ("usuario_id");
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_usuario_id_endpoint_key" UNIQUE ("usuario_id");

-- Datos de push_subscriptions
INSERT INTO "push_subscriptions" ("id", "usuario_id", "endpoint", "p256dh", "auth", "created_at", "updated_at") VALUES
(6, 1, 'https://fcm.googleapis.com/fcm/send/cyQZshZDcng:APA91bHZzXFUTKtp3lb0h2cpFUQHEgL6puczRsnaDlTBzj_QknYh4x3KAjrGytghK__Uc0JpqJCWcnrvC9KR9CsEPS-pcm2UlZ5A8a2B5sGxr3vNPDu2F20-unoMTldRyV7VU-SbnR1W', 'BO4svkNy-BBLbZhYWjTllqE4ZdTlHyCziHfGXsnOsR-vNIQ89HVlSaOEvCshV5ptKjC1LJ1AsBdpGQYjiUUQrGE', 'Dd9fCiG9D_ViBDfOLa9sXw', '2025-10-16T19:11:59.636Z', '2025-10-16T19:11:59.636Z');

-- ================================================
-- TABLA: TAREA_ASIGNACIONES
-- ================================================

DROP TABLE IF EXISTS "tarea_asignaciones" CASCADE;
CREATE TABLE "tarea_asignaciones" (
  "id" integer NOT NULL DEFAULT nextval('tarea_asignaciones_id_seq'::regclass),
  "tarea_id" integer NOT NULL,
  "usuario_id" integer NOT NULL,
  "rol" character varying(20) DEFAULT 'asignado'::character varying,
  "notificado" boolean DEFAULT false,
  "created_at" timestamp without time zone DEFAULT now()
);

ALTER TABLE "tarea_asignaciones" ADD CONSTRAINT "fk_tarea_asignacion_tarea" FOREIGN KEY ("tarea_id") REFERENCES "tareas" ("id");
ALTER TABLE "tarea_asignaciones" ADD CONSTRAINT "fk_tarea_asignacion_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id");
ALTER TABLE "tarea_asignaciones" ADD CONSTRAINT "tarea_asignaciones_pkey" PRIMARY KEY ("id");
ALTER TABLE "tarea_asignaciones" ADD CONSTRAINT "uq_tarea_usuario" UNIQUE ("usuario_id");
ALTER TABLE "tarea_asignaciones" ADD CONSTRAINT "uq_tarea_usuario" UNIQUE ("usuario_id");
ALTER TABLE "tarea_asignaciones" ADD CONSTRAINT "uq_tarea_usuario" UNIQUE ("tarea_id");
ALTER TABLE "tarea_asignaciones" ADD CONSTRAINT "uq_tarea_usuario" UNIQUE ("tarea_id");

-- Datos de tarea_asignaciones
INSERT INTO "tarea_asignaciones" ("id", "tarea_id", "usuario_id", "rol", "notificado", "created_at") VALUES
(6, 3, 4, 'asignado', FALSE, '2025-10-10T22:02:31.578Z'),
(7, 3, 3, 'asignado', FALSE, '2025-10-10T22:02:31.582Z'),
(8, 3, 2, 'asignado', FALSE, '2025-10-10T22:02:31.583Z'),
(9, 3, 1, 'asignado', FALSE, '2025-10-10T22:02:31.584Z'),
(21, 2, 1, 'asignado', FALSE, '2025-10-11T15:42:28.920Z'),
(22, 2, 2, 'asignado', FALSE, '2025-10-11T15:42:28.924Z'),
(23, 4, 4, 'asignado', FALSE, '2025-10-11T15:42:47.943Z'),
(24, 4, 3, 'asignado', FALSE, '2025-10-11T15:42:47.944Z'),
(25, 4, 5, 'asignado', FALSE, '2025-10-11T15:42:47.945Z'),
(26, 4, 2, 'asignado', FALSE, '2025-10-11T15:42:47.946Z'),
(27, 4, 1, 'asignado', FALSE, '2025-10-11T15:42:47.947Z'),
(30, 7, 2, 'asignado', FALSE, '2025-10-11T17:56:37.208Z'),
(31, 7, 1, 'asignado', FALSE, '2025-10-11T17:56:37.210Z'),
(36, 10, 2, 'asignado', FALSE, '2025-10-11T19:16:32.586Z'),
(37, 10, 1, 'asignado', FALSE, '2025-10-11T19:16:32.588Z'),
(38, 10, 3, 'asignado', FALSE, '2025-10-11T19:16:32.589Z'),
(39, 11, 2, 'asignado', FALSE, '2025-10-11T20:59:23.325Z'),
(40, 11, 1, 'asignado', FALSE, '2025-10-11T20:59:23.326Z'),
(45, 13, 1, 'asignado', FALSE, '2025-10-16T21:18:22.094Z');

-- ================================================
-- TABLA: TAREAS
-- ================================================

DROP TABLE IF EXISTS "tareas" CASCADE;
CREATE TABLE "tareas" (
  "id" integer NOT NULL DEFAULT nextval('tareas_id_seq'::regclass),
  "titulo" character varying(255) NOT NULL,
  "descripcion" text,
  "fecha_vencimiento" timestamp without time zone,
  "prioridad" character varying(20) DEFAULT 'media'::character varying,
  "estado" character varying(20) DEFAULT 'pendiente'::character varying,
  "categoria" character varying(50) DEFAULT 'general'::character varying,
  "color" character varying(7) DEFAULT '#ff9800'::character varying,
  "creado_por" integer NOT NULL,
  "completado_por" integer,
  "fecha_completado" timestamp without time zone,
  "activo" boolean DEFAULT true,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now(),
  "project_id" integer,
  "estimacion_horas" numeric,
  "progreso" integer DEFAULT 0,
  "tags" ARRAY,
  "fecha_inicio" timestamp without time zone,
  "recordatorios" jsonb,
  "metadata" jsonb
);

ALTER TABLE "tareas" ADD CONSTRAINT "fk_tarea_completado" FOREIGN KEY ("completado_por") REFERENCES "usuarios" ("id");
ALTER TABLE "tareas" ADD CONSTRAINT "fk_tarea_creador" FOREIGN KEY ("creado_por") REFERENCES "usuarios" ("id");
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id");
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_pkey" PRIMARY KEY ("id");

-- Datos de tareas
INSERT INTO "tareas" ("id", "titulo", "descripcion", "fecha_vencimiento", "prioridad", "estado", "categoria", "color", "creado_por", "completado_por", "fecha_completado", "activo", "created_at", "updated_at", "project_id", "estimacion_horas", "progreso", "tags", "fecha_inicio", "recordatorios", "metadata") VALUES
(2, 'Desarrollo Vangard Calendar', 'Desarrollo de aplicativo Vanguard Calendar, tanto para web como para celular, autogestionado, eventos, calendario, tareas, etc', '2025-10-23T06:42:00.000Z', 'media', 'en_progreso', 'general', '#ff9800', 1, NULL, NULL, TRUE, '2025-10-10T21:43:33.451Z', '2025-10-11T17:17:56.024Z', 2, '52.00', 10, #eventos,#calendario,#tareas, NULL, NULL, NULL),
(3, 'Evento Dia del Colegio Vanguard', 'Preparativos para el evento central del día del colegio', '2025-11-15T10:01:00.000Z', 'urgente', 'pendiente', 'general', '#ff9800', 1, NULL, NULL, TRUE, '2025-10-10T22:02:31.570Z', '2025-10-10T22:02:31.570Z', 4, '70.00', 2, #fiestavanguard, NULL, NULL, NULL),
(4, 'Festidanza Vanguard Schools', 'Preparacion para el evento de Festidanza del colegio', '2025-10-31T03:14:00.000Z', 'media', 'pendiente', 'general', '#ff9800', 1, NULL, NULL, TRUE, '2025-10-10T22:14:50.950Z', '2025-10-11T15:59:02.651Z', 1, '50.00', 4, #festidanza, NULL, NULL, NULL),
(7, 'Tarea Prueba', 'Tarea Prueba', '2025-10-11T11:44:00.000Z', 'media', 'completada', 'general', '#ff9800', 1, NULL, NULL, TRUE, '2025-10-11T16:45:01.024Z', '2025-10-16T21:15:40.541Z', 2, '20.00', 100, , NULL, NULL, NULL),
(10, 'Tarea de Prueba - 4to Bimestre', 'Empezamos el 4to bimestre con fuerza y muchas ganas', '2025-10-14T23:16:00.000Z', 'alta', 'pendiente', 'general', '#ff9800', 1, NULL, NULL, TRUE, '2025-10-11T19:16:32.580Z', '2025-10-11T19:16:32.580Z', 1, '8.00', 0, #4toBimestre, NULL, NULL, NULL),
(11, 'Mejoremos El Contrato de Servicios 2026', 'Mejoremos El Contrato de Servicios 2026', '2025-10-11T21:58:00.000Z', 'alta', 'pendiente', 'general', '#ff9800', 1, NULL, NULL, TRUE, '2025-10-11T20:59:23.322Z', '2025-10-11T20:59:23.322Z', 2, '2.00', 0, #contrato2026, NULL, NULL, NULL),
(13, 'Prueba Borraryaaaa', 'Borrame ya', '2025-10-18T02:16:00.000Z', 'media', 'cancelada', 'general', '#ff9800', 1, NULL, NULL, TRUE, '2025-10-16T21:16:41.764Z', '2025-10-16T21:24:55.168Z', 5, '20.00', 5, , NULL, NULL, NULL);

-- ================================================
-- TABLA: TASK_ATTACHMENTS
-- ================================================

DROP TABLE IF EXISTS "task_attachments" CASCADE;
CREATE TABLE "task_attachments" (
  "id" integer NOT NULL DEFAULT nextval('task_attachments_id_seq'::regclass),
  "task_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "filename" character varying(255) NOT NULL,
  "original_name" character varying(255) NOT NULL,
  "file_path" character varying(500) NOT NULL,
  "file_size" integer NOT NULL,
  "file_type" character varying(100) NOT NULL,
  "version" integer DEFAULT 1,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now()
);

ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tareas" ("id");
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios" ("id");
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id");

-- Datos de task_attachments
INSERT INTO "task_attachments" ("id", "task_id", "user_id", "filename", "original_name", "file_path", "file_size", "file_type", "version", "created_at", "updated_at") VALUES
(1, 11, 1, '625384fe-7557-42a3-a67d-33c96b1b8d4f-CONTRATO 2026 OK - 03-10-25.docx', 'CONTRATO 2026 OK - 03-10-25.docx', 'C:\sistema-agenda-calendario\backend\uploads\attachments\625384fe-7557-42a3-a67d-33c96b1b8d4f-CONTRATO 2026 OK - 03-10-25.docx', 2567397, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1, '2025-10-11T21:00:03.451Z', '2025-10-11T21:00:03.451Z'),
(2, 11, 2, '68866999-c13b-41fe-a224-008f33249f7f-V2-CONTRATO 2026 OK - 03-10-25.docx', 'V2-CONTRATO 2026 OK - 03-10-25.docx', 'C:\sistema-agenda-calendario\backend\uploads\attachments\68866999-c13b-41fe-a224-008f33249f7f-V2-CONTRATO 2026 OK - 03-10-25.docx', 2567397, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1, '2025-10-11T21:07:18.016Z', '2025-10-11T21:07:18.016Z'),
(3, 13, 1, '47000abc-ea8e-42a8-be68-fb4f80fd6fc1-HORARIO WALTER.pdf', 'HORARIO WALTER.pdf', 'C:\sistema-agenda-calendario\backend\uploads\attachments\47000abc-ea8e-42a8-be68-fb4f80fd6fc1-HORARIO WALTER.pdf', 7984, 'application/pdf', 1, '2025-10-16T21:17:23.527Z', '2025-10-16T21:17:23.527Z'),
(4, 13, 1, '18e89930-ae12-4d1e-a946-ca9328066a6e-HORARIO WALTER.pdf', 'HORARIO WALTER.pdf', 'C:\sistema-agenda-calendario\backend\uploads\attachments\18e89930-ae12-4d1e-a946-ca9328066a6e-HORARIO WALTER.pdf', 7984, 'application/pdf', 2, '2025-10-16T21:24:04.223Z', '2025-10-16T21:24:04.223Z');

-- ================================================
-- TABLA: TASK_COMMENTS
-- ================================================

DROP TABLE IF EXISTS "task_comments" CASCADE;
CREATE TABLE "task_comments" (
  "id" integer NOT NULL DEFAULT nextval('task_comments_id_seq'::regclass),
  "task_id" integer,
  "user_id" integer,
  "content" text NOT NULL,
  "type" character varying(20) DEFAULT 'comment'::character varying,
  "parent_id" integer,
  "mentions" ARRAY DEFAULT '{}'::integer[],
  "attachments" ARRAY DEFAULT '{}'::text[],
  "reactions" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "task_comments" ("id");
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tareas" ("id");
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios" ("id");
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id");

-- Datos de task_comments
INSERT INTO "task_comments" ("id", "task_id", "user_id", "content", "type", "parent_id", "mentions", "attachments", "reactions", "created_at", "updated_at") VALUES
(5, 2, 1, 'Inicio del Sistema e proceso de desarrollo.', 'comment', NULL, , , [object Object], '2025-10-10T21:44:11.524Z', '2025-10-10T21:44:11.524Z'),
(6, 7, 1, 'Empezamos el desarrollo', 'comment', NULL, , , [object Object], '2025-10-11T17:16:52.008Z', '2025-10-11T17:16:52.008Z'),
(7, 10, 1, 'iniciamos por el comienzo y terminamos por el final', 'comment', NULL, , , [object Object], '2025-10-11T19:17:30.656Z', '2025-10-11T19:17:30.656Z'),
(8, 10, 1, 'Listo empezamos miss', 'comment', NULL, , , [object Object], '2025-10-11T19:22:22.501Z', '2025-10-11T19:22:22.501Z'),
(9, 11, 1, 'Ya subi el archivo', 'comment', NULL, , , [object Object], '2025-10-11T21:00:33.395Z', '2025-10-11T21:00:33.395Z'),
(10, 11, 2, 'ya lo subi editado', 'comment', NULL, , , [object Object], '2025-10-11T21:07:44.375Z', '2025-10-11T21:07:44.375Z'),
(11, 13, 1, 'SUbi el docmeno empecemos', 'comment', NULL, , , [object Object], '2025-10-16T21:17:40.510Z', '2025-10-16T21:17:40.510Z');

-- ================================================
-- TABLA: TASK_HISTORY
-- ================================================

DROP TABLE IF EXISTS "task_history" CASCADE;
CREATE TABLE "task_history" (
  "id" integer NOT NULL DEFAULT nextval('task_history_id_seq'::regclass),
  "task_id" integer,
  "user_id" integer,
  "action" character varying(100) NOT NULL,
  "changes" jsonb,
  "old_values" jsonb,
  "new_values" jsonb,
  "metadata" jsonb,
  "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "task_history" ADD CONSTRAINT "task_history_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tareas" ("id");
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios" ("id");
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_pkey" PRIMARY KEY ("id");

-- Datos de task_history
INSERT INTO "task_history" ("id", "task_id", "user_id", "action", "changes", "old_values", "new_values", "metadata", "created_at") VALUES
(6, 2, 1, 'created', [object Object], NULL, NULL, NULL, '2025-10-10T21:43:33.467Z'),
(7, 2, 1, 'commented', [object Object], NULL, NULL, NULL, '2025-10-10T21:44:11.527Z'),
(8, 2, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-10T21:53:20.667Z'),
(9, 2, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-10T21:53:27.087Z'),
(10, 2, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-10T21:57:30.369Z'),
(11, 2, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-10T21:57:38.992Z'),
(12, 2, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-10T21:57:55.103Z'),
(13, 2, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-10T21:57:58.014Z'),
(14, 2, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-10T21:58:01.078Z'),
(15, 2, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-10T21:59:30.464Z'),
(16, 3, 1, 'created', [object Object], NULL, NULL, NULL, '2025-10-10T22:02:31.585Z'),
(17, 2, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-10T22:02:56.767Z'),
(18, 2, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-10T22:03:00.293Z'),
(19, 2, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-10T22:03:02.895Z'),
(20, 2, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-10T22:03:09.694Z'),
(21, 4, 1, 'created', [object Object], NULL, NULL, NULL, '2025-10-10T22:14:50.968Z'),
(24, 2, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-11T15:42:28.925Z'),
(25, 4, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-11T15:42:47.948Z'),
(26, 4, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-11T15:59:02.656Z'),
(27, 7, 1, 'created', [object Object], NULL, NULL, NULL, '2025-10-11T16:45:01.030Z'),
(28, 7, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-11T16:54:10.113Z'),
(29, 7, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-11T16:57:39.085Z'),
(30, 7, 1, 'commented', [object Object], NULL, NULL, NULL, '2025-10-11T17:16:52.011Z'),
(31, 2, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-11T17:17:56.030Z'),
(32, 7, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-11T17:56:37.214Z'),
(34, 10, 1, 'created', [object Object], NULL, NULL, NULL, '2025-10-11T19:16:32.590Z'),
(35, 10, 1, 'commented', [object Object], NULL, NULL, NULL, '2025-10-11T19:17:30.659Z'),
(36, 10, 1, 'commented', [object Object], NULL, NULL, NULL, '2025-10-11T19:22:22.504Z'),
(37, 11, 1, 'created', [object Object], NULL, NULL, NULL, '2025-10-11T20:59:23.327Z'),
(38, 11, 1, 'commented', [object Object], NULL, NULL, NULL, '2025-10-11T21:00:33.401Z'),
(39, 11, 2, 'commented', [object Object], NULL, NULL, NULL, '2025-10-11T21:07:44.378Z'),
(41, 7, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-14T19:58:31.812Z'),
(42, 7, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-14T19:58:34.742Z'),
(43, 7, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-16T21:15:34.344Z'),
(44, 7, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-16T21:15:40.545Z'),
(45, 13, 1, 'created', [object Object], NULL, NULL, NULL, '2025-10-16T21:16:41.773Z'),
(46, 13, 1, 'commented', [object Object], NULL, NULL, NULL, '2025-10-16T21:17:40.514Z'),
(47, 13, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-16T21:18:22.096Z'),
(48, 13, 1, 'updated', [object Object], NULL, NULL, NULL, '2025-10-16T21:24:55.172Z');

-- ================================================
-- TABLA: TASK_SUBTASKS
-- ================================================

DROP TABLE IF EXISTS "task_subtasks" CASCADE;
CREATE TABLE "task_subtasks" (
  "id" integer NOT NULL DEFAULT nextval('task_subtasks_id_seq'::regclass),
  "task_id" integer,
  "title" character varying(255) NOT NULL,
  "description" text,
  "completed" boolean DEFAULT false,
  "completed_at" timestamp without time zone,
  "completed_by" integer,
  "order_index" integer DEFAULT 0,
  "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "task_subtasks" ADD CONSTRAINT "task_subtasks_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "usuarios" ("id");
ALTER TABLE "task_subtasks" ADD CONSTRAINT "task_subtasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tareas" ("id");
ALTER TABLE "task_subtasks" ADD CONSTRAINT "task_subtasks_pkey" PRIMARY KEY ("id");

-- ================================================
-- TABLA: TASK_TEMPLATES
-- ================================================

DROP TABLE IF EXISTS "task_templates" CASCADE;
CREATE TABLE "task_templates" (
  "id" integer NOT NULL DEFAULT nextval('task_templates_id_seq'::regclass),
  "name" character varying(255) NOT NULL,
  "description" text,
  "template_data" jsonb NOT NULL,
  "category" character varying(100),
  "created_by" integer,
  "is_public" boolean DEFAULT false,
  "usage_count" integer DEFAULT 0,
  "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios" ("id");
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_pkey" PRIMARY KEY ("id");

-- Datos de task_templates
INSERT INTO "task_templates" ("id", "name", "description", "template_data", "category", "created_by", "is_public", "usage_count", "created_at", "updated_at") VALUES
(1, 'Bug Fix', 'Template para reportar y solucionar bugs', [object Object], 'development', NULL, TRUE, 0, '2025-10-11T01:24:45.810Z', '2025-10-11T01:24:45.810Z'),
(2, 'Feature Request', 'Template para solicitar nuevas funcionalidades', [object Object], 'development', NULL, TRUE, 0, '2025-10-11T01:24:45.810Z', '2025-10-11T01:24:45.810Z'),
(3, 'Design Task', 'Template para tareas de diseño', [object Object], 'design', NULL, TRUE, 0, '2025-10-11T01:24:45.810Z', '2025-10-11T01:24:45.810Z');

-- ================================================
-- TABLA: TASK_TIME_ENTRIES
-- ================================================

DROP TABLE IF EXISTS "task_time_entries" CASCADE;
CREATE TABLE "task_time_entries" (
  "id" integer NOT NULL DEFAULT nextval('task_time_entries_id_seq'::regclass),
  "task_id" integer,
  "user_id" integer,
  "start_time" timestamp without time zone NOT NULL,
  "end_time" timestamp without time zone,
  "duration_minutes" integer,
  "description" text,
  "is_running" boolean DEFAULT true,
  "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "task_time_entries" ADD CONSTRAINT "task_time_entries_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tareas" ("id");
ALTER TABLE "task_time_entries" ADD CONSTRAINT "task_time_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios" ("id");
ALTER TABLE "task_time_entries" ADD CONSTRAINT "task_time_entries_pkey" PRIMARY KEY ("id");

-- ================================================
-- TABLA: USUARIOS
-- ================================================

DROP TABLE IF EXISTS "usuarios" CASCADE;
CREATE TABLE "usuarios" (
  "id" integer NOT NULL DEFAULT nextval('usuarios_id_seq'::regclass),
  "nombres" character varying(255) NOT NULL,
  "apellidos" character varying(255) NOT NULL,
  "email" character varying(255) NOT NULL,
  "telefono" character varying(20),
  "clave" character varying(255) NOT NULL,
  "rol" character varying(50) DEFAULT 'Usuario'::character varying,
  "activo" boolean DEFAULT true,
  "avatar" character varying(500),
  "ultimo_acceso" timestamp without time zone,
  "configuracion" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now(),
  "dni" character varying(8) NOT NULL
);

ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id");
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_dni_key" UNIQUE ("dni");
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_email_key" UNIQUE ("email");

-- Datos de usuarios
INSERT INTO "usuarios" ("id", "nombres", "apellidos", "email", "telefono", "clave", "rol", "activo", "avatar", "ultimo_acceso", "configuracion", "created_at", "updated_at", "dni") VALUES
(1, 'Walter', 'Lozano Alcalde', 'walterlozanoalcalde@gmail.com', '970877642', '$2b$10$xGq5H4tsSJk6JfyyeFu9GO/fqlj.nIRnYaYw7qaFDm0952mzmoiZq', 'administrador', TRUE, '/uploads/avatar-1760117236036-818529358.jpg', '2025-10-16T21:33:13.459Z', [object Object], '2025-10-10T22:09:20.686Z', '2025-10-10T22:27:16.038Z', '11111111'),
(2, 'Rosario', 'Maravi Lagos', 'rosario.maravi@vanguardschools.edu.pe', '946592100', '$2b$10$8h8nbxONn5pFnMpu9.Sjwuc4Y2IF6c50CPrwvyZiGy2cMD36z6fHO', 'docente', TRUE, '/uploads/avatar-1760117680392-456794581.png', '2025-10-13T19:02:01.168Z', [object Object], '2025-10-10T22:17:28.657Z', '2025-10-13T19:01:13.543Z', '09582711'),
(3, 'Perla', 'Lagos Santos', 'perla.lagos@vanguardschools.edu.pe', '940292084', '$2b$10$uj6Ga/wpSDlXMBYkE3UqCOSHynxCvDf2ig4ONE7HFqsqZIeBNxbUe', 'docente', TRUE, '/uploads/avatar-1760117753016-55031708.png', NULL, [object Object], '2025-10-10T22:35:53.177Z', '2025-10-10T22:35:53.177Z', '10389412'),
(4, 'Diana', 'Velasquez Gil', 'dianavi54@gmail.com', '+14079631784', '$2b$10$aGbEXaYTJdPmJohIkkap9uT1zzninAj562ZEy/c1tbU.gfd9eR/Ia', 'docente', TRUE, '/uploads/avatar-1760117931613-295309209.png', NULL, [object Object], '2025-10-10T22:38:51.778Z', '2025-10-10T22:38:51.778Z', '41912331'),
(5, 'Mario Roberto', 'Gomes', 'mariorgomes@gmail.com', '+514079632055', '$2b$10$q3T/HOe10Rc57mU7e0yc4e8c2hSFNQf1HHfRQPpebQ2eD7uQr4osq', 'docente', TRUE, '/uploads/avatar-1760118041457-367684139.png', NULL, [object Object], '2025-10-10T22:40:41.609Z', '2025-10-14T19:58:23.305Z', '00048781');

-- ================================================
-- FIN DEL BACKUP MANUAL
-- ================================================
