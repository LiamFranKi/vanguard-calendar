import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

function Events() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { config } = useConfig();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fecha_inicio: '',
    fecha_fin: '',
    ubicacion: '',
    color: '#22c55e',
    todo_el_dia: false,
    attendees: []
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    } else if (!authLoading && isAuthenticated) {
      fetchEvents();
      fetchUsers();
    }
  }, [isAuthenticated, navigate, authLoading]);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/calendar/events', {
        params: { type: 'events' }
      });
      if (response.data.success) {
        setEvents(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      Swal.fire('Error', 'Error al cargar eventos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      if (response.data.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setUsers([]);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.ubicacion && event.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredEvents(filtered);
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      fecha_inicio: new Date().toISOString().slice(0, 16),
      fecha_fin: new Date().toISOString().slice(0, 16),
      ubicacion: '',
      color: '#22c55e',
      todo_el_dia: false,
      attendees: []
    });
    setShowModal(true);
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      fecha_inicio: new Date(event.date).toISOString().slice(0, 16),
      fecha_fin: event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : new Date(event.date).toISOString().slice(0, 16),
      ubicacion: event.ubicacion || '',
      color: event.color || '#22c55e',
      todo_el_dia: event.all_day || false,
      attendees: event.attendees ? event.attendees.map(a => a.id) : []
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingEvent) {
        await axios.put(`/api/calendar/events/${editingEvent.id}`, formData);
        Swal.fire('¡Actualizado!', 'Evento actualizado exitosamente', 'success');
      } else {
        await axios.post('/api/calendar/events', formData);
        Swal.fire('¡Creado!', 'Evento creado exitosamente', 'success');
      }

      setShowModal(false);
      fetchEvents();
    } catch (error) {
      console.error('Error al guardar evento:', error);
      Swal.fire('Error', 'Error al guardar el evento', 'error');
    }
  };

  const handleDelete = async (eventId) => {
    const result = await Swal.fire({
      title: '¿Eliminar evento?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/calendar/events/${eventId}`);
        Swal.fire('¡Eliminado!', 'Evento eliminado exitosamente', 'success');
        fetchEvents();
      } catch (error) {
        console.error('Error al eliminar evento:', error);
        Swal.fire('Error', 'Error al eliminar el evento', 'error');
      }
    }
  };

  const toggleAttendee = (userId) => {
    setFormData(prev => {
      const isAssigned = prev.attendees.includes(userId);
      return {
        ...prev,
        attendees: isAssigned
          ? prev.attendees.filter(id => id !== userId)
          : [...prev.attendees, userId]
      };
    });
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
          <a href="/dashboard" style={{ textDecoration: 'none', color: '#e5e7eb', fontWeight: '500' }}>Dashboard</a>
          <a href="/tareas" style={{ textDecoration: 'none', color: '#e5e7eb', fontWeight: '500' }}>Tareas</a>
          <a href="/calendario" style={{ textDecoration: 'none', color: '#e5e7eb', fontWeight: '500' }}>Calendario</a>
          <a href="/eventos" style={{ textDecoration: 'none', color: 'white', fontWeight: '600', borderBottom: '2px solid white', paddingBottom: '0.25rem' }}>Eventos</a>
          {user?.rol === 'Administrador' && (
            <>
              <a href="/users" style={{ textDecoration: 'none', color: '#e5e7eb', fontWeight: '500' }}>Usuarios</a>
              <a href="/settings" style={{ textDecoration: 'none', color: '#e5e7eb', fontWeight: '500' }}>Configuración</a>
            </>
          )}
          {/* Iconos de acción agrupados */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem' }}>
            <a 
              href="/profile" 
              style={{ 
                fontSize: '1.5rem',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              title="Mi Perfil"
            >
              👤
            </a>
            
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
              ⎋
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
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
                🎉 Gestión de Eventos
              </h2>
              <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)' }}>
                {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''} {searchTerm && `encontrado${filteredEvents.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              style={{
                padding: '0.75rem 1.5rem',
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
              ➕ Nuevo Evento
            </button>
          </div>

          {/* Buscador */}
          <div style={{ marginTop: '1rem' }}>
            <input
              type="text"
              placeholder="🔍 Buscar eventos por título, descripción o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.9)',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Lista de eventos */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'white',
            fontSize: '1.2rem'
          }}>
            Cargando eventos...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>
              {searchTerm ? 'No se encontraron eventos' : 'No hay eventos'}
            </h3>
            <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280' }}>
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza creando tu primer evento'}
            </p>
            {!searchTerm && (
              <button
                type="button"
                onClick={openCreateModal}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#3b82f6',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
                }}
              >
                ➕ Crear primer evento
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredEvents.map(event => (
              <div
                key={event.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  borderLeft: `4px solid ${event.color || '#22c55e'}`,
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>🎉</span>
                      <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.3rem', fontWeight: '700' }}>
                        {event.title}
                      </h3>
                      {event.all_day && (
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
                        margin: '0 0 0.75rem 0',
                        color: '#6b7280',
                        fontSize: '0.95rem',
                        lineHeight: '1.6'
                      }}>
                        {event.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.9rem', color: '#6b7280', marginTop: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>📅</span>
                        <span>{new Date(event.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: event.all_day ? undefined : '2-digit', minute: event.all_day ? undefined : '2-digit' })}</span>
                      </div>

                      {event.ubicacion && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>📍</span>
                          <span>{event.ubicacion}</span>
                        </div>
                      )}

                      {event.attendees && event.attendees.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>👥</span>
                          <div style={{ display: 'flex' }}>
                            {event.attendees.slice(0, 3).map((attendee, idx) => (
                              attendee.avatar ? (
                                <img
                                  key={attendee.id}
                                  src={`http://localhost:5000${attendee.avatar}`}
                                  alt={attendee.nombres}
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '2px solid white',
                                    marginLeft: idx > 0 ? '-8px' : '0'
                                  }}
                                  title={`${attendee.nombres} ${attendee.apellidos}`}
                                />
                              ) : (
                                <div
                                  key={attendee.id}
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: '#e5e7eb',
                                    border: '2px solid white',
                                    marginLeft: idx > 0 ? '-8px' : '0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem'
                                  }}
                                  title={`${attendee.nombres} ${attendee.apellidos}`}
                                >
                                  👤
                                </div>
                              )
                            ))}
                            {event.attendees.length > 3 && (
                              <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: '#6b7280',
                                color: 'white',
                                fontSize: '0.7rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid white',
                                marginLeft: '-8px',
                                fontWeight: '600'
                              }}>
                                +{event.attendees.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                    <button
                      onClick={() => openEditModal(event)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'transparent',
                        color: '#3b82f6',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#eff6ff'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      title="Editar evento"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'transparent',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#fee2e2'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      title="Eliminar evento"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            padding: '2rem'
          }}>
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              ✕
            </button>

            <h2 style={{ marginTop: 0, color: '#1f2937' }}>
              {editingEvent ? '✏️ Editar Evento' : '➕ Nuevo Evento'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                  Título *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    fontSize: '1rem'
                  }}
                  placeholder="Ej: Reunión de equipo"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                  placeholder="Detalles del evento..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                    Fecha/Hora Inicio *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                    Fecha/Hora Fin
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                  Ubicación
                </label>
                <input
                  type="text"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    fontSize: '1rem'
                  }}
                  placeholder="Ej: Sala de conferencias"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                    Color
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    style={{
                      width: '100%',
                      height: '45px',
                      padding: '0.25rem',
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb',
                      cursor: 'pointer'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.todo_el_dia}
                      onChange={(e) => setFormData({ ...formData, todo_el_dia: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: '600', color: '#374151' }}>Todo el día</span>
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                  👥 Asistentes
                </label>
                <div style={{
                  maxHeight: '200px',
                  overflow: 'auto',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '0.5rem'
                }}>
                  {users && users.length > 0 ? (
                    users.map(u => (
                      <label
                        key={u.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.5rem',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <input
                          type="checkbox"
                          checked={formData.attendees.includes(u.id)}
                          onChange={() => toggleAttendee(u.id)}
                          style={{ cursor: 'pointer' }}
                        />
                        {u.avatar ? (
                          <img 
                            src={`http://localhost:5000${u.avatar}`}
                            alt={u.nombres}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            👤
                          </div>
                        )}
                        <span style={{ fontWeight: '500' }}>
                          {u.nombres} {u.apellidos}
                          <span style={{ color: '#6b7280', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
                            ({u.rol})
                          </span>
                        </span>
                      </label>
                    ))
                  ) : (
                    <p style={{ margin: 0, padding: '0.5rem', color: '#6b7280', textAlign: 'center' }}>
                      Cargando usuarios...
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#6b7280',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#3b82f6',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
                  }}
                >
                  {editingEvent ? 'Actualizar' : 'Crear'} Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Events;

