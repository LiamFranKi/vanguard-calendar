const fs = require('fs');
const path = require('path');

// Función para procesar un archivo
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Reemplazar URLs hardcodeadas de localhost:5000
    const replacements = [
      // Para imágenes y assets
      {
        pattern: /http:\/\/localhost:5000\$\{([^}]+)\}/g,
        replacement: (match, p1) => `\${getImageUrl(${p1})}`
      },
      // Para URLs directas
      {
        pattern: /http:\/\/localhost:5000/g,
        replacement: '${getServerUrl()}'
      }
    ];

    replacements.forEach(({ pattern, replacement }) => {
      if (typeof replacement === 'function') {
        const newContent = content.replace(pattern, replacement);
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      } else {
        const newContent = content.replace(pattern, replacement);
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      }
    });

    // Si el archivo fue modificado, agregar el import si no existe
    if (modified) {
      if (!content.includes("import { getImageUrl, getServerUrl }")) {
        // Encontrar la primera línea de import
        const lines = content.split('\n');
        let insertIndex = 0;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ') && !lines[i].includes('getImageUrl') && !lines[i].includes('getServerUrl')) {
            insertIndex = i + 1;
          }
        }
        
        lines.splice(insertIndex, 0, "import { getImageUrl, getServerUrl } from '../config/constants';");
        content = lines.join('\n');
      }
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Actualizado: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
  }
}

// Función para procesar un directorio recursivamente
function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
      processFile(fullPath);
    }
  });
}

// Procesar la carpeta src
const srcPath = path.join(__dirname, 'src');
console.log('🔧 Iniciando corrección de URLs...');
processDirectory(srcPath);
console.log('✅ Corrección completada!');
