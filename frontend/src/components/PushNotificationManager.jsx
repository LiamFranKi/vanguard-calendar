import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl, getServerUrl } from '../config/constants';
import {
  isPushNotificationSupported,
  requestNotificationPermission,
  getNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushSubscribed
} from '../utils/pwa';

const PushNotificationManager = () => {
  const { token } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSupport();
    checkSubscription();
  }, []);

  const checkSupport = () => {
    const supported = isPushNotificationSupported();
    setIsSupported(supported);
    setPermission(getNotificationPermission());
  };

  const checkSubscription = async () => {
    try {
      const subscribed = await isPushSubscribed();
      setIsSubscribed(subscribed);
    } catch (error) {
      console.error('Error al verificar suscripción:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setLoading(true);

      // Solicitar permiso
      const granted = await requestNotificationPermission();
      if (!granted) {
        Swal.fire({
          icon: 'warning',
          title: 'Permiso Denegado',
          text: 'Debes permitir las notificaciones para suscribirte.',
          confirmButtonColor: '#3b82f6'
        });
        setLoading(false);
        return;
      }

      // Obtener clave pública VAPID
      const vapidResponse = await axios.get(`${getServerUrl()}/api/push/vapid-public-key`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!vapidResponse.data.success || !vapidResponse.data.publicKey) {
        throw new Error('No se pudo obtener la clave VAPID');
      }

      // Suscribirse a push notifications
      const subscription = await subscribeToPushNotifications(vapidResponse.data.publicKey);
      
      if (!subscription) {
        throw new Error('No se pudo crear la suscripción');
      }

      // Enviar suscripción al backend
      await axios.post(`${getServerUrl()}/api/push/subscribe`, 
        { subscription },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setIsSubscribed(true);
      setPermission('granted');

      Swal.fire({
        icon: 'success',
        title: '¡Suscrito!',
        text: 'Te enviaremos notificaciones push cuando haya actualizaciones.',
        confirmButtonColor: '#3b82f6'
      });
    } catch (error) {
      console.error('Error al suscribirse:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo completar la suscripción. Inténtalo de nuevo.',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setLoading(true);

      const result = await Swal.fire({
        title: '¿Desuscribirse?',
        text: 'Ya no recibirás notificaciones push.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, desuscribir',
        cancelButtonText: 'Cancelar'
      });

      if (!result.isConfirmed) {
        setLoading(false);
        return;
      }

      // Desuscribirse
      const unsubscribed = await unsubscribeFromPushNotifications();
      
      if (unsubscribed) {
        // Notificar al backend (opcional, pero recomendado)
        const subscription = await navigator.serviceWorker.ready
          .then(reg => reg.pushManager.getSubscription());
        
        if (subscription) {
          await axios.post(`${getServerUrl()}/api/push/unsubscribe`,
            { endpoint: subscription.endpoint },
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
        }

        setIsSubscribed(false);

        Swal.fire({
          icon: 'success',
          title: 'Desuscrito',
          text: 'Ya no recibirás notificaciones push.',
          confirmButtonColor: '#3b82f6'
        });
      }
    } catch (error) {
      console.error('Error al desuscribirse:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo completar la desuscripción.',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      setLoading(true);

      await axios.post(`${getServerUrl()}/api/push/test`, 
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      Swal.fire({
        icon: 'success',
        title: '¡Enviado!',
        text: 'Deberías recibir una notificación de prueba en breve.',
        confirmButtonColor: '#3b82f6'
      });
    } catch (error) {
      console.error('Error al enviar notificación de prueba:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'No se pudo enviar la notificación de prueba.',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#fef3c7',
        borderRadius: '0.5rem',
        border: '1px solid #fbbf24'
      }}>
        <p style={{ margin: 0, color: '#92400e' }}>
          ⚠️ Tu navegador no soporta notificaciones push
        </p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '1.5rem',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      borderRadius: '1rem',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <h3 style={{ marginTop: 0, color: '#fff' }}>📱 Notificaciones Push</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
          Estado: {isSubscribed ? '✅ Suscrito' : '⭕ No suscrito'}
        </p>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
          Permiso: {permission === 'granted' ? '✅ Concedido' : permission === 'denied' ? '❌ Denegado' : '⏳ Pendiente'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {!isSubscribed ? (
          <button
            onClick={handleSubscribe}
            disabled={loading || permission === 'denied'}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: loading || permission === 'denied' ? 'not-allowed' : 'pointer',
              opacity: loading || permission === 'denied' ? 0.5 : 1,
              fontWeight: '500'
            }}
          >
            {loading ? 'Cargando...' : '🔔 Activar Notificaciones'}
          </button>
        ) : (
          <>
            <button
              onClick={handleUnsubscribe}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6b7280',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                fontWeight: '500'
              }}
            >
              {loading ? 'Cargando...' : '🔕 Desactivar'}
            </button>
            <button
              onClick={handleTestNotification}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#764ba2',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                fontWeight: '500'
              }}
            >
              {loading ? 'Enviando...' : '🧪 Probar'}
            </button>
          </>
        )}
      </div>

      {permission === 'denied' && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '0.5rem',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          <p style={{ margin: 0, color: '#fca5a5', fontSize: '0.875rem' }}>
            ⚠️ Has denegado el permiso de notificaciones. Para activarlas, debes cambiar la configuración de tu navegador.
          </p>
        </div>
      )}
    </div>
  );
};

export default PushNotificationManager;

