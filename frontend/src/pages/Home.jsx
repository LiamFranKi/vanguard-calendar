import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';

function Home() {
  const { isAuthenticated } = useAuth();
  const { config, loading } = useConfig();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Navbar moderno */}
      <nav style={{
        background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '1rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="container" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <Link 
            to="/" 
            style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
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
            <span style={{
              color: '#1f2937'
            }}>
              {config.nombre_proyecto}
            </span>
          </Link>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn btn-secondary">Dashboard</Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary">Iniciar Sesión</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        background: `linear-gradient(135deg, ${config.color_primario} 0%, ${config.color_secundario} 100%)`,
        color: 'white',
        padding: '6rem 0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Elementos decorativos */}
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          top: '-150px',
          right: '-100px',
          animation: 'float 8s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          bottom: '-100px',
          left: '-80px',
          animation: 'float 6s ease-in-out infinite reverse'
        }}></div>

        <div className="container" style={{ 
          textAlign: 'center', 
          position: 'relative',
          zIndex: 1
        }}>
          <h1 style={{ 
            fontSize: '3.5rem', 
            marginBottom: '1.5rem',
            fontWeight: '800',
            color: 'white',
            fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
            letterSpacing: '-0.02em',
            lineHeight: '1.1'
          }}>
            {config.nombre_proyecto}
          </h1>
          <p style={{ 
            fontSize: '1.5rem', 
            marginBottom: '3rem',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto 3rem',
            fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
            fontWeight: '400',
            lineHeight: '1.6'
          }}>
            {config.descripcion_proyecto}
          </p>
          
          {!isAuthenticated && (
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link 
                to="/login" 
                style={{
                  padding: '1rem 2.5rem',
                  background: 'white',
                  color: config.color_primario,
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s',
                  display: 'inline-block'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-3px)';
                  e.target.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
                }}
              >
                Comenzar Ahora →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '5rem 0', background: 'white' }}>
        <div className="container">
          <h2 style={{ 
            textAlign: 'center', 
            fontSize: '2.5rem', 
            marginBottom: '3rem',
            color: '#1f2937'
          }}>
            Características Principales
          </h2>

          <div className="grid grid-cols-3" style={{ gap: '2rem' }}>
            {/* Feature 1 */}
            <div style={{ 
              padding: '2rem',
              background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
              borderRadius: '15px',
              textAlign: 'center',
              transition: 'all 0.3s',
              border: '1px solid #e5e7eb'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{ 
                fontSize: '4rem', 
                marginBottom: '1rem'
              }}>📅</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>
                Calendario Interactivo
              </h3>
              <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: '1.6' }}>
                Gestiona todos tus eventos en un calendario intuitivo con vistas diaria, semanal y mensual.
              </p>
            </div>

            {/* Feature 2 */}
            <div style={{ 
              padding: '2rem',
              background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
              borderRadius: '15px',
              textAlign: 'center',
              transition: 'all 0.3s',
              border: '1px solid #e5e7eb'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{ 
                fontSize: '4rem', 
                marginBottom: '1rem'
              }}>🔔</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>
                Notificaciones Push
              </h3>
              <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: '1.6' }}>
                Recibe recordatorios automáticos de tus eventos y tareas importantes por push y email.
              </p>
            </div>

            {/* Feature 3 */}
            <div style={{ 
              padding: '2rem',
              background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
              borderRadius: '15px',
              textAlign: 'center',
              transition: 'all 0.3s',
              border: '1px solid #e5e7eb'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{ 
                fontSize: '4rem', 
                marginBottom: '1rem'
              }}>📊</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>
                Reportes Profesionales
              </h3>
              <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: '1.6' }}>
                Genera reportes detallados en PDF y Excel con gráficos y estadísticas completas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        background: `linear-gradient(135deg, ${config.color_primario} 0%, ${config.color_secundario} 100%)`,
        padding: '5rem 0',
        color: 'white',
        textAlign: 'center'
      }}>
        <div className="container">
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', fontWeight: '700' }}>
            ¿Listo para optimizar tu tiempo?
          </h2>
          <p style={{ fontSize: '1.25rem', marginBottom: '2rem', opacity: 0.95 }}>
            Únete a Vanguard Calendar y lleva tu organización al siguiente nivel
          </p>
          {!isAuthenticated && (
            <Link 
              to="/login" 
              style={{
                padding: '1rem 2.5rem',
                background: 'white',
                color: config.color_primario,
                borderRadius: '10px',
                fontSize: '1.1rem',
                fontWeight: '600',
                textDecoration: 'none',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                transition: 'all 0.3s',
                display: 'inline-block'
              }}
            >
              Comenzar Ahora →
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        background: '#1f2937', 
        color: 'white', 
        padding: '2rem 0',
        textAlign: 'center'
      }}>
        <div className="container">
          <p style={{ margin: 0, opacity: 0.8 }}>
            © 2025 {config.nombre_proyecto}. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}

export default Home;
