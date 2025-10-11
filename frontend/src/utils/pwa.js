// Registro y gestión del Service Worker y Push Notifications

/**
 * Registrar el Service Worker
 */
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      console.log('[PWA] Service Worker registrado exitosamente:', registration.scope);

      // Verificar actualizaciones periódicamente
      setInterval(() => {
        registration.update();
      }, 60000); // Cada minuto

      // Manejar actualizaciones del Service Worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Hay una nueva versión disponible
            console.log('[PWA] Nueva versión disponible');
            
            // Mostrar notificación de actualización
            if (window.confirm('Nueva versión disponible. ¿Deseas actualizar?')) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
        });
      });

      return registration;
    } catch (error) {
      console.error('[PWA] Error al registrar Service Worker:', error);
      return null;
    }
  } else {
    console.warn('[PWA] Service Workers no soportados en este navegador');
    return null;
  }
};

/**
 * Desregistrar el Service Worker
 */
export const unregisterServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      console.log('[PWA] Service Worker desregistrado');
      return true;
    } catch (error) {
      console.error('[PWA] Error al desregistrar Service Worker:', error);
      return false;
    }
  }
  return false;
};

/**
 * Verificar si las notificaciones push están soportadas
 */
export const isPushNotificationSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

/**
 * Solicitar permiso para notificaciones
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('[PWA] Este navegador no soporta notificaciones');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[PWA] Permiso de notificaciones:', permission);
    return permission === 'granted';
  } catch (error) {
    console.error('[PWA] Error al solicitar permiso de notificaciones:', error);
    return false;
  }
};

/**
 * Obtener el estado del permiso de notificaciones
 */
export const getNotificationPermission = () => {
  if (!('Notification' in window)) {
    return 'not-supported';
  }
  return Notification.permission;
};

/**
 * Suscribirse a notificaciones push
 */
export const subscribeToPushNotifications = async (vapidPublicKey) => {
  if (!isPushNotificationSupported()) {
    console.warn('[PWA] Push Notifications no soportadas');
    return null;
  }

  try {
    // Obtener el Service Worker
    const registration = await navigator.serviceWorker.ready;

    // Verificar si ya existe una suscripción
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Crear nueva suscripción
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      
      console.log('[PWA] Nueva suscripción a push notifications creada');
    } else {
      console.log('[PWA] Suscripción existente encontrada');
    }

    return subscription;
  } catch (error) {
    console.error('[PWA] Error al suscribirse a push notifications:', error);
    return null;
  }
};

/**
 * Desuscribirse de notificaciones push
 */
export const unsubscribeFromPushNotifications = async () => {
  if (!isPushNotificationSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('[PWA] Desuscrito de push notifications');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[PWA] Error al desuscribirse de push notifications:', error);
    return false;
  }
};

/**
 * Obtener la suscripción actual de push
 */
export const getCurrentPushSubscription = async () => {
  if (!isPushNotificationSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('[PWA] Error al obtener suscripción:', error);
    return null;
  }
};

/**
 * Verificar si el usuario está suscrito a push notifications
 */
export const isPushSubscribed = async () => {
  const subscription = await getCurrentPushSubscription();
  return subscription !== null;
};

/**
 * Mostrar una notificación local (sin push)
 */
export const showLocalNotification = async (title, options = {}) => {
  if (!('Notification' in window)) {
    console.warn('[PWA] Notificaciones no soportadas');
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.warn('[PWA] Permiso de notificaciones no concedido');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification(title, {
      body: options.body || '',
      icon: options.icon || '/icon-192x192.png',
      badge: options.badge || '/icon-96x96.png',
      tag: options.tag || 'default',
      requireInteraction: options.requireInteraction || false,
      data: options.data || {},
      actions: options.actions || [],
      vibrate: options.vibrate || [200, 100, 200],
      timestamp: options.timestamp || Date.now()
    });

    console.log('[PWA] Notificación local mostrada');
    return true;
  } catch (error) {
    console.error('[PWA] Error al mostrar notificación:', error);
    return false;
  }
};

/**
 * Convertir clave VAPID de base64 a Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Verificar si la aplicación está instalada como PWA
 */
export const isStandalone = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
};

/**
 * Detectar si es iOS
 */
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

/**
 * Verificar si puede instalar PWA
 */
export const canInstallPWA = () => {
  return 'beforeinstallprompt' in window;
};

/**
 * Mostrar prompt de instalación
 */
let deferredPrompt = null;

export const setupInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('[PWA] Evento de instalación capturado');
    
    // Disparar evento personalizado
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  });
};

export const showInstallPrompt = async () => {
  if (!deferredPrompt) {
    console.warn('[PWA] No hay prompt de instalación disponible');
    return false;
  }

  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Resultado de instalación:', outcome);
    
    deferredPrompt = null;
    return outcome === 'accepted';
  } catch (error) {
    console.error('[PWA] Error al mostrar prompt de instalación:', error);
    return false;
  }
};

/**
 * Manejar evento de instalación completada
 */
export const setupInstallListener = (callback) => {
  window.addEventListener('appinstalled', (e) => {
    console.log('[PWA] Aplicación instalada');
    if (callback) callback(e);
  });
};

