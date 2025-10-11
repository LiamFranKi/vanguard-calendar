import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import NotificationBell from '../components/NotificationBell';
import axios from 'axios';

function Dashboard() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const { config } = useConfig();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    tareasPendientes: 0,
    tareasCompletadas: 0,
    eventosProximos: 0,
    notificaciones: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    } else if (!loading && isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStats = async () => {
    try {
      // Obtener tareas
      const tasksResponse = await axios.get('/api/tasks');
      if (tasksResponse.data.success) {
        const tasks = tasksResponse.data.data;
        const pendientes = tasks.filter(t => t.status === 'pendiente' || t.status === 'en_progreso').length;
        const completadas = tasks.filter(t => t.status === 'completada').length;
        
        // Últimas 3 tareas más recientes
        const recent = tasks.slice(0, 3);
        
        setStats(prev => ({
          ...prev,
          tareasPendientes: pendientes,
          tareasCompletadas: completadas
        }));
        
        setRecentTasks(recent);
      }

      // Obtener notificaciones no leídas
      const notifResponse = await axios.get('/api/notifications?unread_only=true');
      if (notifResponse.data.success) {
        setStats(prev => ({
          ...prev,
          notificaciones: notifResponse.data.unread_count
        }));
      }

      // Obtener eventos próximos (próximos 30 días)
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const endDate = futureDate.toISOString().split('T')[0];

      const eventsResponse = await axios.get('/api/calendar/events', {
        params: {
          start_date: today,
          end_date: endDate,
          type: 'events'
        }
      });

      if (eventsResponse.data.success) {
        const events = eventsResponse.data.data;
        setStats(prev => ({
          ...prev,
          eventosProximos: events.length
        }));
        
        // Solo los 2 primeros eventos próximos (ordenados por fecha)
        setUpcomingEvents(events.slice(0, 2));
      }
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
    }
  };

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  // Si no está autenticado, mostrar loading (será redirigido)
  if (!isAuthenticated) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 19) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${config.color_primario || '#667eea'}CC 0%, ${config.color_secundario || '#764ba2'}CC 100%)`,
      position: 'relative'
    }}>
      {/* Navbar moderna */}
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
            <Link to="/dashboard" style={{ textDecoration: 'none', color: '#1f2937', fontWeight: '500' }}>Dashboard</Link>
            <Link to="/calendario" style={{ textDecoration: 'none', color: '#6b7280', fontWeight: '500' }}>Calendario</Link>
            <Link to="/eventos" style={{ textDecoration: 'none', color: '#6b7280', fontWeight: '500' }}>Eventos</Link>
            <Link to="/tareas" style={{ textDecoration: 'none', color: '#6b7280', fontWeight: '500' }}>Tareas</Link>
            <Link to="/reportes" style={{ textDecoration: 'none', color: '#6b7280', fontWeight: '500' }}>Reportes</Link>
            {user?.rol === 'administrador' && (
              <>
                <Link to="/users" style={{ textDecoration: 'none', color: '#6b7280', fontWeight: '500' }}>Usuarios</Link>
                <Link to="/settings" style={{ textDecoration: 'none', color: '#6b7280', fontWeight: '500' }}>Configuración</Link>
              </>
            )}
            {/* Iconos de acción agrupados */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem' }}>
              <button 
                onClick={() => navigate('/profile')}
                style={{ 
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  padding: 0
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                title="Mi Perfil"
              >
                👤
              </button>
              
              {/* Campana de notificaciones */}
              <NotificationBell />

              <button 
                onClick={handleLogout} 
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  padding: 0
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                title="Cerrar Sesión"
              >
                🚀
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main style={{ padding: '3rem 0' }}>
        <div className="container">
          {/* Header con saludo y fecha */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '2.5rem',
            marginBottom: '2rem',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: `4px solid ${config.color_primario || '#667eea'}`,
                boxShadow: `0 10px 30px ${config.color_primario || '#667eea'}40`,
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {user?.avatar ? (
                  <img 
                    src={`http://localhost:5000${user.avatar}`} 
                    alt={user.nombres}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '4rem' }}>👤</span>
                )}
              </div>
              
              <div>
                <h1 style={{ 
                  margin: 0, 
                  fontSize: '2.5rem', 
                  background: `linear-gradient(135deg, ${config.color_primario || '#667eea'}, ${config.color_secundario || '#764ba2'})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: '800',
                  letterSpacing: '-0.02em'
                }}>
                  {getGreeting()}, {user?.nombres}!
                </h1>
                <p style={{ 
                  margin: '0.5rem 0', 
                  fontSize: '1.1rem',
                  color: '#6b7280'
                }}>
                  {formatDate(currentTime)}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.75rem' }}>
                  <span style={{ 
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    background: user?.rol === 'administrador' 
                      ? 'linear-gradient(135deg, #f87171, #dc2626)' 
                      : user?.rol === 'docente' 
                      ? 'linear-gradient(135deg, #60a5fa, #2563eb)' 
                      : 'linear-gradient(135deg, #34d399, #059669)',
                    color: 'white',
                    textTransform: 'capitalize',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                  }}>
                    {user?.rol || 'Usuario'}
                  </span>
                </div>
              </div>
            </div>
            
            <div style={{ 
              textAlign: 'right',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '0.5rem'
            }}>
              <div style={{ 
                fontSize: '3rem', 
                fontWeight: '700',
                background: `linear-gradient(135deg, ${config.color_primario || '#667eea'}, ${config.color_secundario || '#764ba2'})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em'
              }}>
                {formatTime(currentTime)}
              </div>
              <div style={{ 
                fontSize: '1rem',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                Hora actual
              </div>
            </div>
          </div>

          {/* Cards de estadísticas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {[
              { icon: '📅', label: 'Eventos Próximos', value: stats.eventosProximos, gradient: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#667eea' },
              { icon: '✅', label: 'Tareas Completadas', value: stats.tareasCompletadas, gradient: 'linear-gradient(135deg, #34d399, #059669)', color: '#10b981' },
              { icon: '⏰', label: 'Tareas Pendientes', value: stats.tareasPendientes, gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#f59e0b' },
              { icon: '🔔', label: 'Notificaciones', value: stats.notificaciones, gradient: 'linear-gradient(135deg, #60a5fa, #2563eb)', color: '#3b82f6' }
            ].map((stat, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                transition: 'transform 0.3s, box-shadow 0.3s',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.1)';
              }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  right: '-20%',
                  width: '200px',
                  height: '200px',
                  background: stat.gradient,
                  borderRadius: '50%',
                  opacity: '0.1',
                  filter: 'blur(40px)'
                }} />
                
                <div style={{ 
                  fontSize: '3rem', 
                  marginBottom: '1rem',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {stat.icon}
                </div>
                <h3 style={{ 
                  fontSize: '3rem', 
                  fontWeight: '800',
                  margin: '0.5rem 0',
                  background: stat.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {stat.value}
                </h3>
                <p style={{ 
                  color: '#6b7280', 
                  fontSize: '1rem',
                  fontWeight: '500',
                  margin: 0,
                  position: 'relative',
                  zIndex: 1
                }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Sección de contenido */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            {/* Próximos eventos */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '2rem',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#1f2937'
                }}>
                  📅 Próximos Eventos
                </h2>
                <Link to="/eventos" style={{ 
                  color: config.color_primario || '#667eea',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}>
                  Ver todos →
                </Link>
              </div>
              {upcomingEvents.length === 0 ? (
                <div style={{
                  padding: '3rem',
                  textAlign: 'center',
                  color: '#9ca3af',
                  background: 'rgba(249, 250, 251, 0.5)',
                  borderRadius: '12px',
                  border: '2px dashed #e5e7eb'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                  <p style={{ margin: 0, fontSize: '1.1rem' }}>No hay eventos próximos</p>
                  <Link to="/calendario" style={{
                    display: 'inline-block',
                    marginTop: '1rem',
                    padding: '0.75rem 1.5rem',
                    background: '#3b82f6',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    Crear evento
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {upcomingEvents.map(event => (
                    <Link
                      key={event.id}
                      to="/calendario"
                      style={{
                        textDecoration: 'none',
                        display: 'block',
                        padding: '1rem',
                        background: event.color ? `${event.color}15` : '#f0fdf4',
                        borderLeft: `4px solid ${event.color || '#22c55e'}`,
                        borderRadius: '8px',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>🎉</span>
                          <h4 style={{ margin: 0, color: '#1f2937', fontSize: '1rem', fontWeight: '600' }}>
                            {event.title}
                          </h4>
                        </div>
                        {event.todo_el_dia && (
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6',
                            borderRadius: '12px',
                            fontWeight: '600'
                          }}>
                            Todo el día
                          </span>
                        )}
                      </div>
                      {event.description && (
                        <p style={{
                          margin: '0 0 0.5rem 0',
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {event.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#9ca3af' }}>
                        <span>📅 {new Date(event.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {event.ubicacion && <span>📍 {event.ubicacion}</span>}
                        {event.attendees && event.attendees.length > 0 && (
                          <span>👥 {event.attendees.length} asistente{event.attendees.length > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Tareas recientes */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '2rem',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#1f2937'
                }}>
                  ✅ Tareas Recientes
                </h2>
                <Link to="/tareas" style={{ 
                  color: config.color_primario || '#667eea',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}>
                  Ver todas →
                </Link>
              </div>
              {recentTasks.length === 0 ? (
                <div style={{
                  padding: '3rem',
                  textAlign: 'center',
                  color: '#9ca3af',
                  background: 'rgba(249, 250, 251, 0.5)',
                  borderRadius: '12px',
                  border: '2px dashed #e5e7eb'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                  <p style={{ margin: 0, fontSize: '1.1rem' }}>No hay tareas registradas</p>
                  <Link to="/tareas" style={{
                    display: 'inline-block',
                    marginTop: '1rem',
                    padding: '0.75rem 1.5rem',
                    background: '#3b82f6',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    Crear tarea
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {recentTasks.map(task => (
                    <Link 
                      key={task.id}
                      to="/tareas"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        background: 'rgba(249, 250, 251, 0.8)',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        border: '1px solid #e5e7eb',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                        e.currentTarget.style.transform = 'translateX(5px)';
                        e.currentTarget.style.borderColor = '#3b82f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(249, 250, 251, 0.8)';
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: '600', 
                          color: '#1f2937',
                          marginBottom: '0.25rem',
                          fontSize: '0.95rem'
                        }}>
                          {task.title}
                        </div>
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: '#6b7280',
                          display: 'flex',
                          gap: '0.75rem',
                          alignItems: 'center',
                          flexWrap: 'wrap'
                        }}>
                          {task.project_name && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: task.project_color || '#6b7280',
                                display: 'inline-block'
                              }} />
                              {task.project_name}
                            </span>
                          )}
                          {task.due_date && (
                            <span>📅 {new Date(task.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                          )}
                          {task.assignee_count > 0 && (
                            <span>👥 {task.assignee_count}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: task.status === 'completada' ? '#22c55e' : 
                                     task.status === 'en_progreso' ? '#3b82f6' : 
                                     task.status === 'cancelada' ? '#ef4444' : '#6b7280',
                          color: 'white'
                        }}>
                          {task.status === 'completada' ? '✅' : 
                           task.status === 'en_progreso' ? '🔄' : 
                           task.status === 'cancelada' ? '❌' : '⏳'}
                        </span>
                        {task.priority === 'urgente' && <span style={{ fontSize: '1.2rem' }}>🔥</span>}
                        {task.priority === 'alta' && <span style={{ fontSize: '1.2rem' }}>🔴</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Accesos rápidos */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '2.5rem',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              marginBottom: '1.5rem',
              fontSize: '1.75rem',
              fontWeight: '700',
              color: '#1f2937'
            }}>
              🚀 Accesos Rápidos
            </h2>
            <p style={{ 
              color: '#6b7280', 
              marginBottom: '2rem',
              fontSize: '1.1rem'
            }}>
              Accede rápidamente a las funciones principales del sistema
            </p>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              {[
                { to: '/calendario', icon: '📅', label: 'Ver Calendario', color: '#667eea' },
                { to: '/eventos', icon: '🎯', label: 'Gestionar Eventos', color: '#f59e0b' },
                { to: '/tareas', icon: '✅', label: 'Gestionar Tareas', color: '#10b981' },
                { to: '/reportes', icon: '📊', label: 'Generar Reportes', color: '#8b5cf6' }
              ].map((item, index) => (
                <Link 
                  key={index}
                  to={item.to} 
                  style={{
                    padding: '1.5rem',
                    background: 'white',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    color: '#1f2937',
                    fontWeight: '600',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s',
                    border: '2px solid transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
                    e.currentTarget.style.borderColor = item.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div style={{ fontSize: '2.5rem' }}>{item.icon}</div>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;


