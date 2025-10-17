import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import { getImageUrl } from '../config/constants';
import NotificationBell from './NotificationBell';
import { showInstallPrompt, canInstallPWA } from '../utils/pwa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { config } = useConfig();
  const location = useLocation();
  const navigate = useNavigate();
  const [showInstallButton, setShowInstallButton] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleInstallPWA = () => {
    showInstallPrompt();
  };

  useEffect(() => {
    const checkInstallability = async () => {
      const canInstall = await canInstallPWA();
      setShowInstallButton(canInstall);
    };
    
    checkInstallability();
  }, []);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getLinkStyle = (path) => {
    const baseStyle = {
      textDecoration: 'none',
      fontWeight: '500',
      padding: '0.5rem 0.75rem',
      borderRadius: '6px',
      transition: 'all 0.3s ease',
      whiteSpace: 'nowrap',
      position: 'relative',
      overflow: 'hidden'
    };

    if (isActive(path)) {
      return {
        ...baseStyle,
        color: '#1f2937',
        fontWeight: '600',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderBottom: '2px solid #3b82f6',
        transform: 'translateY(-1px)',
        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)'
      };
    }

    return {
      ...baseStyle,
      color: '#6b7280'
    };
  };

  return (
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
        {/* Logo y nombre */}
        <Link to="/dashboard" style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#1f2937',
          whiteSpace: 'nowrap'
        }}>
          {config.logo ? (
            <img 
              src={`${getImageUrl(config.logo)}`} 
              alt="Logo" 
              style={{ 
                width: '45px', 
                height: '45px', 
                objectFit: 'contain'
              }} 
            />
          ) : (
            <span style={{ fontSize: '2.2rem' }}>📅</span>
          )}
          <span style={{ whiteSpace: 'nowrap' }}>{config.nombre_proyecto}</span>
        </Link>
        
        {/* Menú de navegación - SIEMPRE VISIBLE */}
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          <Link 
            to="/dashboard" 
            style={getLinkStyle('/dashboard')}
            onMouseEnter={(e) => {
              if (!isActive('/dashboard')) {
                e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
                e.target.style.color = '#3b82f6';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/dashboard')) {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#6b7280';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            Dashboard
          </Link>
          <Link 
            to="/calendario" 
            style={getLinkStyle('/calendario')}
            onMouseEnter={(e) => {
              if (!isActive('/calendario')) {
                e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
                e.target.style.color = '#3b82f6';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/calendario')) {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#6b7280';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            Calendario
          </Link>
          <Link 
            to="/eventos" 
            style={getLinkStyle('/eventos')}
            onMouseEnter={(e) => {
              if (!isActive('/eventos')) {
                e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
                e.target.style.color = '#3b82f6';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/eventos')) {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#6b7280';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            Eventos
          </Link>
          <Link 
            to="/tareas" 
            style={getLinkStyle('/tareas')}
            onMouseEnter={(e) => {
              if (!isActive('/tareas')) {
                e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
                e.target.style.color = '#3b82f6';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/tareas')) {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#6b7280';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            Tareas
          </Link>
          <Link 
            to="/reportes" 
            style={getLinkStyle('/reportes')}
            onMouseEnter={(e) => {
              if (!isActive('/reportes')) {
                e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
                e.target.style.color = '#3b82f6';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/reportes')) {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#6b7280';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            Reportes
          </Link>
          
          {/* Menú de administrador - SIEMPRE VISIBLE si es admin */}
          {user?.rol === 'administrador' && (
            <>
              <Link 
                to="/users" 
                style={getLinkStyle('/users')}
                onMouseEnter={(e) => {
                  if (!isActive('/users')) {
                    e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
                    e.target.style.color = '#3b82f6';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive('/users')) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#6b7280';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                Usuarios
              </Link>
              <Link 
                to="/settings" 
                style={getLinkStyle('/settings')}
                onMouseEnter={(e) => {
                  if (!isActive('/settings')) {
                    e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
                    e.target.style.color = '#3b82f6';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive('/settings')) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#6b7280';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                Configuración
              </Link>
            </>
          )}
          
          {/* Iconos de acción - SIEMPRE VISIBLES */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: '0.75rem' }}>
            <button 
              onClick={() => navigate('/profile')}
              style={{ 
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                padding: '0.25rem',
                borderRadius: '6px'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              title="Mi Perfil"
            >
              👤
            </button>
            
            {/* Campana de notificaciones */}
            <NotificationBell />

            {/* Botón de instalación PWA */}
            {showInstallButton && (
              <button
                onClick={handleInstallPWA}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  padding: '0.25rem',
                  borderRadius: '6px'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                title="Instalar App"
              >
                📱
              </button>
            )}

            <button 
              onClick={handleLogout} 
              style={{ 
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                padding: '0.25rem',
                borderRadius: '6px'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              title="Cerrar Sesión"
            >
              🚪
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
