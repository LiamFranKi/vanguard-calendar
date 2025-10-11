import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import axios from 'axios';
import Swal from 'sweetalert2';
import NotificationBell from '../components/NotificationBell';

// Configurar axios con la URL base y token
axios.defaults.baseURL = 'http://localhost:5000';
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function Calendar() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { config } = useConfig();
  const navigate = useNavigate();

  // Estado del calendario
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewType, setViewType] = useState('all'); // 'all', 'tasks', 'events'
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [users, setUsers] = useState([]);
  
  const [eventFormData, setEventFormData] = useState({
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
    }
  }, [isAuthenticated, navigate, authLoading]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCalendarEvents();
      fetchUsers();
    }
  }, [isAuthenticated, currentDate, viewType]);

  const fetchCalendarEvents = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const response = await axios.get('/api/calendar/events', {
        params: {
          start_date: startDate,
          end_date: endDate,
          type: viewType
        }
      });

      if (response.data.success) {
        setCalendarEvents(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar eventos:', error);
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
      setUsers([]); // Asegurar que sea array vacío en caso de error
    }
  };

  // Generar días del mes
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    
    // Días vacíos del mes anterior
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  // Obtener eventos de un día específico
  const getEventsForDay = (day) => {
    if (!day) return [];
    
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).toISOString().split('T')[0];

    return calendarEvents.filter(event => {
      const eventDate = new Date(event.date).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  // Navegación de meses
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Manejo de modals
  const openCreateEventModal = (date = null) => {
    setEditingEvent(null);
    
    let initialDate = '';
    if (date) {
      const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), date);
      initialDate = dateObj.toISOString().slice(0, 16);
    } else {
      initialDate = new Date().toISOString().slice(0, 16);
    }

    setEventFormData({
      title: '',
      description: '',
      fecha_inicio: initialDate,
      fecha_fin: initialDate,
      ubicacion: '',
      color: '#22c55e',
      todo_el_dia: false,
      attendees: []
    });
    setShowEventModal(true);
  };

  const openEditEventModal = (event) => {
    setEditingEvent(event);
    setEventFormData({
      title: event.title,
      description: event.description || '',
      fecha_inicio: new Date(event.date).toISOString().slice(0, 16),
      fecha_fin: event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : new Date(event.date).toISOString().slice(0, 16),
      ubicacion: event.ubicacion || '',
      color: event.color || '#22c55e',
      todo_el_dia: event.all_day || false,
      attendees: event.attendees ? event.attendees.map(a => a.id) : []
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();

    try {
      if (editingEvent) {
        await axios.put(`/api/calendar/events/${editingEvent.id}`, eventFormData);
        Swal.fire('¡Actualizado!', 'Evento actualizado exitosamente', 'success');
      } else {
        await axios.post('/api/calendar/events', eventFormData);
        Swal.fire('¡Creado!', 'Evento creado exitosamente', 'success');
      }

      setShowEventModal(false);
      fetchCalendarEvents();
    } catch (error) {
      console.error('Error al guardar evento:', error);
      Swal.fire('Error', 'Error al guardar el evento', 'error');
    }
  };

  const handleDeleteEvent = async (eventId) => {
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
        fetchCalendarEvents();
        setSelectedDate(null);
      } catch (error) {
        console.error('Error al eliminar evento:', error);
        Swal.fire('Error', 'Error al eliminar el evento', 'error');
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDayClick = (day) => {
    if (!day) return;
    setSelectedDate(day);
  };

  const handleNavigateToTask = (taskId) => {
    navigate(`/tareas?openTask=${taskId}`);
  };

  const toggleAttendee = (userId) => {
    setEventFormData(prev => {
      const isAssigned = prev.attendees.includes(userId);
      return {
        ...prev,
        attendees: isAssigned 
          ? prev.attendees.filter(id => id !== userId)
          : [...prev.attendees, userId]
      };
    });
  };

  // Mostrar loading mientras se verifica la autenticación
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

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const days = getDaysInMonth();
  const eventsOnSelectedDate = selectedDate ? getEventsForDay(selectedDate) : [];

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
          <a href="/calendario" style={{ textDecoration: 'none', color: 'white', fontWeight: '600', borderBottom: '2px solid white', paddingBottom: '0.25rem' }}>Calendario</a>
          {user?.rol === 'Administrador' && (
            <>
              <a href="/users" style={{ textDecoration: 'none', color: '#e5e7eb', fontWeight: '500' }}>Usuarios</a>
              <a href="/settings" style={{ textDecoration: 'none', color: '#e5e7eb', fontWeight: '500' }}>Configuración</a>
            </>
          )}
          <a href="/profile" style={{ textDecoration: 'none', color: '#e5e7eb', fontWeight: '500' }}>Mi Perfil</a>
          
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
      <div style={{ padding: '2rem', maxWidth: '1800px', margin: '0 auto' }}>
        {/* Header del calendario */}
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
            {/* Navegación de meses */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={prevMonth}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                ‹
              </button>
              
              <h2 style={{ margin: 0, color: 'white', fontSize: '1.8rem', fontWeight: '700', minWidth: '220px', textAlign: 'center' }}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              
              <button
                onClick={nextMonth}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                ›
              </button>

              <button
                onClick={goToToday}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginLeft: '1rem'
                }}
              >
                Hoy
              </button>
            </div>

            {/* Filtros y acciones */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {/* Filtro de vista */}
              <select
                value={viewType}
                onChange={(e) => setViewType(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <option value="all" style={{ color: '#333' }}>📅 Todo</option>
                <option value="tasks" style={{ color: '#333' }}>📋 Solo Tareas</option>
                <option value="events" style={{ color: '#333' }}>🎉 Solo Eventos</option>
              </select>

              {/* Botón crear evento */}
              <button
                type="button"
                onClick={() => openCreateEventModal()}
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
          </div>
        </div>

        {/* Grid del calendario y panel lateral */}
        <div style={{ display: 'grid', gridTemplateColumns: selectedDate ? '1fr 350px' : '1fr', gap: '2rem' }}>
          {/* Calendario */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Encabezados de días */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              {dayNames.map(day => (
                <div
                  key={day}
                  style={{
                    textAlign: 'center',
                    fontWeight: '700',
                    color: '#6b7280',
                    fontSize: '0.9rem',
                    padding: '0.5rem'
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Días del mes */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '0.5rem'
            }}>
              {days.map((day, index) => {
                const eventsForDay = day ? getEventsForDay(day) : [];
                const isToday = day && 
                  day === new Date().getDate() && 
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear();
                const isSelected = day === selectedDate;

                return (
                  <div
                    key={index}
                    onClick={() => handleDayClick(day)}
                    style={{
                      minHeight: '100px',
                      padding: '0.5rem',
                      borderRadius: '8px',
                      background: day ? (isSelected ? '#dbeafe' : (isToday ? '#fef3c7' : '#f9fafb')) : 'transparent',
                      border: isToday ? '2px solid #3b82f6' : (isSelected ? '2px solid #60a5fa' : '1px solid #e5e7eb'),
                      cursor: day ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (day && !isSelected) {
                        e.currentTarget.style.background = '#f3f4f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (day && !isSelected) {
                        e.currentTarget.style.background = isToday ? '#fef3c7' : '#f9fafb';
                      }
                    }}
                  >
                    {day && (
                      <>
                        <div style={{
                          fontWeight: isToday ? '700' : '600',
                          color: isToday ? '#1f2937' : '#6b7280',
                          marginBottom: '0.25rem',
                          fontSize: '0.9rem'
                        }}>
                          {day}
                        </div>

                        {/* Indicadores de eventos */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {eventsForDay.slice(0, 2).map((event, idx) => (
                            <div
                              key={idx}
                              style={{
                                fontSize: '0.65rem',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                background: event.type === 'task' ? '#dbeafe' : (event.color ? `${event.color}30` : '#dcfce7'),
                                color: event.type === 'task' ? '#1e40af' : (event.color || '#166534'),
                                fontWeight: '600',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                              title={event.title}
                            >
                              {event.type === 'task' ? '📋' : '🎉'} {event.title}
                            </div>
                          ))}
                          {eventsForDay.length > 2 && (
                            <div style={{
                              fontSize: '0.65rem',
                              color: '#6b7280',
                              fontWeight: '600',
                              textAlign: 'center'
                            }}>
                              +{eventsForDay.length - 2} más
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel lateral con eventos del día seleccionado */}
          {selectedDate && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              maxHeight: '700px',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.2rem' }}>
                  📅 {selectedDate} de {monthNames[currentDate.getMonth()]}
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ✕
                </button>
              </div>

              <button
                type="button"
                onClick={() => openCreateEventModal(selectedDate)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#22c55e',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginBottom: '1rem',
                  boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
                }}
              >
                ➕ Crear Evento en este Día
              </button>

              {eventsOnSelectedDate.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#6b7280'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📭</div>
                  <p>No hay eventos para este día</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {eventsOnSelectedDate.map((event) => (
                    <div
                      key={`${event.type}-${event.id}`}
                      style={{
                        background: event.type === 'task' ? '#eff6ff' : (event.color ? `${event.color}15` : '#f0fdf4'),
                        borderLeft: `4px solid ${event.type === 'task' ? '#3b82f6' : (event.color || '#22c55e')}`,
                        borderRadius: '8px',
                        padding: '1rem',
                        cursor: event.type === 'event' ? 'pointer' : 'default'
                      }}
                      onClick={() => {
                        if (event.type === 'task') {
                          handleNavigateToTask(event.id);
                        } else {
                          openEditEventModal(event);
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            fontWeight: '600',
                            marginBottom: '0.25rem'
                          }}>
                            {event.type === 'task' ? '📋 TAREA' : '🎉 EVENTO'}
                          </div>
                          <h4 style={{
                            margin: '0 0 0.5rem 0',
                            color: '#1f2937',
                            fontSize: '1rem',
                            fontWeight: '700'
                          }}>
                            {event.title}
                          </h4>
                          {event.description && (
                            <p style={{
                              margin: '0 0 0.5rem 0',
                              color: '#6b7280',
                              fontSize: '0.85rem',
                              lineHeight: '1.4'
                            }}>
                              {event.description}
                            </p>
                          )}
                          {event.type === 'task' && (
                            <>
                              <div style={{
                                display: 'inline-block',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                background: 
                                  event.priority === 'urgente' ? '#fee2e2' :
                                  event.priority === 'alta' ? '#ffedd5' :
                                  event.priority === 'media' ? '#fef3c7' : '#f3f4f6',
                                color:
                                  event.priority === 'urgente' ? '#991b1b' :
                                  event.priority === 'alta' ? '#9a3412' :
                                  event.priority === 'media' ? '#854d0e' : '#6b7280',
                                marginRight: '0.5rem'
                              }}>
                                {event.priority === 'urgente' && '🔥 Urgente'}
                                {event.priority === 'alta' && '🔴 Alta'}
                                {event.priority === 'media' && '🟡 Media'}
                                {event.priority === 'baja' && '⚪ Baja'}
                              </div>
                              <div style={{
                                display: 'inline-block',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                background:
                                  event.status === 'completada' ? '#dcfce7' :
                                  event.status === 'en_progreso' ? '#dbeafe' :
                                  event.status === 'cancelada' ? '#fee2e2' : '#f3f4f6',
                                color:
                                  event.status === 'completada' ? '#166534' :
                                  event.status === 'en_progreso' ? '#1e40af' :
                                  event.status === 'cancelada' ? '#991b1b' : '#6b7280'
                              }}>
                                {event.status === 'completada' && '✅ Completada'}
                                {event.status === 'en_progreso' && '🔄 En Progreso'}
                                {event.status === 'pendiente' && '⏳ Pendiente'}
                                {event.status === 'cancelada' && '❌ Cancelada'}
                              </div>
                            </>
                          )}
                          {event.type === 'event' && event.ubicacion && (
                            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
                              📍 {event.ubicacion}
                            </div>
                          )}
                        </div>
                        {event.type === 'event' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event.id);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: '1.2rem',
                              padding: '0.25rem'
                            }}
                            title="Eliminar evento"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Crear/Editar Evento */}
      {showEventModal && (
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
              onClick={() => setShowEventModal(false)}
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

            <form onSubmit={handleSaveEvent}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                  Título *
                </label>
                <input
                  type="text"
                  required
                  value={eventFormData.title}
                  onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
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
                  value={eventFormData.description}
                  onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
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
                    value={eventFormData.fecha_inicio}
                    onChange={(e) => setEventFormData({ ...eventFormData, fecha_inicio: e.target.value })}
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
                    value={eventFormData.fecha_fin}
                    onChange={(e) => setEventFormData({ ...eventFormData, fecha_fin: e.target.value })}
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
                  value={eventFormData.ubicacion}
                  onChange={(e) => setEventFormData({ ...eventFormData, ubicacion: e.target.value })}
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
                    value={eventFormData.color}
                    onChange={(e) => setEventFormData({ ...eventFormData, color: e.target.value })}
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
                      checked={eventFormData.todo_el_dia}
                      onChange={(e) => setEventFormData({ ...eventFormData, todo_el_dia: e.target.checked })}
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
                          checked={eventFormData.attendees.includes(u.id)}
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
                  onClick={() => setShowEventModal(false)}
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

export default Calendar;

