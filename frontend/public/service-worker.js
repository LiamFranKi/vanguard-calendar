/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'vanguard-calendar-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Archivos en caché');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[Service Worker] Error al cachear archivos:', error);
      })
  );
  
  // Activar inmediatamente el nuevo service worker
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Tomar control inmediato de todas las páginas
  return self.clients.claim();
});

// Estrategia de caché: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
  // Solo cachear peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar peticiones a la API (siempre usar red)
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Ignorar peticiones a otros dominios
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, guardarla en caché
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar obtener de caché
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Si no está en caché y es una navegación, devolver index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          
          return new Response('Offline - Recurso no disponible', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
});

// Manejo de Push Notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push recibido:', event);
  
  let data = {
    title: 'Vanguard Calendar',
    body: 'Nueva notificación',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    tag: 'default',
    requireInteraction: false
  };

  if (event.data) {
    try {
      data = event.data.json();
      console.log('[Service Worker] Datos recibidos:', data);
    } catch (e) {
      console.log('[Service Worker] Error al parsear datos:', e);
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || data.mensaje || 'Nueva notificación',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-96x96.png',
    tag: data.tag || data.relacionado_id || 'default',
    requireInteraction: data.requireInteraction || false,
    data: {
      url: data.url || '/',
      relacionado_tipo: data.relacionado_tipo,
      relacionado_id: data.relacionado_id,
      notificacion_id: data.notificacion_id
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icon-96x96.png'
      }
    ],
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  };

  console.log('[Service Worker] Mostrando notificación con opciones:', options);

  event.waitUntil(
    self.registration.showNotification(data.title || data.titulo || 'Vanguard Calendar', options)
      .then(() => {
        console.log('[Service Worker] Notificación mostrada exitosamente');
      })
      .catch((error) => {
        console.error('[Service Worker] Error al mostrar notificación:', error);
      })
  );
});

// Manejo de clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notificación clickeada:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Obtener la URL de destino
  let urlToOpen = '/dashboard';
  
  if (event.notification.data) {
    const { relacionado_tipo, relacionado_id } = event.notification.data;
    
    if (relacionado_tipo === 'tarea') {
      urlToOpen = `/tareas?id=${relacionado_id}`;
    } else if (relacionado_tipo === 'evento') {
      urlToOpen = `/calendario?id=${relacionado_id}`;
    } else if (event.notification.data.url) {
      urlToOpen = event.notification.data.url;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si ya hay una ventana abierta, enfocarla
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => {
              return client.navigate(urlToOpen);
            });
          }
        }
        
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Manejo de cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notificación cerrada:', event);
});

// Manejo de sincronización en segundo plano
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Sincronización en segundo plano:', event);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(
      // Aquí podrías sincronizar notificaciones pendientes
      Promise.resolve()
    );
  }
});

// Manejo de mensajes desde el cliente
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Mensaje recibido:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

