# 🚀 Instrucciones para Subir el Sistema al Servidor

## 📋 **Resumen de Cambios Realizados**

### **✅ Mejoras Implementadas:**
1. **Navbar unificado** - Menú siempre visible en todas las páginas
2. **Dashboard mejorado** - Tareas recientes con diseño limpio
3. **Eventos con tabs** - Próximos y pasados, limitados a 3
4. **Vista previa de eventos** - Modal clickeable
5. **Usuarios mejorados** - Rol "Docente" por defecto, clave automática
6. **Notificaciones de archivos** - Email cuando se sube archivo a tarea
7. **Enlaces de email corregidos** - Eventos llevan a vista previa
8. **Backup de base de datos** - Exportación completa creada

## 📁 **Archivos a Subir**

### **1. BACKEND (calendar-backend):**

#### **Archivos Modificados:**
```
controllers/
├── calendar.controller.js (corregido campo date)
├── attachments.controller.js (notificaciones de archivos)
└── reports.controller.js (corregido proyecto_id)

services/
└── email.service.js (enlaces de eventos corregidos)

scripts/ (NUEVOS)
├── backup-database.js
├── export-database.js
└── backup-manual.js
```

### **2. FRONTEND (calendar-frontend):**

#### **Archivos Modificados:**
```
src/
├── components/
│   └── Navbar.jsx (NUEVO - menú unificado)
├── pages/
│   ├── Dashboard.jsx (tareas mejoradas)
│   ├── Events.jsx (tabs + modal)
│   └── Users.jsx (rol docente + clave automática)
└── config/
    └── constants.js (URLs de producción)
```

#### **Archivos de Build (COMPLETOS):**
```
dist/ (carpeta completa - archivos compilados)
```

## 🔧 **Pasos para Subir**

### **Paso 1: Subir Backend**
1. Conectar WinSCP a `vanguard@147.93.145.13`
2. Navegar a `/home/vanguard/calendar-backend/`
3. Subir archivos modificados:
   - `controllers/calendar.controller.js`
   - `controllers/attachments.controller.js`
   - `controllers/reports.controller.js`
   - `services/email.service.js`
   - `scripts/` (carpeta completa)

### **Paso 2: Subir Frontend**
1. Cambiar a `/home/vanguard/calendar-frontend/`
2. Subir archivos modificados:
   - `src/components/Navbar.jsx`
   - `src/pages/Dashboard.jsx`
   - `src/pages/Events.jsx`
   - `src/pages/Users.jsx`
   - `src/config/constants.js`
3. **IMPORTANTE**: Reemplazar toda la carpeta `dist/` con la nueva

### **Paso 3: Reiniciar Servicios**
```bash
# En el servidor, reiniciar el backend
pm2 restart calendar-backend

# O si usa systemd
sudo systemctl restart calendar-backend
```

## ⚠️ **Archivos NO Subir**

### **NO subir estos archivos:**
- `node_modules/` (carpetas completas)
- `.env` (archivos de configuración local)
- `backup-database/` (solo para respaldo local)
- Archivos de desarrollo (`.git`, `*.log`)

## 🎯 **Verificación Post-Subida**

### **1. Verificar Frontend:**
- Ir a https://calendar.vanguardschools.edu.pe/
- Verificar que el menú esté unificado
- Probar vista previa de eventos
- Verificar dashboard mejorado

### **2. Verificar Backend:**
- Probar creación de eventos
- Verificar notificaciones de archivos
- Probar reportes
- Verificar emails

## 📊 **Base de Datos**

### **Backup Creado:**
- Archivo: `backup-database/sistema_agenda_manual_2025-10-16T23-02-11.sql`
- Tamaño: 49 KB
- Contenido: Estructura + Datos completos
- **NO subir** - Solo para respaldo local

## 🔗 **URLs de Producción**

### **Configuración Actual:**
- **Frontend**: https://calendar.vanguardschools.edu.pe/
- **Backend API**: https://calendar.vanguardschools.edu.pe/api
- **Servidor**: 147.93.145.13

## ✅ **Checklist de Subida**

- [ ] Subir archivos del backend modificados
- [ ] Subir archivos del frontend modificados
- [ ] Reemplazar carpeta `dist/` completa
- [ ] Reiniciar servicios del backend
- [ ] Verificar funcionamiento del frontend
- [ ] Probar funcionalidades nuevas
- [ ] Verificar emails y notificaciones

---
**Fecha**: 16 de Octubre de 2025  
**Sistema**: Vanguard Calendar  
**Estado**: ✅ Listo para subir
