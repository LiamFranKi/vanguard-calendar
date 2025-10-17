import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import axios from 'axios';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';

// Configurar axios
import { API_URL } from '../config/constants';
import { getImageUrl, getServerUrl } from '../config/constants';
axios.defaults.baseURL = API_URL.replace('/api', '');
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
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' o 'past'
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

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

  // Función para separar eventos en próximos y pasados (considerando búsqueda)
  const getUpcomingEvents = () => {
    const now = new Date();
    // Usar filteredEvents si tiene datos, sino usar events directamente
    const eventsToFilter = filteredEvents.length > 0 ? filteredEvents : events;
    let filtered = eventsToFilter.filter(event => {
      // El backend devuelve 'date' para eventos, no 'fecha_inicio'
      const eventDate = new Date(event.date || event.fecha_inicio);
      return eventDate >= now;
    });
    return filtered;
  };

  const getPastEvents = () => {
    const now = new Date();
    // Usar filteredEvents si tiene datos, sino usar events directamente
    const eventsToFilter = filteredEvents.length > 0 ? filteredEvents : events;
    let filtered = eventsToFilter.filter(event => {
      // El backend devuelve 'date' para eventos, no 'fecha_inicio'
      const eventDate = new Date(event.date || event.fecha_inicio);
      return eventDate < now;
    });
    return filtered;
  };

  // Función para obtener eventos según el tab activo
  const getCurrentTabEvents = () => {
    return activeTab === 'upcoming' ? getUpcomingEvents() : getPastEvents();
  };

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

  // Efecto para actualizar cuando cambie el tab activo
  useEffect(() => {
    // No necesitamos hacer nada aquí, las funciones ya están reactivas
  }, [activeTab]);

  // Efecto para manejar el parámetro openEvent de la URL
  useEffect(() => {
    const openEventId = searchParams.get('openEvent');
    if (openEventId && events.length > 0) {
      const eventToOpen = events.find(event => event.id === parseInt(openEventId));
      if (eventToOpen) {
        openEventModal(eventToOpen);
        // Limpiar el parámetro de la URL
        setSearchParams({});
      }
    }
  }, [events, searchParams, setSearchParams]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/calendar/events', {
        params: { type: 'events' }
      });
      
      console.log('📅 Eventos recibidos:', response.data);
      
      if (response.data.success) {
        setEvents(response.data.data);
        console.log('📅 Eventos cargados:', response.data.data);
        console.log('📅 Cantidad de eventos:', response.data.data.length);
        console.log('📅 Tipos de eventos:', response.data.data.map(e => ({ title: e.title, type: e.type })));
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

    // Filtrar por búsqueda
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

  const openEventModal = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
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
      {/* Navbar unificado */}
      <Navbar />

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
                {getCurrentTabEvents().length} evento{getCurrentTabEvents().length !== 1 ? 's' : ''} {searchTerm && `encontrado${getCurrentTabEvents().length !== 1 ? 's' : ''}`}
                {activeTab === 'upcoming' ? ' próximos' : ' pasados'}
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

        {/* Tabs de navegación */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '12px',
          padding: '0.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          gap: '0.5rem'
        }}>
          <button
            onClick={() => setActiveTab('upcoming')}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              background: activeTab === 'upcoming' ? '#3b82f6' : 'transparent',
              color: activeTab === 'upcoming' ? 'white' : '#6b7280',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '1rem'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'upcoming') {
                e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                e.target.style.color = '#3b82f6';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'upcoming') {
                e.target.style.background = 'transparent';
                e.target.style.color = '#6b7280';
              }
            }}
          >
            📅 Próximos Eventos ({getUpcomingEvents().length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              background: activeTab === 'past' ? '#3b82f6' : 'transparent',
              color: activeTab === 'past' ? 'white' : '#6b7280',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '1rem'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'past') {
                e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                e.target.style.color = '#3b82f6';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'past') {
                e.target.style.background = 'transparent';
                e.target.style.color = '#6b7280';
              }
            }}
          >
            📚 Eventos Pasados ({getPastEvents().length})
          </button>
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
        ) : getCurrentTabEvents().length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>
              {searchTerm ? 'No se encontraron eventos' : 
               activeTab === 'upcoming' ? 'No hay eventos próximos' : 'No hay eventos pasados'}
            </h3>
            <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280' }}>
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 
               activeTab === 'upcoming' ? 'Los eventos que crees aparecerán aquí' : 'Los eventos que ya pasaron aparecerán aquí'}
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
            {getCurrentTabEvents().map(event => (
              <div
                key={event.id}
                onClick={() => openEventModal(event)}
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  borderLeft: `4px solid ${event.color || '#22c55e'}`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
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
                                  src={`${getImageUrl(attendee.avatar)}`}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(event);
                      }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(event.id);
                      }}
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
                            src={`${getImageUrl(u.avatar)}`}
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

      {/* Modal de Vista Previa del Evento */}
      {showEventModal && selectedEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
          }}>
            {/* Header del Modal */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #f3f4f6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: selectedEvent.color || '#22c55e'
                }}></div>
                <h2 style={{
                  margin: 0,
                  color: '#1f2937',
                  fontSize: '1.5rem',
                  fontWeight: '700'
                }}>
                  {selectedEvent.title}
                </h2>
              </div>
              <button
                onClick={() => setShowEventModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0.5rem',
                  borderRadius: '50%',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                ✕
              </button>
            </div>

            {/* Contenido del Evento */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Descripción */}
              {selectedEvent.description && (
                <div>
                  <h3 style={{
                    margin: '0 0 0.5rem 0',
                    color: '#374151',
                    fontSize: '1.1rem',
                    fontWeight: '600'
                  }}>
                    📝 Descripción
                  </h3>
                  <p style={{
                    margin: 0,
                    color: '#6b7280',
                    lineHeight: '1.6',
                    fontSize: '1rem'
                  }}>
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              {/* Fechas */}
              <div>
                <h3 style={{
                  margin: '0 0 0.5rem 0',
                  color: '#374151',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>
                  📅 Fechas
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>🕐</span>
                    <div>
                      <div style={{ fontWeight: '600', color: '#374151' }}>
                        {selectedEvent.all_day ? 'Todo el día' : 'Fecha y hora'}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                        {selectedEvent.all_day 
                          ? new Date(selectedEvent.date).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : new Date(selectedEvent.date).toLocaleString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                        }
                      </div>
                    </div>
                  </div>

                  {selectedEvent.end_date && selectedEvent.end_date !== selectedEvent.date && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px'
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>🏁</span>
                      <div>
                        <div style={{ fontWeight: '600', color: '#374151' }}>
                          Fecha de fin
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                          {selectedEvent.all_day 
                            ? new Date(selectedEvent.end_date).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : new Date(selectedEvent.end_date).toLocaleString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                          }
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ubicación */}
              {selectedEvent.ubicacion && (
                <div>
                  <h3 style={{
                    margin: '0 0 0.5rem 0',
                    color: '#374151',
                    fontSize: '1.1rem',
                    fontWeight: '600'
                  }}>
                    📍 Ubicación
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>📍</span>
                    <span style={{ color: '#6b7280' }}>{selectedEvent.ubicacion}</span>
                  </div>
                </div>
              )}

              {/* Asistentes */}
              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div>
                  <h3 style={{
                    margin: '0 0 0.5rem 0',
                    color: '#374151',
                    fontSize: '1.1rem',
                    fontWeight: '600'
                  }}>
                    👥 Asistentes ({selectedEvent.attendees.length})
                  </h3>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    {selectedEvent.attendees.map((attendee, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: '#eff6ff',
                          borderRadius: '20px',
                          border: '1px solid #dbeafe'
                        }}
                      >
                        {attendee.avatar ? (
                          <img
                            src={attendee.avatar}
                            alt={attendee.nombres}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.8rem',
                            fontWeight: '600'
                          }}>
                            {attendee.nombres.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span style={{
                          fontSize: '0.9rem',
                          color: '#1e40af',
                          fontWeight: '500'
                        }}>
                          {attendee.nombres} {attendee.apellidos}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Botones de Acción */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '2px solid #f3f4f6'
            }}>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  openEditModal(selectedEvent);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
              >
                ✏️ Editar Evento
              </button>
              <button
                onClick={() => setShowEventModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: '2px solid #d1d5db',
                  background: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#9ca3af';
                  e.target.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.backgroundColor = 'white';
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Events;

