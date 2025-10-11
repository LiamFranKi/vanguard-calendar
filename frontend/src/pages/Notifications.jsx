import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

function Notifications() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { config } = useConfig();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    } else if (!authLoading && isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, navigate, authLoading, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = filter === 'unread' ? '?unread_only=true' : '';
      const response = await axios.get(`/api/notifications${params}`);
      
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      Swal.fire('Error', 'Error al cargar notificaciones', 'error');
    } finally {
      setLoading(false);
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
      Swal.fire({
        icon: 'success',
        title: 'Todas marcadas como leídas',
        timer: 1500,
        showConfirmButton: false
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
      fetchNotifications();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.leida) {
      handleMarkAsRead(notif.id);
    }
    
    // Redirigir según el tipo
    if (notif.relacionado_tipo === 'tarea' && notif.relacionado_id) {
      navigate(`/tareas?openTask=${notif.relacionado_id}`);
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

    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    
    return notifDate.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (authLoading || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${config.color_primario || '#667eea'}CC 0%, ${config.color_secundario || '#764ba2'}CC 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${config.color_primario || '#667eea'}CC 0%, ${config.color_secundario || '#764ba2'}CC 100%)`,
      position: 'relative'
    }}>
      {/* Navbar */}
      <nav style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        padding: '1rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link to="/dashboard" style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#1f2937'
          }}>
            {config.logo ? (
              <img 
                src={`http://localhost:5000${config.logo}`} 
                alt="Logo" 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  objectFit: 'contain'
                }} 
              />
            ) : (
              <span style={{ fontSize: '2rem' }}>📅</span>
            )}
            <span>{config.nombre_proyecto}</span>
          </Link>
          
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link to="/dashboard" style={{ textDecoration: 'none', color: '#6b7280', fontWeight: '500' }}>Dashboard</Link>
            <Link to="/calendario" style={{ textDecoration: 'none', color: '#6b7280', fontWeight: '500' }}>Calendario</Link>
            <Link to="/eventos" style={{ textDecoration: 'none', color: '#6b7280', fontWeight: '500' }}>Eventos</Link>
            <Link to="/tareas" style={{ textDecoration: 'none', color: '#6b7280', fontWeight: '500' }}>Tareas</Link>
            {user?.rol === 'Administrador' && (
              <>
                <Link to="/users" style={{ textDecoration: 'none', color: '#6b7280', fontWeight: '500' }}>Usuarios</Link>
                <Link to="/settings" style={{ textDecoration: 'none', color: '#6b7280', fontWeight: '500' }}>Configuración</Link>
              </>
            )}
            <Link to="/profile" style={{ textDecoration: 'none', color: '#6b7280', fontWeight: '500' }}>Mi Perfil</Link>
            
            <button 
              onClick={logout} 
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: '#3b82f6',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
              }}
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <div className="container" style={{ padding: '2rem 0' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              color: 'white',
              margin: 0,
              marginBottom: '0.5rem'
            }}>
              🔔 Notificaciones
            </h1>
            <p style={{
              fontSize: '1.1rem',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0
            }}>
              Mantente al día con todas las actualizaciones
            </p>
          </div>

          {/* Filtros y acciones */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* Filtro */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '0.5rem',
              display: 'flex',
              gap: '0.5rem'
            }}>
              <button
                onClick={() => setFilter('all')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: filter === 'all' ? '#3b82f6' : 'transparent',
                  color: filter === 'all' ? 'white' : 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Todas
              </button>
              <button
                onClick={() => setFilter('unread')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: filter === 'unread' ? '#3b82f6' : 'transparent',
                  color: filter === 'unread' ? 'white' : 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                No leídas
              </button>
            </div>

            {/* Marcar todas como leídas */}
            <button
              onClick={handleMarkAllAsRead}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: 'none',
                background: '#3b82f6',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
              }}
            >
              ✓ Marcar todas leídas
            </button>
          </div>
        </div>

        {/* Lista de notificaciones */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '1.5rem'
        }}>
          {notifications.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🔕</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '1.5rem' }}>
                {filter === 'unread' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}
              </h3>
              <p style={{ margin: 0 }}>
                {filter === 'unread' ? '¡Estás al día!' : 'Las notificaciones aparecerán aquí'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    background: notif.leida ? 'rgba(255, 255, 255, 0.95)' : 'rgba(59, 130, 246, 0.15)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    border: notif.leida ? '1px solid rgba(255, 255, 255, 0.3)' : '2px solid #3b82f6',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Indicador de no leída */}
                  {!notif.leida && (
                    <div style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '0.75rem',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#3b82f6',
                      boxShadow: '0 0 10px rgba(59, 130, 246, 0.6)',
                      animation: 'pulse 2s infinite'
                    }} />
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    paddingLeft: notif.leida ? 0 : '1.5rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      {/* Título con icono */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.75rem'
                      }}>
                        <span style={{
                          fontSize: '1.5rem',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                        }}>
                          {getNotificationIcon(notif.tipo)}
                        </span>
                        <h3 style={{
                          margin: 0,
                          fontSize: '1.1rem',
                          fontWeight: '700',
                          color: '#1f2937'
                        }}>
                          {notif.titulo}
                        </h3>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: getNotificationColor(notif.tipo),
                          color: 'white'
                        }}>
                          {notif.tipo}
                        </span>
                      </div>

                      {/* Mensaje */}
                      <p style={{
                        margin: '0 0 1rem 0',
                        color: '#374151',
                        fontSize: '0.95rem',
                        lineHeight: '1.6'
                      }}>
                        {notif.mensaje}
                      </p>

                      {/* Footer */}
                      <div style={{
                        display: 'flex',
                        gap: '1rem',
                        fontSize: '0.85rem',
                        color: '#6b7280'
                      }}>
                        <span>📅 {formatTimeAgo(notif.created_at)}</span>
                        {notif.relacionado_tipo && (
                          <span style={{
                            background: '#f3f4f6',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontWeight: '500'
                          }}>
                            📋 {notif.relacionado_tipo}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botón eliminar */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notif.id);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#9ca3af',
                        cursor: 'pointer',
                        fontSize: '1.5rem',
                        padding: '0.5rem',
                        marginLeft: '1rem',
                        borderRadius: '8px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.color = '#ef4444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#9ca3af';
                      }}
                      title="Eliminar notificación"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notifications;
