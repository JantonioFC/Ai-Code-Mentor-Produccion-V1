/**
 * AI CODE MENTOR V4.2 - Auto-Save System API
 * Sistema de guardado automático 100% - Sin intervención manual
 * Registra todo: lecciones, ejercicios, progreso, correcciones
 */

const fs = require('fs');
const path = require('path');

// Auto-save directories structure
const AUTO_SAVE_DIRS = {
  lessons: 'exports/lecciones',
  exercises: 'exports/ejercicios',
  progress: 'exports/progreso',
  corrections: 'exports/correcciones',
  sessions: 'exports/sesiones'
};

// Ensure all auto-save directories exist
function ensureAutoSaveDirectories() {
  Object.values(AUTO_SAVE_DIRS).forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Created auto-save directory: ${dir}`);
    }
  });
}

// Auto-save lesson with timestamp and metadata
function autoSaveLesson(lesson, metadata = {}) {
  try {
    ensureAutoSaveDirectories();

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const filename = `${lesson.path.replace(/\./g, '_')}_${timestamp}`;

    // Save JSON version for data processing
    const jsonData = {
      ...lesson,
      auto_saved_at: new Date().toISOString(),
      session_info: metadata,
      save_type: 'automatic',
      version: '4.2'
    };

    const jsonPath = path.join(process.cwd(), AUTO_SAVE_DIRS.lessons, `${filename}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');

    // Save Markdown version for human reading
    const markdownContent = generateLessonMarkdown(lesson, metadata);
    const mdPath = path.join(process.cwd(), AUTO_SAVE_DIRS.lessons, `${filename}.md`);
    fs.writeFileSync(mdPath, markdownContent, 'utf8');

    console.log(`💾 AUTO-SAVED: Lesson ${lesson.title} → ${filename}`);

    return {
      json_file: `${filename}.json`,
      markdown_file: `${filename}.md`,
      saved_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error auto-saving lesson:', error.message);
    return null;
  }
}

// Generate comprehensive markdown for lessons
function generateLessonMarkdown(lesson, metadata) {
  return `# ${lesson.title}

---
**📊 METADATOS DEL APRENDIZAJE**
- **Ruta de Lección:** ${lesson.path}
- **Dificultad:** ${lesson.difficulty}
- **Tiempo Estimado:** ${lesson.estimated_time}
- **Generado:** ${new Date(lesson.generated_at).toLocaleString()}
- **Auto-Guardado:** ${new Date().toLocaleString()}
- **Fuente Oficial:** ${lesson.source_url}
- **Temas Cubiertos:** ${lesson.topics ? lesson.topics.join(', ') : 'No especificado'}
${metadata.user_session ? `- **Sesión de Usuario:** ${metadata.user_session}` : ''}

---

## 📖 CONTENIDO EDUCATIVO COMPLETO

${lesson.content || 'Contenido no disponible'}

---

## 💡 EJERCICIOS PRÁCTICOS INTEGRADOS

${lesson.exercises && lesson.exercises.length > 0
      ? lesson.exercises.map((exercise, index) => `### 🎯 Ejercicio ${index + 1}

${exercise}

**Estado:** ⏳ Pendiente de realización
**Entorno:** Integrado con corrección automática
**Guardado:** Automático al completar

---`).join('\n')
      : '⚠️ No se generaron ejercicios para esta lección.'}

---

## 📈 PROGRESO DE APRENDIZAJE

- **✅ Lección Generada:** ${new Date().toLocaleString()}
- **⏳ Ejercicios Pendientes:** ${lesson.exercises ? lesson.exercises.length : 0}
- **🎯 Siguiente Paso:** Realizar ejercicios en entorno integrado
- **📊 Registro Automático:** Todas las actividades se guardan automáticamente

---

## 🔄 SISTEMA DE TRACKING AUTOMÁTICO

Este archivo fue creado automáticamente por AI Code Mentor V4.2. 
Todas las actividades de aprendizaje se registran sin necesidad de intervención manual:

- ✅ **Lecciones:** Auto-guardadas al generarse
- ✅ **Ejercicios:** Auto-guardados al completarse  
- ✅ **Correcciones:** Auto-guardadas con feedback de IA
- ✅ **Progreso:** Tracking continuo y automático
- ✅ **Sesiones:** Registro completo de actividad

**📁 Ubicación de Archivos:**
- **JSON (datos):** /exports/lecciones/${lesson.path.replace(/\./g, '_')}_*.json
- **Markdown (lectura):** /exports/lecciones/${lesson.path.replace(/\./g, '_')}_*.md

---

*🤖 Generado por AI Code Mentor V4.2 - Sistema de Aprendizaje con Guardado Automático*
*📅 ${new Date().toLocaleString()} - Biblioteca Personal de Conocimiento*
`;
}

// Auto-save exercise completion
function autoSaveExerciseCompletion(exerciseData) {
  try {
    ensureAutoSaveDirectories();

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const filename = `${exerciseData.lessonPath.replace(/\./g, '_')}_exercise_${exerciseData.exerciseId}_${timestamp}.json`;

    const completionData = {
      ...exerciseData,
      auto_saved_at: new Date().toISOString(),
      completion_type: 'automatic',
      version: '4.2'
    };

    const filePath = path.join(process.cwd(), AUTO_SAVE_DIRS.exercises, filename);
    fs.writeFileSync(filePath, JSON.stringify(completionData, null, 2), 'utf8');

    console.log(`💾 AUTO-SAVED: Exercise completion → ${filename}`);
    return filename;

  } catch (error) {
    console.error('❌ Error auto-saving exercise:', error.message);
    return null;
  }
}

