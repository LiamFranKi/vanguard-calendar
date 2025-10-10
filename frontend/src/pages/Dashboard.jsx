import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
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
        
        setStats(prev => ({
          ...prev,
          tareasPendientes: pendientes,
          tareasCompletadas: completadas
        }));
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
            {user?.rol === 'administrador' && (
              <>
                <Link to="/users" style={{ textDecoration: 'none', color: '#6b7280', fontWeight: '500' }}>Usuarios</Link>
                <Link to="/settings" style={{ textDecoration: 'none', color: '#6b7280', fontWeight: '500' }}>Configuración</Link>
              </>
            )}
            <Link to="/profile" style={{ textDecoration: 'none', color: '#6b7280', fontWeight: '500' }}>Mi Perfil</Link>
            
              <button 
                onClick={handleLogout} 
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
              <div style={{
                padding: '3rem',
                textAlign: 'center',
                color: '#9ca3af',
                background: 'rgba(249, 250, 251, 0.5)',
                borderRadius: '12px',
                border: '2px dashed #e5e7eb'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <p style={{ margin: 0, fontSize: '1.1rem' }}>No hay eventos programados</p>
                <Link to="/eventos" style={{
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


