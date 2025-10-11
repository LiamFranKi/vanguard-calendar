import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Cerrar dropdown al hacer click fuera
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications?limit=10');
      if (response.data.success) {
        setNotifications(response.data.data);
        setUnreadCount(response.data.unread_count);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      fetchNotifications();
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
      fetchNotifications();
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
    }
  };

  const getNotificationIcon = (tipo) => {
    switch (tipo) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '💬';
    }
  };

  const getNotificationColor = (tipo) => {
    switch (tipo) {
      case 'success': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffInMinutes = Math.floor((now - notifDate) / 60000);

    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Hace ${diffInDays}d`;
    
    return notifDate.toLocaleDateString('es-ES');
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Botón de campana */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: 'relative',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.5rem',
          padding: '0.5rem',
          borderRadius: '8px',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0.25rem',
            right: '0.25rem',
            background: '#ef4444',
            color: 'white',
            borderRadius: '10px',
            padding: '0.125rem 0.4rem',
            fontSize: '0.7rem',
            fontWeight: '700',
            minWidth: '18px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          width: '380px',
          maxHeight: '500px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e5e7eb',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f9fafb'
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#1f2937' }}>
              🔔 Notificaciones
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#3b82f6',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          {/* Lista de notificaciones */}
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '3rem 1rem',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔕</div>
                <p style={{ margin: 0 }}>No tienes notificaciones</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.leida) handleMarkAsRead(notif.id);
                    // Redirigir según el tipo de notificación
                    if (notif.relacionado_tipo === 'tarea' && notif.relacionado_id) {
                      window.location.href = `/tareas?openTask=${notif.relacionado_id}`;
                    }
                  }}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #f3f4f6',
                    background: notif.leida ? 'white' : 'rgba(59, 130, 246, 0.05)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = notif.leida ? '#f9fafb' : 'rgba(59, 130, 246, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notif.leida ? 'white' : 'rgba(59, 130, 246, 0.05)';
                  }}
                >
                  {/* Indicador de no leída */}
                  {!notif.leida && (
                    <div style={{
                      position: 'absolute',
                      left: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#3b82f6'
                    }} />
                  )}

                  <div style={{ paddingLeft: notif.leida ? 0 : '1rem' }}>
                    {/* Título con icono */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.25rem'
                    }}>
                      <div style={{
                        fontWeight: '600',
                        color: '#1f2937',
                        fontSize: '0.9rem',
                        flex: 1
                      }}>
                        <span style={{ marginRight: '0.25rem' }}>
                          {getNotificationIcon(notif.tipo)}
                        </span>
                        {notif.titulo}
                      </div>
                      <button
                        onClick={(e) => handleDeleteNotification(notif.id, e)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#9ca3af',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          padding: '0.25rem',
                          marginLeft: '0.5rem'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Mensaje */}
                    <p style={{
                      margin: '0 0 0.5rem 0',
                      color: '#6b7280',
                      fontSize: '0.85rem',
                      lineHeight: '1.4'
                    }}>
                      {notif.mensaje}
                    </p>

                    {/* Footer con tiempo */}
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>{formatTimeAgo(notif.created_at)}</span>
                      {notif.relacionado_tipo && (
                        <span style={{
                          background: '#f3f4f6',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '10px',
                          fontSize: '0.7rem',
                          color: '#6b7280'
                        }}>
                          {notif.relacionado_tipo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '0.75rem',
              borderTop: '1px solid #e5e7eb',
              textAlign: 'center',
              background: '#f9fafb'
            }}>
              <Link
                to="/notificaciones"
                style={{
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}
                onClick={() => setShowDropdown(false)}
              >
                Ver todas las notificaciones →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