// Auto-save user session and progress
function autoSaveSessionProgress(sessionData) {
  try {
    ensureAutoSaveDirectories();

    const today = new Date().toISOString().slice(0, 10);
    const sessionId = `session_${today}_${Date.now()}`;

    const progressData = {
      session_id: sessionId,
      date: new Date().toISOString(),
      ...sessionData,
      auto_saved: true,
      version: '4.2'
    };

    // Save session data
    const sessionPath = path.join(process.cwd(), AUTO_SAVE_DIRS.sessions, `${sessionId}.json`);
    fs.writeFileSync(sessionPath, JSON.stringify(progressData, null, 2), 'utf8');

    // Update daily progress summary
    updateDailyProgressSummary(progressData);

    console.log(`📊 AUTO-SAVED: Session progress → ${sessionId}`);
    return sessionId;

  } catch (error) {
    console.error('❌ Error auto-saving session:', error.message);
    return null;
  }
}

// Update daily progress summary
function updateDailyProgressSummary(sessionData) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const summaryPath = path.join(process.cwd(), AUTO_SAVE_DIRS.progress, `daily_progress_${today}.json`);

    let dailyProgress = {};
    if (fs.existsSync(summaryPath)) {
      dailyProgress = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    }

    // Initialize if new day
    if (!dailyProgress.date) {
      dailyProgress = {
        date: today,
        sessions: [],
        lessons_completed: [],
        exercises_completed: [],
        total_study_time: 0,
        created_at: new Date().toISOString(),
        version: '4.2'
      };
    }

    // Add session
    dailyProgress.sessions.push(sessionData.session_id);
    dailyProgress.last_updated = new Date().toISOString();

    // Add lesson if completed
    if (sessionData.lesson_completed) {
      dailyProgress.lessons_completed.push(sessionData.lesson_completed);
    }

    // Add exercises if completed
    if (sessionData.exercises_completed) {
      dailyProgress.exercises_completed.push(...sessionData.exercises_completed);
    }

    fs.writeFileSync(summaryPath, JSON.stringify(dailyProgress, null, 2), 'utf8');

  } catch (error) {
    console.error('❌ Error updating daily progress:', error.message);
  }
}

// Get comprehensive learning statistics
function getLearningStatistics() {
  try {
    ensureAutoSaveDirectories();

    const stats = {
      total_lessons: 0,
      total_exercises: 0,
      total_sessions: 0,
      languages_studied: new Set(),
      difficulty_distribution: {},
      recent_activity: [],
      generated_at: new Date().toISOString()
    };

    // Analyze lessons
    const lessonsDir = path.join(process.cwd(), AUTO_SAVE_DIRS.lessons);
    if (fs.existsSync(lessonsDir)) {
      const lessonFiles = fs.readdirSync(lessonsDir).filter(f => f.endsWith('.json'));
      stats.total_lessons = lessonFiles.length;

      lessonFiles.forEach(file => {
        try {
          const lesson = JSON.parse(fs.readFileSync(path.join(lessonsDir, file), 'utf8'));
          if (lesson.path) {
            const language = lesson.path.split('.')[0];
            stats.languages_studied.add(language);
          }
          if (lesson.difficulty) {
            stats.difficulty_distribution[lesson.difficulty] =
              (stats.difficulty_distribution[lesson.difficulty] || 0) + 1;
          }
        } catch (e) {
          // Skip invalid files
        }
      });
    }

    // Analyze exercises
    const exercisesDir = path.join(process.cwd(), AUTO_SAVE_DIRS.exercises);
    if (fs.existsSync(exercisesDir)) {
      stats.total_exercises = fs.readdirSync(exercisesDir).filter(f => f.endsWith('.json')).length;
    }

    // Analyze sessions
    const sessionsDir = path.join(process.cwd(), AUTO_SAVE_DIRS.sessions);
    if (fs.existsSync(sessionsDir)) {
      stats.total_sessions = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.json')).length;
    }

    // Convert Set to Array for JSON
    stats.languages_studied = Array.from(stats.languages_studied);

    return stats;

  } catch (error) {
    console.error('❌ Error getting learning statistics:', error.message);
    return null;
  }
}

// Export functions for use in other APIs
module.exports = {
  autoSaveLesson,
  autoSaveExerciseCompletion,
  autoSaveSessionProgress,
  getLearningStatistics,
  ensureAutoSaveDirectories
};

import AuthLocal from '../../lib/auth-local';

// API endpoint handler
export default async function handler(req, res) {
  const { action } = req.query;

  const token = req.cookies['ai-code-mentor-auth'] || req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'No autorizado: Token faltante' });
  }

  const authResult = AuthLocal.verifyToken(token);
  if (!authResult.isValid) {
    return res.status(401).json({ error: 'No autorizado: Token inválido' });
  }

  try {
    switch (action) {
      case 'get-statistics':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Método no permitido' });
        }

        const stats = getLearningStatistics();

        res.json({
          success: true,
          statistics: stats,
          message: 'Estadísticas de aprendizaje obtenidas automáticamente'
        });
        break;

      case 'save-session':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Método no permitido' });
        }

        const sessionId = autoSaveSessionProgress(req.body);

        res.json({
          success: true,
          session_id: sessionId,
          message: 'Sesión guardada automáticamente'
        });
        break;

      default:
        res.status(400).json({
          error: 'Acción no válida',
          availableActions: ['get-statistics', 'save-session']
        });
    }

  } catch (error) {
    console.error('❌ Auto-save system error:', error.message);
    res.status(500).json({
      error: 'Error en sistema de auto-guardado',
      details: error.message
    });
  }
}
