import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

function Tasks() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { config } = useConfig();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // list, kanban
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    project_id: '',
    search: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'media',
    status: 'pendiente',
    categoria: 'general',
    project_id: '',
    estimacion_horas: '',
    progreso: 0,
    tags: [],
    assignees: []
  });

  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    } else if (!authLoading && isAuthenticated) {
      fetchTasks();
      fetchProjects();
      fetchUsers();
    }
  }, [isAuthenticated, navigate, authLoading]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchTasks();
    }
  }, [filters, view]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.project_id) params.append('project_id', filters.project_id);
      if (filters.search) params.append('search', filters.search);
      params.append('view', view);

      const response = await axios.get(`/api/tasks?${params}`);
      
      if (response.data.success) {
        setTasks(response.data.data);
      }
    } catch (error) {
      console.error('Error al obtener tareas:', error);
      Swal.fire('Error', 'Error al cargar las tareas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/tasks/projects/all');
      if (response.data.success) {
        setProjects(response.data.data);
      }
    } catch (error) {
      console.error('Error al obtener proyectos:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/tasks', formData);
      
      if (response.data.success) {
        Swal.fire('Éxito', 'Tarea creada exitosamente', 'success');
        setShowCreateModal(false);
        resetForm();
        fetchTasks();
      }
    } catch (error) {
      console.error('Error al crear tarea:', error);
      Swal.fire('Error', error.response?.data?.message || 'Error al crear la tarea', 'error');
    }
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`/api/tasks/${editingTask.id}`, formData);
      
      if (response.data.success) {
        Swal.fire('Éxito', 'Tarea actualizada exitosamente', 'success');
        setShowEditModal(false);
        setEditingTask(null);
        resetForm();
        fetchTasks();
      }
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      Swal.fire('Error', 'Error al actualizar la tarea', 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
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
        const response = await axios.delete(`/api/tasks/${taskId}`);
        if (response.data.success) {
          Swal.fire('Eliminado', 'Tarea eliminada exitosamente', 'success');
          fetchTasks();
        }
      } catch (error) {
        console.error('Error al eliminar tarea:', error);
        Swal.fire('Error', 'Error al eliminar la tarea', 'error');
      }
    }
  };

  const handleQuickStatusChange = async (taskId, newStatus) => {
    try {
      const response = await axios.put(`/api/tasks/${taskId}`, { status: newStatus });
      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Estado actualizado',
          timer: 1500,
          showConfirmButton: false
        });
        fetchTasks();
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      Swal.fire('Error', 'Error al cambiar el estado', 'error');
    }
  };

  const handleQuickPriorityChange = async (taskId, newPriority) => {
    try {
      const response = await axios.put(`/api/tasks/${taskId}`, { priority: newPriority });
      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Prioridad actualizada',
          timer: 1500,
          showConfirmButton: false
        });
        fetchTasks();
      }
    } catch (error) {
      console.error('Error al cambiar prioridad:', error);
      Swal.fire('Error', 'Error al cambiar la prioridad', 'error');
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
      priority: task.priority,
      status: task.status,
      categoria: task.categoria || 'general',
      project_id: task.project_id || '',
      estimacion_horas: task.estimacion_horas || '',
      progreso: task.progreso || 0,
      tags: task.tags || [],
      assignees: task.assignees || []
    });
    setShowEditModal(true);
  };

  const openDetailModal = async (task) => {
    try {
      const response = await axios.get(`/api/tasks/${task.id}`);
      if (response.data.success) {
        setSelectedTask(response.data.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error al obtener detalle:', error);
      Swal.fire('Error', 'Error al cargar los detalles', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      due_date: '',
      priority: 'media',
      status: 'pendiente',
      categoria: 'general',
      project_id: '',
      estimacion_horas: '',
      progreso: 0,
      tags: [],
      assignees: []
    });
    setNewTag('');
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  const toggleAssignee = (userId) => {
    setFormData(prev => {
      const isAssigned = prev.assignees.includes(userId);
      return {
        ...prev,
        assignees: isAssigned 
          ? prev.assignees.filter(id => id !== userId)
          : [...prev.assignees, userId]
      };
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgente': return '#ef4444';
      case 'alta': return '#f97316';
      case 'media': return '#eab308';
      case 'baja': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completada': return '#22c55e';
      case 'en_progreso': return '#3b82f6';
      case 'en_revision': return '#8b5cf6';
      case 'pendiente': return '#6b7280';
      case 'cancelada': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgente': return '🔥';
      case 'alta': return '🔴';
      case 'media': return '🟡';
      case 'baja': return '🟢';
      default: return '⚪';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pendiente': return '⏳';
      case 'en_progreso': return '🔄';
      case 'en_revision': return '👀';
      case 'completada': return '✅';
      case 'cancelada': return '❌';
      default: return '📋';
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${config.color_primario || '#667eea'}80 0%, ${config.color_secundario || '#764ba2'}80 100%)`,
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
            <Link to="/tareas" style={{ textDecoration: 'none', color: '#1f2937', fontWeight: '600' }}>Tareas</Link>
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
              📋 Gestión de Tareas
            </h1>
            <p style={{
              fontSize: '1.1rem',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0
            }}>
              Organiza y gestiona todas tus tareas de manera eficiente
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            {/* Botones de Vista */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '0.5rem',
              display: 'flex',
              gap: '0.5rem'
            }}>
              <button
                onClick={() => handleViewChange('list')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: view === 'list' ? '#3b82f6' : 'transparent',
                  color: view === 'list' ? 'white' : 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📋 Lista
              </button>
              <button
                onClick={() => handleViewChange('kanban')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: view === 'kanban' ? '#3b82f6' : 'transparent',
                  color: view === 'kanban' ? 'white' : 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📌 Kanban
              </button>
            </div>

            {/* Botón Nueva Tarea */}
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: 'none',
                background: '#3b82f6',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
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
              ➕ Nueva Tarea
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'end'
        }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '600' }}>
              🔍 Buscar
            </label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Buscar tareas..."
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '600' }}>
              📊 Estado
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '1rem',
                outline: 'none'
              }}
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_progreso">En Progreso</option>
              <option value="en_revision">En Revisión</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '600' }}>
              ⚡ Prioridad
            </label>
            <select
              name="priority"
              value={filters.priority}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '1rem',
                outline: 'none'
              }}
            >
              <option value="">Todas</option>
              <option value="urgente">Urgente</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>

          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '600' }}>
              📁 Proyecto
            </label>
            <select
              name="project_id"
              value={filters.project_id}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '1rem',
                outline: 'none'
              }}
            >
              <option value="">Todos</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Vista Lista */}
        {view === 'list' ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '1.5rem'
          }}>
            {tasks.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'white' }}>No hay tareas</h3>
                <p style={{ margin: 0 }}>Crea tu primera tarea para comenzar</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {tasks.map(task => (
                  <div
                    key={task.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      transition: 'transform 0.2s, box-shadow 0.2s'
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
                    {/* Header de la tarea */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          margin: '0 0 0.5rem 0',
                          color: '#1f2937',
                          fontSize: '1.25rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                        onClick={() => openDetailModal(task)}
                        >
                          {task.title}
                        </h3>
                        {task.description && (
                          <p style={{
                            margin: '0 0 1rem 0',
                            color: '#6b7280',
                            lineHeight: '1.5',
                            maxHeight: '3em',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Acciones */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                        <button
                          onClick={() => openEditModal(task)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'transparent',
                            color: '#3b82f6',
                            cursor: 'pointer',
                            fontSize: '1.2rem'
                          }}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'transparent',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '1.2rem'
                          }}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    {task.progreso > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.5rem'
                        }}>
                          <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '600' }}>
                            Progreso
                          </span>
                          <span style={{ fontSize: '0.875rem', color: '#3b82f6', fontWeight: '700' }}>
                            {task.progreso}%
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
                            width: `${task.progreso}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                        {task.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: '#e5e7eb',
                              color: '#374151',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.875rem',
                              fontWeight: '500'
                            }}
                          >
                            🏷️ {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Cambio rápido de Estado y Prioridad */}
                    <div style={{
                      display: 'flex',
                      gap: '1rem',
                      marginBottom: '1rem',
                      flexWrap: 'wrap'
                    }}>
                      {/* Estado con dropdown */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '600' }}>
                          Estado:
                        </span>
                        <select
                          value={task.status}
                          onChange={(e) => handleQuickStatusChange(task.id, e.target.value)}
                          style={{
                            padding: '0.375rem 0.75rem',
                            borderRadius: '20px',
                            border: 'none',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            background: getStatusColor(task.status),
                            color: 'white',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="pendiente">{getStatusIcon('pendiente')} Pendiente</option>
                          <option value="en_progreso">{getStatusIcon('en_progreso')} En Progreso</option>
                          <option value="en_revision">{getStatusIcon('en_revision')} En Revisión</option>
                          <option value="completada">{getStatusIcon('completada')} Completada</option>
                          <option value="cancelada">{getStatusIcon('cancelada')} Cancelada</option>
                        </select>
                      </div>

                      {/* Prioridad con dropdown */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '600' }}>
                          Prioridad:
                        </span>
                        <select
                          value={task.priority}
                          onChange={(e) => handleQuickPriorityChange(task.id, e.target.value)}
                          style={{
                            padding: '0.375rem 0.75rem',
                            borderRadius: '20px',
                            border: 'none',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            background: getPriorityColor(task.priority),
                            color: 'white',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="baja">{getPriorityIcon('baja')} Baja</option>
                          <option value="media">{getPriorityIcon('media')} Media</option>
                          <option value="alta">{getPriorityIcon('alta')} Alta</option>
                          <option value="urgente">{getPriorityIcon('urgente')} Urgente</option>
                        </select>
                      </div>
                    </div>

                    {/* Usuarios asignados */}
                    {task.assignees && task.assignees.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '600', marginRight: '0.5rem' }}>
                          Asignados:
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                          {task.assignees.map(assignee => (
                            <div
                              key={assignee.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: '#f3f4f6',
                                padding: '0.375rem 0.75rem',
                                borderRadius: '20px',
                                fontSize: '0.875rem'
                              }}
                            >
                              {assignee.avatar ? (
                                <img 
                                  src={`http://localhost:5000${assignee.avatar}`}
                                  alt={assignee.nombres}
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    objectFit: 'cover'
                                  }}
                                />
                              ) : (
                                <span style={{ fontSize: '1rem' }}>👤</span>
                              )}
                              <span style={{ color: '#374151', fontWeight: '500' }}>
                                {assignee.nombres} {assignee.apellidos}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer con información */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      paddingTop: '1rem',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {task.due_date && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            📅 {new Date(task.due_date).toLocaleDateString('es-ES')}
                          </span>
                        )}
                        {task.project_name && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              background: task.project_color,
                              display: 'inline-block'
                            }} />
                            {task.project_name}
                          </span>
                        )}
                        {task.estimacion_horas && (
                          <span>⏱️ {task.estimacion_horas}h</span>
                        )}
                        {task.comment_count > 0 && (
                          <span>💬 {task.comment_count}</span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.8rem' }}>
                        Creada: {new Date(task.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Vista Kanban (próximamente)
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '2rem'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚧</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'white' }}>Vista Kanban en desarrollo</h3>
              <p style={{ margin: 0 }}>Próximamente con drag & drop</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar Tarea */}
      {(showCreateModal || showEditModal) && (
        <TaskFormModal
          isEdit={showEditModal}
          formData={formData}
          setFormData={setFormData}
          handleSubmit={showEditModal ? handleEditTask : handleCreateTask}
          handleClose={() => {
            showEditModal ? setShowEditModal(false) : setShowCreateModal(false);
            resetForm();
            setEditingTask(null);
          }}
          projects={projects}
          users={users}
          newTag={newTag}
          setNewTag={setNewTag}
          handleAddTag={handleAddTag}
          handleRemoveTag={handleRemoveTag}
          handleInputChange={handleInputChange}
          toggleAssignee={toggleAssignee}
        />
      )}

      {/* Modal Detalle de Tarea */}
      {showDetailModal && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          currentUser={user}
          handleClose={() => {
            setShowDetailModal(false);
            setSelectedTask(null);
          }}
          handleEdit={() => {
            setShowDetailModal(false);
            openEditModal(selectedTask);
          }}
          handleDelete={() => {
            setShowDetailModal(false);
            handleDeleteTask(selectedTask.id);
          }}
          getPriorityColor={getPriorityColor}
          getStatusColor={getStatusColor}
          getPriorityIcon={getPriorityIcon}
          getStatusIcon={getStatusIcon}
        />
      )}
    </div>
  );
}

