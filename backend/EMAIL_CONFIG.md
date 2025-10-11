# 📧 Configuración de Email Notifications

## 🎯 Estado Actual

✅ **Nodemailer instalado**  
✅ **Sistema de emails integrado**  
✅ **Templates HTML profesionales**  
⚠️ **Credenciales SMTP pendientes de configurar**

---

## ⚙️ Configuración en `.env`

Agrega estas variables al archivo `backend/.env`:

```env
# ===================================
# EMAIL CONFIGURATION
# ===================================

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion_aqui
```

---

## 📝 Cómo obtener credenciales (Gmail)

### **Opción 1: Contraseña de Aplicación de Google (Recomendada)**

1. Ve a: https://myaccount.google.com/apppasswords
2. Inicia sesión con tu cuenta de Gmail
3. En "Seleccionar app" → Elige "Otro (nombre personalizado)"
4. Escribe: "Vanguard Calendar"
5. Click en "Generar"
6. **Copia la contraseña de 16 caracteres**
7. Pégala en `EMAIL_PASS` (sin espacios)

**Ejemplo:**
```env
EMAIL_USER=miempresa@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop  # (sin espacios: abcdefghijklmnop)
```

---

### **Opción 2: Verificación en 2 pasos desactivada**

Si no puedes usar Contraseñas de Aplicación:

1. Ve a: https://myaccount.google.com/security
2. Desactiva la verificación en 2 pasos (no recomendado)
3. Activa "Acceso de apps menos seguras"
4. Usa tu contraseña normal en `EMAIL_PASS`

⚠️ **No recomendado por seguridad**

---

## 🔧 Otras opciones de SMTP

### **SendGrid (Gratis hasta 100 emails/día)**
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=tu_api_key_aqui
```

### **Mailgun**
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu_usuario@dominio.com
EMAIL_PASS=tu_password
```

### **Outlook/Hotmail**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu_email@outlook.com
EMAIL_PASS=tu_contraseña
```

---

## ✉️ Qué hace el sistema

### **Envía emails automáticamente para:**

1. **Tareas:**
   - ✅ Asignación a tarea
   - ✅ Cambio de estado (Completada, Cancelada, En Progreso)
   - ✅ Cambio de prioridad
   - ✅ Nuevo comentario
   - ✅ Recordatorio 1 día antes (cron job)
   - ✅ Recordatorio el día de vencimiento (cron job)

2. **Eventos:**
   - ✅ Invitación a evento
   - ✅ Recordatorio 1 día antes (cron job)
   - ✅ Recordatorio el día del evento (cron job)

### **Template del email:**

- 🎨 Diseño profesional con gradiente
- 🏷️ Logo del sistema (dinámico)
- 🎯 Botón para ir directo a la tarea/evento
- 📱 Responsive (se ve bien en móvil)
- 🌈 Colores según tipo de notificación

---

## 🧪 Probar que funciona

1. Configura las credenciales en `.env`
2. Reinicia el servidor: `npm run dev`
3. Verás en consola:
   ```
   ✅ Servidor de email listo para enviar mensajes
   ```
4. Crea una tarea y asigna a un usuario con email
5. Verás en consola:
   ```
   ✅ Email enviado a usuario@email.com: 📋 Nueva tarea asignada
   ```
6. Revisa la bandeja del usuario

---

## ⚠️ Notas Importantes

- ✅ Si NO configuras email, el sistema **sigue funcionando** (solo notificaciones en app)
- ✅ Los emails se envían en **segundo plano** (no bloquean la app)
- ✅ Si falla el email, **no rompe** la creación de notificaciones
- ✅ Se marca `enviada_email = true` solo si se envió exitosamente

---

## 🔒 Seguridad

- ✅ **NUNCA** subas el `.env` a Git
- ✅ Usa **Contraseñas de Aplicación**, no tu contraseña real
- ✅ Para producción, usa variables de entorno del servidor
- ✅ Considera usar servicios dedicados (SendGrid, Mailgun)

---

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del backend para errores
2. Verifica que el email/contraseña sean correctos
3. Asegúrate que Gmail permita "apps menos seguras" o uses Contraseña de App
4. Prueba con otro servicio SMTP si Gmail no funciona

---

**¡El sistema está listo! Solo falta configurar las credenciales.** 📧✨

