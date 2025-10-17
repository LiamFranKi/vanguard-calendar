import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import Navbar from '../components/Navbar';
import axios from 'axios';
import Swal from 'sweetalert2';
import { getImageUrl, getServerUrl } from '../config/constants';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const { config } = useConfig();
  const [formData, setFormData] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    clave: '',
    rol: 'docente'
  });
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.rol !== 'administrador')) {
      navigate('/dashboard');
    } else if (!authLoading && isAuthenticated && user?.rol === 'administrador') {
      fetchUsers();
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data.users);
      setLoading(false);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDniChange = (e) => {
    const dniValue = e.target.value;
    setFormData({
      ...formData,
      dni: dniValue,
      clave: dniValue // La clave será igual al DNI
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('dni', formData.dni);
      formDataToSend.append('nombres', formData.nombres);
      formDataToSend.append('apellidos', formData.apellidos);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('telefono', formData.telefono);
      formDataToSend.append('rol', formData.rol);
      if (formData.clave) {
        formDataToSend.append('clave', formData.clave);
      }
      if (avatar) {
        formDataToSend.append('avatar', avatar);
      }
      
      if (editingUser) {
        await axios.put(`/api/users/${editingUser.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire('¡Éxito!', 'Usuario actualizado correctamente', 'success');
      } else {
        await axios.post('/api/users', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire('¡Éxito!', 'Usuario creado correctamente', 'success');
      }
      
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      Swal.fire('Error', error.response?.data?.message || 'Error al guardar el usuario', 'error');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      dni: user.dni,
      nombres: user.nombres,
      apellidos: user.apellidos,
      email: user.email || '',
      telefono: user.telefono || '',
      clave: '',
      rol: user.rol
    });
    if (user.avatar) {
      setAvatarPreview(`${getImageUrl(user.avatar)}`);
    } else {
      setAvatarPreview(null);
    }
    setAvatar(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/users/${id}`);
        Swal.fire('¡Eliminado!', 'El usuario ha sido eliminado', 'success');
        fetchUsers();
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        Swal.fire('Error', error.response?.data?.message || 'Error al eliminar el usuario', 'error');
      }
    }
  };


  const resetForm = () => {
    setFormData({
      dni: '',
      nombres: '',
      apellidos: '',
      email: '',
      telefono: '',
      clave: '',
      rol: 'docente'
    });
    setAvatar(null);
    setAvatarPreview(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (authLoading || loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!isAuthenticated || user?.rol !== 'administrador') {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${config.color_primario || '#667eea'}CC 0%, ${config.color_secundario || '#764ba2'}CC 100%)`,
      position: 'relative'
    }}>
      {/* Navbar unificado */}
      <Navbar />

      {/* Contenido principal */}
      <main style={{ padding: '3rem 0' }}>
        <div className="container">
          {/* Header con título y botón */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: '2.5rem', 
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              padding: '1.5rem 2rem',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#1f2937',
              fontWeight: '800',
              flex: 1
            }}>
              👥 Gestión de Usuarios
            </h1>
            
            <button 
              onClick={() => { resetForm(); setEditingUser(null); setShowModal(true); }}
              style={{
                padding: '1rem 2rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                transition: 'transform 0.2s, box-shadow 0.2s'
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
              ➕ Nuevo Usuario
            </button>
          </div>

          {/* Tabla de usuarios */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            overflowX: 'auto'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', color: '#1f2937' }}>Avatar</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', color: '#1f2937' }}>DNI</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', color: '#1f2937' }}>Nombres</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', color: '#1f2937' }}>Apellidos</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', color: '#1f2937' }}>Email</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', color: '#1f2937' }}>Rol</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '700', color: '#1f2937' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userItem) => (
                  <tr key={userItem.id} style={{ 
                    borderBottom: '1px solid #e5e7eb',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        backgroundColor: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `2px solid ${config.color_primario || '#667eea'}30`
                      }}>
                        {userItem.avatar ? (
                          <img 
                            src={`${getImageUrl(userItem.avatar)}`} 
                            alt={userItem.nombres}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span style={{ fontSize: '1.5rem' }}>👤</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '500', color: '#374151' }}>{userItem.dni}</td>
                    <td style={{ padding: '1rem', color: '#374151' }}>{userItem.nombres}</td>
                    <td style={{ padding: '1rem', color: '#374151' }}>{userItem.apellidos}</td>
                    <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.9rem' }}>{userItem.email || '-'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        background: userItem.rol === 'administrador' 
                          ? 'linear-gradient(135deg, #f87171, #dc2626)' 
                          : userItem.rol === 'docente' 
                          ? 'linear-gradient(135deg, #60a5fa, #2563eb)' 
                          : 'linear-gradient(135deg, #34d399, #059669)',
                        color: 'white',
                        textTransform: 'capitalize',
                        display: 'inline-block'
                      }}>
                        {userItem.rol}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                        <button 
                          onClick={() => handleEdit(userItem)}
                          title="Editar"
                          style={{
                            padding: '0.375rem',
                            background: 'transparent',
                            color: '#3b82f6',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.1rem',
                            transition: 'transform 0.2s, color 0.2s',
                            borderRadius: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.15)';
                            e.target.style.color = '#2563eb';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.color = '#3b82f6';
                          }}
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDelete(userItem.id)}
                          title="Eliminar"
                          style={{
                            padding: '0.375rem',
                            background: 'transparent',
                            color: '#ef4444',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.1rem',
                            transition: 'transform 0.2s, color 0.2s',
                            borderRadius: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.15)';
                            e.target.style.color = '#dc2626';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.color = '#ef4444';
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div style={{
                padding: '4rem 2rem',
                textAlign: 'center',
                color: '#9ca3af'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👥</div>
                <p style={{ fontSize: '1.1rem', margin: 0 }}>No hay usuarios registrados</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}
        onClick={() => { setShowModal(false); setEditingUser(null); resetForm(); }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(10px)',
              borderRadius: '24px',
              padding: '2.5rem',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <h2 style={{ 
              marginBottom: '2rem',
              fontSize: '2rem',
              fontWeight: '800',
              background: `linear-gradient(135deg, ${config.color_primario || '#667eea'}, ${config.color_secundario || '#764ba2'})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {editingUser ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              {/* Avatar */}
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                  width: '140px',
                  height: '140px',
                  margin: '0 auto 1.5rem',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: `4px solid ${config.color_primario || '#667eea'}`,
                  boxShadow: `0 10px 30px ${config.color_primario || '#667eea'}40`,
                  backgroundColor: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Avatar" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '5rem' }}>👤</span>
                  )}
                </div>

                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
                <label 
                  htmlFor="avatar-upload" 
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.5rem',
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  📷 Cambiar Foto
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                    DNI *
                  </label>
                  <input
                    type="text"
                    name="dni"
                    value={formData.dni}
                    onChange={handleDniChange}
                    required
                    maxLength="8"
                    disabled={editingUser}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '2px solid #e5e7eb',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s',
                      outline: 'none',
                      backgroundColor: editingUser ? '#f3f4f6' : 'white',
                      cursor: editingUser ? 'not-allowed' : 'text'
                    }}
                    onFocus={(e) => !editingUser && (e.target.style.borderColor = config.color_primario || '#667eea')}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Nombres *
                    </label>
                    <input
                      type="text"
                      name="nombres"
                      value={formData.nombres}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '2px solid #e5e7eb',
                        fontSize: '1rem',
                        transition: 'border-color 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = config.color_primario || '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      name="apellidos"
                      value={formData.apellidos}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '2px solid #e5e7eb',
                        fontSize: '1rem',
                        transition: 'border-color 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = config.color_primario || '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '2px solid #e5e7eb',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = config.color_primario || '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '2px solid #e5e7eb',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = config.color_primario || '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                    Clave {editingUser && <span style={{ color: '#6b7280', fontSize: '0.85rem', fontWeight: '400' }}>(dejar en blanco para no cambiar)</span>}
                  </label>
                  <input
                    type="password"
                    name="clave"
                    value={formData.clave}
                    onChange={handleInputChange}
                    required={!editingUser}
                    minLength="6"
                    disabled={!editingUser}
                    placeholder={editingUser ? "Dejar vacío para mantener la actual" : "Se llena automáticamente con el DNI"}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '2px solid #e5e7eb',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s',
                      outline: 'none',
                      backgroundColor: editingUser ? 'white' : '#f9fafb',
                      color: editingUser ? '#1f2937' : '#9ca3af'
                    }}
                    onFocus={(e) => e.target.style.borderColor = config.color_primario || '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                    Rol *
                  </label>
                  <select
                    name="rol"
                    value={formData.rol}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '2px solid #e5e7eb',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => e.target.style.borderColor = config.color_primario || '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  >
                    <option value="estudiante">Estudiante</option>
                    <option value="docente">Docente</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button 
                  type="submit" 
                  style={{
                    flex: 1,
                    padding: '1rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '1.05rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
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
                  {editingUser ? '💾 Actualizar' : '✓ Crear'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); setEditingUser(null); resetForm(); }}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    background: 'white',
                    color: '#6b7280',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '1.05rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#ef4444';
                    e.target.style.color = '#ef4444';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.color = '#6b7280';
                  }}
                >
                  ✗ Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
