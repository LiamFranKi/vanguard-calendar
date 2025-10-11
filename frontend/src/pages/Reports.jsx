import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import axios from 'axios';
import Swal from 'sweetalert2';
import NotificationBell from '../components/NotificationBell';

// Configurar axios
axios.defaults.baseURL = 'http://localhost:5000';
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function Reports() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { config } = useConfig();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [productivity, setProductivity] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // general, productivity, timeline

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    } else if (!authLoading && isAuthenticated) {
      fetchStats();
      fetchProductivity();
      fetchTimeline();
    }
  }, [isAuthenticated, navigate, authLoading]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/reports/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductivity = async () => {
    try {
      const response = await axios.get('/api/reports/productivity');
      if (response.data.success) {
        setProductivity(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar productividad:', error);
    }
  };

  const fetchTimeline = async () => {
    try {
      const response = await axios.get('/api/reports/timeline?limit=20');
      if (response.data.success) {
        setTimeline(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar timeline:', error);
    }
  };

  const handleExport = async (type) => {
    try {
      const response = await axios.get(`/api/reports/export/csv?type=${type}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_${type}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      Swal.fire('¡Descargado!', 'Reporte exportado exitosamente', 'success');
    } catch (error) {
      console.error('Error al exportar:', error);
      Swal.fire('Error', 'Error al exportar reporte', 'error');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid rgba(255, 255, 255, 0.3)',
          borderTop: '5px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  const getActionText = (action) => {
    const actions = {
      'created': '➕ Creó',
      'updated': '✏️ Actualizó',
      'commented': '💬 Comentó en',
      'completed': '✅ Completó',
      'assigned': '👥 Asignó'
    };
    return actions[action] || action;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '0'
    }}>
      {/* Navbar */}
      <nav style={{
        background: 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {config.logo && (
            <img
              src={`http://localhost:5000${config.logo}`}
              alt={config.nombre_proyecto}
              style={{ height: '40px' }}
            />
          )}
          <h1 style={{ margin: 0, color: 'white', fontSize: '1.5rem', fontWeight: '700' }}>
            {config.nombre_proyecto || 'Vanguard Calendar'}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/dashboard" style={{ textDecoration: 'none', color: '#e5e7eb', fontWeight: '500' }}>Dashboard</Link>
          <Link to="/tareas" style={{ textDecoration: 'none', color: '#e5e7eb', fontWeight: '500' }}>Tareas</Link>
          <Link to="/calendario" style={{ textDecoration: 'none', color: '#e5e7eb', fontWeight: '500' }}>Calendario</Link>
          <Link to="/eventos" style={{ textDecoration: 'none', color: '#e5e7eb', fontWeight: '500' }}>Eventos</Link>
          <Link to="/reportes" style={{ textDecoration: 'none', color: 'white', fontWeight: '600', borderBottom: '2px solid white', paddingBottom: '0.25rem' }}>Reportes</Link>
          {user?.rol === 'Administrador' && (
            <>
              <Link to="/users" style={{ textDecoration: 'none', color: '#e5e7eb', fontWeight: '500' }}>Usuarios</Link>
              <Link to="/settings" style={{ textDecoration: 'none', color: '#e5e7eb', fontWeight: '500' }}>Configuración</Link>
            </>
          )}
          <Link to="/profile" style={{ textDecoration: 'none', color: '#e5e7eb', fontWeight: '500' }}>Mi Perfil</Link>
          
          <NotificationBell />

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
          >
            Salir
          </button>
        </div>
      </nav>

      {/* Contenido principal */}
      <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '2rem', fontWeight: '700' }}>
                📊 Reportes y Analytics
              </h2>
              <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)' }}>
                Visualiza el rendimiento y estadísticas del sistema
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleExport('tasks')}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#22c55e',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                📥 Exportar Tareas
              </button>
              <button
                type="button"
                onClick={() => handleExport('events')}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#8b5cf6',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                📥 Exportar Eventos
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
            {[
              { id: 'general', label: '📊 General', icon: '📊' },
              { id: 'productivity', label: '👥 Productividad', icon: '👥' },
              { id: 'timeline', label: '📜 Timeline', icon: '📜' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === tab.id ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)',
                  color: activeTab === tab.id ? '#1f2937' : 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido según tab activo */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'white',
            fontSize: '1.2rem'
          }}>
            Cargando reportes...
          </div>
        ) : (
          <>
            {/* Tab General */}
            {activeTab === 'general' && stats && (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Cards de resumen */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  {/* Total Tareas */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#3b82f6', marginBottom: '0.25rem' }}>
                      {stats.tasks.total_tareas}
                    </div>
                    <div style={{ color: '#6b7280', fontWeight: '600' }}>Total Tareas</div>
                  </div>

                  {/* Total Eventos */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#22c55e', marginBottom: '0.25rem' }}>
                      {stats.events.total_eventos}
                    </div>
                    <div style={{ color: '#6b7280', fontWeight: '600' }}>Total Eventos</div>
                  </div>

                  {/* Total Usuarios */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👥</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#8b5cf6', marginBottom: '0.25rem' }}>
                      {stats.users.total_usuarios}
                    </div>
                    <div style={{ color: '#6b7280', fontWeight: '600' }}>Total Usuarios</div>
                  </div>

                  {/* Progreso Promedio */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📈</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#f59e0b', marginBottom: '0.25rem' }}>
                      {Math.round(stats.tasks.promedio_progreso || 0)}%
                    </div>
                    <div style={{ color: '#6b7280', fontWeight: '600' }}>Progreso Promedio</div>
                  </div>
                </div>

                {/* Gráficos */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {/* Tareas por Estado */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.2rem' }}>
                      📊 Tareas por Estado
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {[
                        { label: 'Completadas', value: stats.tasks.tareas_completadas, color: '#22c55e', icon: '✅' },
                        { label: 'En Progreso', value: stats.tasks.tareas_en_progreso, color: '#3b82f6', icon: '🔄' },
                        { label: 'Pendientes', value: stats.tasks.tareas_pendientes, color: '#f59e0b', icon: '⏳' },
                        { label: 'Canceladas', value: stats.tasks.tareas_canceladas, color: '#ef4444', icon: '❌' }
                      ].map((item, idx) => {
                        const percentage = stats.tasks.total_tareas > 0 
                          ? (item.value / stats.tasks.total_tareas * 100).toFixed(1)
                          : 0;
                        
                        return (
                          <div key={idx}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <span style={{ fontWeight: '600', color: '#374151' }}>
                                {item.icon} {item.label}
                              </span>
                              <span style={{ fontWeight: '700', color: item.color }}>
                                {item.value} ({percentage}%)
                              </span>
                            </div>
                            <div style={{
                              width: '100%',
                              height: '8px',
                              background: '#e5e7eb',
                              borderRadius: '10px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${percentage}%`,
                                height: '100%',
                                background: item.color,
                                transition: 'width 0.5s ease'
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tareas por Prioridad */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.2rem' }}>
                      🎯 Tareas por Prioridad
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {[
                        { label: 'Urgente', value: stats.tasks.tareas_urgentes, color: '#dc2626', icon: '🔥' },
                        { label: 'Alta', value: stats.tasks.tareas_alta, color: '#f59e0b', icon: '🔴' },
                        { label: 'Media', value: stats.tasks.tareas_media, color: '#eab308', icon: '🟡' },
                        { label: 'Baja', value: stats.tasks.tareas_baja, color: '#6b7280', icon: '⚪' }
                      ].map((item, idx) => {
                        const percentage = stats.tasks.total_tareas > 0 
                          ? (item.value / stats.tasks.total_tareas * 100).toFixed(1)
                          : 0;
                        
                        return (
                          <div key={idx}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <span style={{ fontWeight: '600', color: '#374151' }}>
                                {item.icon} {item.label}
                              </span>
                              <span style={{ fontWeight: '700', color: item.color }}>
                                {item.value} ({percentage}%)
                              </span>
                            </div>
                            <div style={{
                              width: '100%',
                              height: '8px',
                              background: '#e5e7eb',
                              borderRadius: '10px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${percentage}%`,
                                height: '100%',
                                background: item.color,
                                transition: 'width 0.5s ease'
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Tareas por Proyecto */}
                {stats.tasksByProject && stats.tasksByProject.length > 0 && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.2rem' }}>
                      📁 Tareas por Proyecto
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      {stats.tasksByProject.map((project, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: `${project.color}15`,
                            borderLeft: `4px solid ${project.color}`,
                            borderRadius: '8px',
                            padding: '1rem',
                            textAlign: 'center'
                          }}
                        >
                          <div style={{ fontSize: '2rem', fontWeight: '700', color: project.color, marginBottom: '0.25rem' }}>
                            {project.cantidad}
                          </div>
                          <div style={{ color: '#6b7280', fontWeight: '600', fontSize: '0.9rem' }}>
                            {project.proyecto}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab Productividad */}
            {activeTab === 'productivity' && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.2rem' }}>
                  👥 Productividad por Usuario
                </h3>
                
                {productivity.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    No hay datos de productividad
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {productivity.map((user, idx) => (
                      <div
                        key={user.id}
                        style={{
                          background: '#f9fafb',
                          borderRadius: '10px',
                          padding: '1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          border: idx === 0 ? '2px solid #f59e0b' : '1px solid #e5e7eb'
                        }}
                      >
                        {/* Ranking */}
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: idx === 0 ? '#f59e0b' : idx === 1 ? '#d1d5db' : idx === 2 ? '#cd7f32' : '#e5e7eb',
                          color: idx < 3 ? 'white' : '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '1.1rem'
                        }}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                        </div>

                        {/* Avatar */}
                        {user.avatar ? (
                          <img
                            src={`http://localhost:5000${user.avatar}`}
                            alt={user.nombre}
                            style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            background: '#e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem'
                          }}>
                            👤
                          </div>
                        )}

                        {/* Nombre y rol */}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '1.05rem' }}>
                            {user.nombre}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                            {user.rol}
                          </div>
                        </div>

                        {/* Estadísticas */}
                        <div style={{ display: 'flex', gap: '2rem', textAlign: 'center' }}>
                          <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>
                              {user.total_tareas}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Total</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e' }}>
                              {user.tareas_completadas}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Completadas</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#8b5cf6' }}>
                              {user.total_comentarios}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Comentarios</div>
                          </div>
                          <div>
                            <div style={{ 
                              fontSize: '1.5rem', 
                              fontWeight: '700', 
                              color: user.tasa_completado >= 80 ? '#22c55e' : user.tasa_completado >= 50 ? '#f59e0b' : '#ef4444'
                            }}>
                              {user.tasa_completado}%
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Efectividad</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab Timeline */}
            {activeTab === 'timeline' && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.2rem' }}>
                  📜 Timeline de Actividad Reciente
                </h3>
                
                {timeline.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    No hay actividad reciente
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    {/* Línea vertical */}
                    <div style={{
                      position: 'absolute',
                      left: '25px',
                      top: '0',
                      bottom: '0',
                      width: '2px',
                      background: '#e5e7eb'
                    }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {timeline.map((activity, idx) => (
                        <div key={activity.id} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                          {/* Punto en la línea */}
                          <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            background: 'white',
                            border: '3px solid #3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1,
                            flexShrink: 0
                          }}>
                            {activity.avatar ? (
                              <img
                                src={`http://localhost:5000${activity.avatar}`}
                                alt={activity.usuario}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <span style={{ fontSize: '1.5rem' }}>👤</span>
                            )}
                          </div>

                          {/* Contenido */}
                          <div style={{
                            flex: 1,
                            background: '#f9fafb',
                            borderRadius: '10px',
                            padding: '1rem',
                            border: '1px solid #e5e7eb'
                          }}>
                            <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
                              {activity.usuario} {getActionText(activity.action)}
                            </div>
                            <div style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                              {activity.tarea_titulo}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                              {new Date(activity.created_at).toLocaleString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Reports;

