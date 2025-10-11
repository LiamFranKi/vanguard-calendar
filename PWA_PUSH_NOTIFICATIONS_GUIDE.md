# 📱 **PWA & PUSH NOTIFICATIONS - GUÍA COMPLETA**

Sistema completo de Progressive Web App (PWA) con notificaciones push para **Vanguard Calendar**.

---

## 🎯 **RESUMEN**

Vanguard Calendar ahora es una **Progressive Web App (PWA)** completamente funcional con soporte para:

- ✅ **Instalación** en dispositivos móviles y escritorio
- ✅ **Funcionamiento offline** con caché inteligente
- ✅ **Push Notifications** en tiempo real
- ✅ **Iconos optimizados** para todas las plataformas
- ✅ **Service Worker** para actualizaciones automáticas
- ✅ **Shortcuts** de aplicación personalizados

---

## 🚀 **CARACTERÍSTICAS IMPLEMENTADAS**

### **1. PWA Básico**

#### **Manifest.json**
- **Nombre**: Vanguard Calendar
- **Nombre corto**: VCalendar
- **Tema**: Azul (#3b82f6) y Morado (#764ba2)
- **Display**: Standalone (sin barra de navegador)
- **Iconos**: 8 tamaños (72x72 a 512x512)
- **Shortcuts**: Nueva Tarea, Nuevo Evento, Dashboard

#### **Service Worker**
- **Caché**: Network First con fallback a caché
- **Estrategia**: Peticiones API siempre por red, archivos estáticos en caché
- **Actualización automática**: Verifica cada minuto
- **Limpieza**: Elimina cachés antiguas automáticamente

---

### **2. Push Notifications**

#### **Backend (Web-Push)**
- **VAPID Keys**: Generadas y configuradas
- **Tabla BD**: `push_subscriptions` con índices optimizados
- **API Endpoints**:
  - `GET /api/push/vapid-public-key` - Obtener clave pública
  - `POST /api/push/subscribe` - Suscribirse
  - `POST /api/push/unsubscribe` - Desuscribirse
  - `GET /api/push/subscriptions` - Listar suscripciones
  - `POST /api/push/test` - Enviar notificación de prueba

#### **Frontend (React)**
- **Componente**: `PushNotificationManager`
- **Ubicación**: Página de Configuración
- **Funciones**:
  - Solicitar permisos de notificación
  - Suscribirse/desuscribirse de push
  - Enviar notificación de prueba
  - Mostrar estado de suscripción

#### **Integración Automática**
- **Tareas**: Notificación al asignar, cambiar estado, comentar
- **Eventos**: Notificación al crear, recordatorios 1 día antes y el día del evento
- **Sistema**: Integrado con `createNotification()` existente

---

## 🔧 **CONFIGURACIÓN**

### **1. Agregar VAPID Keys al .env**

Abre el archivo `backend/.env` y agrega estas líneas:

```env
# PWA - Push Notifications (VAPID Keys)
VAPID_PUBLIC_KEY=BPLdYypsRHQ4FNcldgRlXZRVui5ivS3Jjh1CaVzNpFerW3YZv2Lq1pmdSRVwYCnl6WaZQj6M_-Z0t8bjsAfI1yI
VAPID_PRIVATE_KEY=U8-7v2Dyskza0X_1CY7K-jWVibwHCCGtFFzqM1e1zbc
```

⚠️ **IMPORTANTE**: Estas claves son específicas para este proyecto. No las compartas públicamente.

---

### **2. Ejecutar Migración de Base de Datos**

Ejecuta el script SQL en pgAdmin:

```bash
migrations/014_CREATE_PUSH_SUBSCRIPTIONS.sql
```

Este script crea la tabla `push_subscriptions` con:
- Almacenamiento de endpoints de push
- Claves de encriptación (p256dh, auth)
- Índices para rendimiento
- Cascade delete al eliminar usuario

---

### **3. Generar Iconos PWA (Opcional)**

Los iconos temporales ya están listos, pero para producción se recomienda:

**Opción 1: Usar herramienta online**
1. Ve a https://realfavicongenerator.net/
2. Sube tu logo (512x512 PNG)
3. Descarga el paquete completo
4. Reemplaza los archivos en `frontend/public/`

**Opción 2: Usar ImageMagick**
```bash
cd frontend/public
magick icon.svg -resize 72x72 icon-72x72.png
magick icon.svg -resize 96x96 icon-96x96.png
magick icon.svg -resize 128x128 icon-128x128.png
magick icon.svg -resize 144x144 icon-144x144.png
magick icon.svg -resize 152x152 icon-152x152.png
magick icon.svg -resize 192x192 icon-192x192.png
magick icon.svg -resize 384x384 icon-384x384.png
magick icon.svg -resize 512x512 icon-512x512.png
```

---

## 📱 **CÓMO USAR**

### **Para Usuarios**

#### **1. Instalar la PWA**

**En Android (Chrome):**
1. Abre el sitio web
2. Tap en el menú (⋮)
3. Selecciona "Agregar a pantalla de inicio"
4. Confirma la instalación

**En iOS (Safari):**
1. Abre el sitio web
2. Tap en el ícono de compartir (cuadro con flecha)
3. Selecciona "Agregar a inicio"
4. Confirma la instalación

**En Escritorio (Chrome/Edge):**
1. Abre el sitio web
2. Busca el ícono de instalación en la barra de direcciones
3. Click en "Instalar"
4. La app se abrirá en una ventana independiente

---

#### **2. Activar Notificaciones Push**

1. Inicia sesión en Vanguard Calendar
2. Ve a **Configuración** (⚙️)
3. Desplázate hasta la sección "📱 Notificaciones Push"
4. Click en **"🔔 Activar Notificaciones"**
5. Acepta el permiso del navegador
6. ¡Listo! Ahora recibirás notificaciones en tiempo real

**Probar las notificaciones:**
- Click en **"🧪 Probar"** para enviar una notificación de prueba
- Si ves la notificación, todo está funcionando correctamente

**Desactivar notificaciones:**
- Click en **"🔕 Desactivar"** para cancelar la suscripción

---

### **Para Desarrolladores**

#### **1. Habilitar Service Worker en Desarrollo**

Por defecto, el Service Worker solo se registra en producción. Para habilitarlo en desarrollo:

Crea un archivo `.env` en `frontend/` con:
```env
VITE_ENABLE_SW=true
```

#### **2. Enviar Push Notifications Manualmente**

Usa la función `sendPushToUser` desde cualquier controlador:

```javascript
import { sendPushToUser } from './push.controller.js';

// Enviar notificación a un usuario específico
await sendPushToUser(userId, {
  title: 'Título de la notificación',
  body: 'Mensaje de la notificación',
  icon: '/icon-192x192.png',
  badge: '/icon-96x96.png',
  tag: 'unique-id',
  requireInteraction: false,
  data: {
    url: '/dashboard',
    custom_data: 'valor'
  }
});
```

#### **3. Enviar Push a Múltiples Usuarios**

```javascript
import { sendPushToUsers } from './push.controller.js';

// Enviar notificación a varios usuarios
await sendPushToUsers([userId1, userId2, userId3], {
  title: 'Título',
  body: 'Mensaje',
  data: { url: '/tareas' }
});
```

#### **4. Integrar con createNotification**

El sistema ya está integrado. Para deshabilitar push en una notificación específica:

```javascript
await createNotification({
  usuario_id: userId,
  titulo: 'Título',
  mensaje: 'Mensaje',
  tipo: 'info',
  relacionado_tipo: 'tarea',
  relacionado_id: tareaId,
  send_email: true,
  send_push: false  // ← Deshabilitar push
});
```

---

## 🔐 **SEGURIDAD Y PERMISOS**

### **Permisos de Navegador**

Las notificaciones push requieren permiso explícito del usuario. Estados posibles:

- **`default`**: Aún no se ha solicitado permiso
- **`granted`**: Usuario concedió permiso ✅
- **`denied`**: Usuario denegó permiso ❌

### **Seguridad de Suscripciones**

- ✅ Todas las suscripciones están vinculadas a usuarios autenticados
- ✅ Solo el usuario puede suscribirse/desuscribirse
- ✅ Las claves VAPID son privadas y no se exponen al cliente
- ✅ Comunicación encriptada con HTTPS (requerido para push)

### **Limpieza Automática**

- 🗑️ Suscripciones inválidas se eliminan automáticamente (410 Gone, 404)
- 🗑️ Suscripciones se eliminan en cascade al eliminar usuario

---

## 🌐 **DEPLOYMENT A PRODUCCIÓN**

### **1. Requisitos de HTTPS**

⚠️ **IMPORTANTE**: Las Push Notifications **SOLO funcionan con HTTPS**. 

En DigitalOcean:
1. Configura tu dominio (e.g., `calendar.vanguardschool.com`)
2. Instala SSL con Let's Encrypt (Certbot)
3. Configura Nginx para HTTPS

### **2. Variables de Entorno en Producción**

Asegúrate de configurar en tu servidor:

```bash
VAPID_PUBLIC_KEY=BPLdYypsRHQ4FNcldgRlXZRVui5ivS3Jjh1CaVzNpFerW3YZv2Lq1pmdSRVwYCnl6WaZQj6M_-Z0t8bjsAfI1yI
VAPID_PRIVATE_KEY=U8-7v2Dyskza0X_1CY7K-jWVibwHCCGtFFzqM1e1zbc
NODE_ENV=production
FRONTEND_URL=https://calendar.vanguardschool.com
```

### **3. Build de Frontend**

El Service Worker se registrará automáticamente en producción:

```bash
cd frontend
npm run build
```

### **4. Configurar Nginx**

Asegúrate de servir correctamente el `manifest.json` y el `service-worker.js`:

```nginx
location /manifest.json {
    root /var/www/vanguard-calendar/frontend/build;
    add_header Cache-Control "public, max-age=3600";
}

location /service-worker.js {
    root /var/www/vanguard-calendar/frontend/build;
    add_header Cache-Control "no-cache";
}
```

---

## 🧪 **TESTING**

### **1. Verificar Service Worker**

En Chrome DevTools:
1. Abre **Application** tab
2. Ve a **Service Workers**
3. Verifica que el SW esté activo
4. Click en **Update** para forzar actualización

### **2. Probar Notificaciones**

1. Ve a Configuración → Notificaciones Push
2. Click en "Activar Notificaciones"
3. Acepta el permiso
4. Click en "🧪 Probar"
5. Deberías recibir una notificación inmediatamente

### **3. Simular Offline**

En Chrome DevTools:
1. Abre **Network** tab
2. Cambia "No throttling" a **"Offline"**
3. Recarga la página
4. La app debería funcionar con contenido en caché

---

## 🐛 **TROUBLESHOOTING**

### **Problema: Service Worker no se registra**

**Solución 1**: Verifica que estés en HTTPS o localhost
```javascript
// Service Workers requieren HTTPS (excepto localhost)
```

**Solución 2**: Habilita en desarrollo
```env
# frontend/.env
VITE_ENABLE_SW=true
```

**Solución 3**: Limpia la caché del navegador
```
Chrome DevTools → Application → Storage → Clear site data
```

---

### **Problema: No recibo notificaciones push**

**Verificar claves VAPID**:
```bash
# Verifica que estén en backend/.env
echo $VAPID_PUBLIC_KEY
echo $VAPID_PRIVATE_KEY
```

**Verificar suscripción**:
```javascript
// En la consola del navegador
navigator.serviceWorker.ready.then(reg => 
  reg.pushManager.getSubscription().then(sub => console.log(sub))
);
```

**Verificar permisos**:
```javascript
console.log('Permiso:', Notification.permission);
// Debe ser "granted"
```

---

### **Problema: Notificación no abre la página correcta**

El Service Worker maneja los clicks en notificaciones. Verifica:

```javascript
// En public/service-worker.js
self.addEventListener('notificationclick', (event) => {
  // Verifica que la URL sea correcta
  console.log('URL destino:', urlToOpen);
});
```

---

## 📊 **ARQUITECTURA**

### **Flujo de Push Notifications**

```
┌──────────────┐
│   USUARIO    │
│  (Frontend)  │
└──────┬───────┘
       │ 1. Solicita suscripción
       ▼
┌──────────────┐
│    SERVICE   │
│    WORKER    │
└──────┬───────┘
       │ 2. Crea suscripción push
       ▼
┌──────────────┐
│   BACKEND    │
│  (Node.js)   │
└──────┬───────┘
       │ 3. Almacena en BD
       ▼
┌──────────────┐
│  push_       │
│  subscriptions│
└──────┬───────┘
       │
       │ 4. Evento (tarea, evento, etc.)
       ▼
┌──────────────┐
│  BACKEND     │
│ sendPushToUser│
└──────┬───────┘
       │ 5. Envía push via web-push
       ▼
┌──────────────┐
│  GOOGLE FCM  │
│  (o similar) │
└──────┬───────┘
       │ 6. Entrega al dispositivo
       ▼
┌──────────────┐
│  SERVICE     │
│  WORKER      │
└──────┬───────┘
       │ 7. Muestra notificación
       ▼
┌──────────────┐
│  USUARIO ve  │
│ notificación │
└──────────────┘
```

---

## 📚 **RECURSOS ADICIONALES**

### **Documentación Oficial**
- [Web Push Protocol](https://tools.ietf.org/html/rfc8030)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)

### **Herramientas**
- [PWA Builder](https://www.pwabuilder.com/) - Validador de PWA
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Auditoría de PWA
- [Web Push Tester](https://web-push-codelab.glitch.me/) - Probar push notifications

---

## ✅ **CHECKLIST DE IMPLEMENTACIÓN**

- [x] Manifest.json configurado
- [x] Service Worker implementado
- [x] Estrategias de caché configuradas
- [x] Iconos PWA creados
- [x] VAPID keys generadas
- [x] Tabla push_subscriptions creada
- [x] Backend de push configurado
- [x] Frontend de suscripción implementado
- [x] Integración con sistema de notificaciones
- [x] Componente PushNotificationManager
- [x] Testing de notificaciones
- [x] Documentación completa

---

## 🎉 **¡TODO LISTO!**

Vanguard Calendar ahora es una **PWA completa** con notificaciones push en tiempo real. Los usuarios pueden:

1. ✅ Instalar la app en cualquier dispositivo
2. ✅ Usar la app offline
3. ✅ Recibir notificaciones push instantáneas
4. ✅ Acceder rápidamente con shortcuts

**¡Disfruta de tu aplicación moderna y profesional!** 🚀📱✨