// Componente Modal de Formulario
function TaskFormModal({ 
  isEdit, 
  formData, 
  setFormData,
  handleSubmit, 
  handleClose, 
  projects, 
  users,
  newTag,
  setNewTag,
  handleAddTag,
  handleRemoveTag,
  handleInputChange,
  toggleAssignee
}) {
  return (
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
    }}
    onClick={handleClose}
    >
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{
          margin: '0 0 1.5rem 0',
          color: '#1f2937',
          fontSize: '1.5rem',
          fontWeight: '700'
        }}>
          {isEdit ? '✏️ Editar Tarea' : '➕ Nueva Tarea'}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Título */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Título *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Descripción */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                fontSize: '1rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Prioridad y Estado */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Prioridad
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              >
                <option value="baja">🟢 Baja</option>
                <option value="media">🟡 Media</option>
                <option value="alta">🔴 Alta</option>
                <option value="urgente">🔥 Urgente</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Estado
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              >
                <option value="pendiente">⏳ Pendiente</option>
                <option value="en_progreso">🔄 En Progreso</option>
                <option value="en_revision">👀 En Revisión</option>
                <option value="completada">✅ Completada</option>
                <option value="cancelada">❌ Cancelada</option>
              </select>
            </div>
          </div>

          {/* Fecha Límite y Proyecto */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Fecha Límite
              </label>
              <input
                type="datetime-local"
                name="due_date"
                value={formData.due_date}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Proyecto
              </label>
              <select
                name="project_id"
                value={formData.project_id}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              >
                <option value="">Sin proyecto</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Estimación y Progreso */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Estimación (horas)
              </label>
              <input
                type="number"
                name="estimacion_horas"
                value={formData.estimacion_horas}
                onChange={handleInputChange}
                min="0"
                step="0.5"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Progreso (%)
              </label>
              <input
                type="range"
                name="progreso"
                value={formData.progreso}
                onChange={handleInputChange}
                min="0"
                max="100"
                style={{
                  width: '100%',
                  marginTop: '0.75rem'
                }}
              />
              <div style={{ textAlign: 'center', color: '#3b82f6', fontWeight: '700', marginTop: '0.25rem' }}>
                {formData.progreso}%
              </div>
            </div>
          </div>

          {/* Asignar Usuarios */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              👥 Asignar a:
            </label>
            <div style={{
              maxHeight: '150px',
              overflow: 'auto',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              padding: '0.5rem'
            }}>
              {users.length === 0 ? (
                <p style={{ margin: 0, padding: '0.5rem', color: '#6b7280', textAlign: 'center' }}>
                  No hay usuarios disponibles
                </p>
              ) : (
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
                      checked={formData.assignees.includes(u.id)}
                      onChange={() => toggleAssignee(u.id)}
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
              )}
            </div>
          </div>

          {/* Tags */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              🏷️ Tags
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Agregar tag..."
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddTag}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                ➕
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  style={{
                    background: '#e5e7eb',
                    color: '#374151',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: '500'
                  }}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                      fontWeight: 'bold'
                    }}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                background: 'white',
                color: '#6b7280',
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
              {isEdit ? 'Actualizar Tarea' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente Modal de Detalle
function TaskDetailModal({ 
  task,
  currentUser,
  handleClose, 
  handleEdit, 
  handleDelete,
  getPriorityColor,
  getStatusColor,
  getPriorityIcon,
  getStatusIcon
}) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (task && task.id) {
      fetchComments();
    }
  }, [task]);

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const response = await axios.get(`/api/tasks/${task.id}/comments`);
      if (response.data.success) {
        setComments(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar comentarios:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(`/api/tasks/${task.id}/comments`, {
        content: newComment
      });

      if (response.data.success) {
        // Recargar todos los comentarios para tener la info completa del usuario
        await fetchComments();
        setNewComment('');
        Swal.fire({
          icon: 'success',
          title: 'Comentario agregado',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error al agregar comentario:', error);
      Swal.fire('Error', 'Error al agregar comentario', 'error');
    }
  };

  const handleDeleteComment = async (commentId) => {
    const result = await Swal.fire({
      title: '¿Eliminar comentario?',
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
        const response = await axios.delete(`/api/tasks/comments/${commentId}`);
        if (response.data.success) {
          await fetchComments();
          Swal.fire({
            icon: 'success',
            title: 'Comentario eliminado',
            timer: 1500,
            showConfirmButton: false
          });
        }
      } catch (error) {
        console.error('Error al eliminar comentario:', error);
        Swal.fire('Error', 'Error al eliminar comentario', 'error');
      }
    }
  };

  return (
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
    }}
    onClick={handleClose}
    >
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem'
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{
              margin: '0 0 0.5rem 0',
              color: '#1f2937',
              fontSize: '1.75rem',
              fontWeight: '700'
            }}>
              {task.title}
            </h2>
            {task.project_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: task.project_color,
                  display: 'inline-block'
                }} />
                <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                  {task.project_name}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleEdit}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: '#3b82f6',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ✏️ Editar
            </button>
            <button
              onClick={handleDelete}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: '#ef4444',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🗑️ Eliminar
            </button>
            <button
              onClick={handleClose}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                background: 'white',
                color: '#6b7280',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Badges de Estado y Prioridad */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <span style={{
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: '600',
            background: getStatusColor(task.status),
            color: 'white'
          }}>
            {getStatusIcon(task.status)} {task.status.replace('_', ' ').toUpperCase()}
          </span>
          <span style={{
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: '600',
            background: getPriorityColor(task.priority),
            color: 'white'
          }}>
            {getPriorityIcon(task.priority)} {task.priority.toUpperCase()}
          </span>
        </div>

        {/* Progreso */}
        {task.progreso > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '600', color: '#374151' }}>Progreso</span>
              <span style={{ fontWeight: '700', color: '#3b82f6' }}>{task.progreso}%</span>
            </div>
            <div style={{
              width: '100%',
              height: '12px',
              background: '#e5e7eb',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${task.progreso}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}

        {/* Descripción */}
        {task.description && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151', fontSize: '1.1rem' }}>
              Descripción
            </h3>
            <p style={{ color: '#6b7280', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {task.description}
            </p>
          </div>
        )}

        {/* Usuarios Asignados */}
        {task.assignees && task.assignees.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', color: '#374151', fontSize: '1.1rem' }}>
              👥 Usuarios Asignados
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {task.assignees.map(assignee => (
                <div
                  key={assignee.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: '#f9fafb',
                    padding: '0.75rem',
                    borderRadius: '8px'
                  }}
                >
                  {assignee.avatar ? (
                    <img 
                      src={`http://localhost:5000${assignee.avatar}`}
                      alt={assignee.nombres}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '40px',
                      height: '40px',
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
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>
                      {assignee.nombres} {assignee.apellidos}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {assignee.role || 'Asignado'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', color: '#374151', fontSize: '1.1rem' }}>
              🏷️ Tags
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {task.tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    background: '#e5e7eb',
                    color: '#374151',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          padding: '1rem',
          background: '#f9fafb',
          borderRadius: '8px'
        }}>
          {task.due_date && (
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Fecha Límite
              </div>
              <div style={{ fontWeight: '600', color: '#1f2937' }}>
                📅 {new Date(task.due_date).toLocaleString('es-ES')}
              </div>
            </div>
          )}
          {task.estimacion_horas && (
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Estimación
              </div>
              <div style={{ fontWeight: '600', color: '#1f2937' }}>
                ⏱️ {task.estimacion_horas} horas
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Creada
            </div>
            <div style={{ fontWeight: '600', color: '#1f2937' }}>
              📝 {new Date(task.created_at).toLocaleDateString('es-ES')}
            </div>
          </div>
          {task.creator_name && (
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Creador
              </div>
              <div style={{ fontWeight: '600', color: '#1f2937' }}>
                👤 {task.creator_name} {task.creator_lastname}
              </div>
            </div>
          )}
        </div>

        {/* Sección de comentarios funcional */}
        <div style={{ marginTop: '1.5rem', borderTop: '2px solid #e5e7eb', paddingTop: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '1.1rem' }}>
            💬 Comentarios y Detalles ({comments.length})
          </h3>

          {/* Formulario para agregar comentario */}
          <form onSubmit={handleAddComment} style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario o detalle sobre esta tarea..."
                rows="3"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  fontSize: '0.95rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: newComment.trim() ? '#3b82f6' : '#d1d5db',
                  color: 'white',
                  fontWeight: '600',
                  cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                  alignSelf: 'flex-start',
                  transition: 'all 0.2s'
                }}
              >
                📝 Agregar
              </button>
            </div>
          </form>

          {/* Lista de comentarios */}
          {loadingComments ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              Cargando comentarios...
            </div>
          ) : comments.length === 0 ? (
            <div style={{
              background: '#f9fafb',
              padding: '2rem',
              borderRadius: '8px',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💭</div>
              <p style={{ margin: 0 }}>No hay comentarios aún. ¡Sé el primero en comentar!</p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              maxHeight: '400px',
              overflow: 'auto',
              padding: '0.5rem'
            }}>
              {comments.map(comment => (
                <div
                  key={comment.id}
                  style={{
                    background: '#f9fafb',
                    borderRadius: '12px',
                    padding: '1rem',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  {/* Header del comentario */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.75rem'
                  }}>
                    {comment.avatar ? (
                      <img 
                        src={`http://localhost:5000${comment.avatar}`}
                        alt={comment.nombres}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem'
                      }}>
                        👤
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.95rem' }}>
                        {comment.nombres} {comment.apellidos}
                        <span style={{
                          marginLeft: '0.5rem',
                          fontSize: '0.8rem',
                          color: '#6b7280',
                          fontWeight: '500',
                          background: '#e5e7eb',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '10px'
                        }}>
                          {comment.rol}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        {new Date(comment.created_at).toLocaleString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    {/* Botón eliminar (solo si es el autor o admin) */}
                    {(currentUser.id === comment.user_id || currentUser.rol === 'Administrador') && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                          padding: '0.25rem',
                          opacity: 0.7,
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                        title="Eliminar comentario"
                      >
                        🗑️
                      </button>
                    )}
                  </div>

                  {/* Contenido del comentario */}
                  <div style={{
                    color: '#374151',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    paddingLeft: '3rem'
                  }}>
                    {comment.content}
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

export default Tasks;
