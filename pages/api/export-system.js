/**
 * AI CODE MENTOR V4.1 - Permanent Export System API
 * Sistema de exportación permanente de lecciones, ejercicios, plantillas, etc.
 */

const fs = require('fs');
const path = require('path');

// Create permanent exports directory structure
function ensureExportDirectories() {
  const baseDir = path.join(process.cwd(), 'exports');
  const dirs = [
    'lecciones',
    'ejercicios', 
    'plantillas',
    'analisis-codigo',
    'portfolio',
    'progreso'
  ];
  
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  
  dirs.forEach(dir => {
    const dirPath = path.join(baseDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
  
  return baseDir;
}

// Export lesson to permanent file
function exportLesson(lesson, format = 'json') {
  const baseDir = ensureExportDirectories();
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  const filename = `${lesson.path.replace(/\./g, '_')}_${timestamp}`;
  
  let content, extension;
  
  switch (format) {
    case 'json':
      content = JSON.stringify(lesson, null, 2);
      extension = 'json';
      break;
      
    case 'markdown':
      content = `# ${lesson.title}

**Ruta:** ${lesson.path}  
**Dificultad:** ${lesson.difficulty}  
**Tiempo:** ${lesson.estimated_time}  
**Generado:** ${new Date(lesson.generated_at).toLocaleString()}  
**Fuente:** ${lesson.source_url}

---

## 📖 Contenido de la Lección

${lesson.content}

---

## 💡 Ejercicios Prácticos

${lesson.exercises && lesson.exercises.length > 0 
  ? lesson.exercises.map((exercise, index) => `### Ejercicio ${index + 1}
${exercise}

`).join('\n')
  : 'No hay ejercicios disponibles.'}

---

## 🎯 Temas Cubiertos

${lesson.topics ? lesson.topics.map(topic => `- ${topic}`).join('\n') : 'No especificado'}

---

*Exportado por AI Code Mentor V4.1 - ${new Date().toLocaleString()}*
`;
      extension = 'md';
      break;
      
    default:
      throw new Error(`Formato no soportado: ${format}`);
  }
  
  const filePath = path.join(baseDir, 'lecciones', `${filename}.${extension}`);
  fs.writeFileSync(filePath, content, 'utf8');
  
  return {
    filePath,
    filename: `${filename}.${extension}`,
    size: content.length,
    format
  };
}

// Export user progress/portfolio
function exportPortfolio(userProgress) {
  const baseDir = ensureExportDirectories();
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  
  const portfolioData = {
    exportDate: new Date().toISOString(),
    userProgress,
    summary: {
      totalLessons: userProgress.completedLessons?.length || 0,
      totalExercises: userProgress.completedExercises?.length || 0,
      totalTime: userProgress.totalStudyTime || 0,
      currentStreak: userProgress.currentStreak || 0
    },
    generatedBy: 'AI Code Mentor V4.1'
  };
  
  const filename = `portfolio_${timestamp}.json`;
  const filePath = path.join(baseDir, 'portfolio', filename);
  
  fs.writeFileSync(filePath, JSON.stringify(portfolioData, null, 2), 'utf8');
  
  return { filePath, filename, data: portfolioData };
}

// List all exports
function listExports() {
  const baseDir = path.join(process.cwd(), 'exports');
  
  if (!fs.existsSync(baseDir)) {
    return { lecciones: [], ejercicios: [], plantillas: [], portfolio: [] };
  }
  
  const categories = ['lecciones', 'ejercicios', 'plantillas', 'portfolio'];
  const result = {};
  
  categories.forEach(category => {
    const categoryPath = path.join(baseDir, category);
    if (fs.existsSync(categoryPath)) {
      const files = fs.readdirSync(categoryPath).map(filename => {
        const filePath = path.join(categoryPath, filename);
        const stats = fs.statSync(filePath);
        
        return {
          filename,
          path: filePath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      }).sort((a, b) => b.created - a.created);
      
      result[category] = files;
    } else {
      result[category] = [];
    }
  });
  
  return result;
}

export default async function handler(req, res) {
  const { action } = req.query;
  
  try {
    switch (action) {
      case 'export-lesson':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Método no permitido' });
        }
        
        const { lesson, format } = req.body;
        
        if (!lesson) {
          return res.status(400).json({ error: 'Lección requerida para exportar' });
        }
        
        const exportResult = exportLesson(lesson, format || 'json');
        
        console.log(`📁 Lesson exported: ${exportResult.filename}`);
        
        res.json({
          success: true,
          message: 'Lección exportada exitosamente',
          export: exportResult
        });
        break;
        
      case 'export-portfolio':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Método no permitido' });
        }
        
        const { userProgress } = req.body;
        const portfolioResult = exportPortfolio(userProgress || {});
        
        console.log(`📊 Portfolio exported: ${portfolioResult.filename}`);
        
        res.json({
          success: true,
          message: 'Portfolio exportado exitosamente',
          export: portfolioResult
        });
        break;
        
      case 'list-exports':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Método no permitido' });
        }
        
        const exports = listExports();
        
        res.json({
          success: true,
          exports,
          totalFiles: Object.values(exports).reduce((sum, arr) => sum + arr.length, 0)
        });
        break;
        
      default:
        res.status(400).json({ 
          error: 'Acción no válida',
          availableActions: ['export-lesson', 'export-portfolio', 'list-exports']
        });
    }
    
  } catch (error) {
    console.error('❌ Export system error:', error.message);
    res.status(500).json({ 
      error: 'Error en sistema de exportación',
      details: error.message
    });
  }
}
