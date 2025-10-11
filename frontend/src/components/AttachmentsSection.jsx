import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const AttachmentsSection = ({ taskId, assignedUsers }) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Verificar si el usuario actual está asignado a la tarea
  const isUserAssigned = assignedUsers && assignedUsers.length > 0;

  useEffect(() => {
    if (taskId && isUserAssigned) {
      fetchAttachments();
    }
  }, [taskId, isUserAssigned]);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/attachments/task/${taskId}`);
      if (response.data.success) {
        setAttachments(response.data.data);
      }
    } catch (error) {
      console.error('Error al obtener adjuntos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!isUserAssigned) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin permisos',
        text: 'Solo los usuarios asignados pueden subir archivos'
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const response = await axios.post(`/api/attachments/task/${taskId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setAttachments(prev => [response.data.data, ...prev]);
        Swal.fire({
          icon: 'success',
          title: 'Archivo subido',
          text: 'El archivo se ha subido exitosamente'
        });
      }
    } catch (error) {
      console.error('Error al subir archivo:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Error al subir archivo'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachment) => {
    try {
      const response = await axios.get(`/api/attachments/${attachment.id}/download`, {
        responseType: 'blob'
      });

      // Crear URL temporal para descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.original_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'Descarga iniciada',
        text: `Descargando ${attachment.original_name}`
      });
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al descargar el archivo'
      });
    }
  };

  const handleDelete = async (attachment) => {
    const result = await Swal.fire({
      title: '¿Eliminar archivo?',
      text: `¿Estás seguro de eliminar "${attachment.original_name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/attachments/${attachment.id}`);
        setAttachments(prev => prev.filter(att => att.id !== attachment.id));
        Swal.fire({
          icon: 'success',
          title: 'Archivo eliminado',
          text: 'El archivo ha sido eliminado exitosamente'
        });
      } catch (error) {
        console.error('Error al eliminar archivo:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al eliminar el archivo'
        });
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    // Si es hoy, mostrar solo la hora
    if (diffInHours < 24 && date.toDateString() === now.toDateString()) {
      return `Hoy ${date.toLocaleTimeString('es-PE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    }
    
    // Si es ayer
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Ayer ${date.toLocaleTimeString('es-PE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    }
    
    // Si es hace más de un día, mostrar fecha completa
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    return '📎';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  if (!isUserAssigned) {
    return (
      <div style={{
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        border: '2px dashed rgba(255, 255, 255, 0.3)',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.7)'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</div>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          Solo los usuarios asignados pueden ver y gestionar archivos
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <h4 style={{ 
        color: '#374151', 
        marginBottom: '1rem', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem' 
      }}>
        📎 Archivos Adjuntos
        {attachments.length > 0 && (
          <span style={{
            background: '#3b82f6',
            color: 'white',
            borderRadius: '12px',
            padding: '0.25rem 0.5rem',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            {attachments.length}
          </span>
        )}
      </h4>

      {/* Zona de subida */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: dragOver ? '2px dashed #3b82f6' : '2px dashed #d1d5db',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          background: dragOver ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.5)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          marginBottom: '1rem'
        }}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileInput}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.zip,.rar"
        />
        
        {uploading ? (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
            <p style={{ margin: 0, color: '#6b7280' }}>Subiendo archivo...</p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📤</div>
            <p style={{ margin: 0, color: '#6b7280' }}>
              Arrastra un archivo aquí o haz clic para seleccionar
            </p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
              Máximo 10MB • PDF, Word, Excel, imágenes, etc.
            </p>
          </div>
        )}
      </div>

      {/* Lista de archivos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
          <p>Cargando archivos...</p>
        </div>
      ) : attachments.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          color: '#9ca3af',
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '12px',
          border: '1px dashed rgba(156, 163, 175, 0.3)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📂</div>
          <p style={{ margin: 0 }}>No hay archivos adjuntos</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid rgba(229, 231, 235, 0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Icono del archivo */}
              <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                {getFileIcon(attachment.file_type)}
              </div>

              {/* Información del archivo */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '0.25rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {attachment.original_name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>{formatFileSize(attachment.file_size)}</span>
                  <span>v{attachment.version}</span>
                  <span>
                    por {attachment.user?.nombres || 'Usuario'} {attachment.user?.apellidos || ''}
                  </span>
                  <span style={{ color: '#9ca3af' }}>
                    📅 {formatDateTime(attachment.created_at)}
                  </span>
                </div>
              </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleDownload(attachment)}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                  onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                  title="Descargar archivo"
                >
                  ⬇️
                </button>
                <button
                  onClick={() => handleDelete(attachment)}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#dc2626'}
                  onMouseLeave={(e) => e.target.style.background = '#ef4444'}
                  title="Eliminar archivo"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttachmentsSection;
