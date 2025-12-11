// AI CODE MENTOR - Update Progress Endpoint
// FASE 2: Actualiza el progreso de lecciones y ejercicios

const db = require('../../lib/database');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { type, id, completed, userSolution } = req.body;
    
    // Validaciones
    if (!type || !id) {
      return res.status(400).json({ 
        error: 'type e id son requeridos' 
      });
    }
    
    if (!['lesson', 'exercise', 'reset'].includes(type)) {
      return res.status(400).json({ 
        error: 'type debe ser "lesson", "exercise" o "reset"' 
      });
    }
    
    console.log(`🔄 Actualizando progreso: ${type} ${id}`);
    
    let result;
    let moduleId;
    
    switch (type) {
      case 'lesson':
        // Marcar lección como completada o no completada
        if (completed === false) {
          // Para desmarcar, necesitamos actualizar manualmente
          const stmt = db.db.prepare(`
            UPDATE lessons 
            SET completed = 0, completed_date = NULL 
            WHERE id = ?
          `);
          stmt.run(id);
          
          // Obtener module_id para actualizar progreso
          const lesson = db.getLesson(id);
          if (lesson) {
            db.updateProgress(lesson.module_id);
            moduleId = lesson.module_id;
          }
          
          result = { success: true };
        } else {
          result = db.completeLesson(id);
          const lesson = db.getLesson(id);
          moduleId = lesson?.module_id;
        }
        break;
        
      case 'exercise':
        // Marcar ejercicio como completado o no completado
        if (completed === false) {
          // Para desmarcar
          const stmt = db.db.prepare(`
            UPDATE exercises 
            SET completed = 0, completed_date = NULL, user_solution = NULL
            WHERE id = ?
          `);
          stmt.run(id);
          
          // Obtener module_id para actualizar progreso
          const exerciseStmt = db.db.prepare(`
            SELECT e.*, l.module_id 
            FROM exercises e
            JOIN lessons l ON e.lesson_id = l.id
            WHERE e.id = ?
          `);
          const exercise = exerciseStmt.get(id);
          if (exercise) {
            db.updateProgress(exercise.module_id);
            moduleId = exercise.module_id;
          }
          
          result = { success: true };
        } else {
          result = db.completeExercise(id, userSolution);
          
          // Obtener module_id
          const exerciseStmt = db.db.prepare(`
            SELECT e.*, l.module_id 
            FROM exercises e
            JOIN lessons l ON e.lesson_id = l.id
            WHERE e.id = ?
          `);
          const exercise = exerciseStmt.get(id);
          moduleId = exercise?.module_id;
        }
        break;
        
      case 'reset':
        // Reset completo del progreso de un módulo
        result = db.resetModuleProgress(id);
        moduleId = id;
        break;
        
      default:
        return res.status(400).json({ error: 'Tipo de operación no válido' });
    }
    
    if (!result.success) {
      throw new Error(result.error || 'Error actualizando progreso');
    }
    
    // Obtener progreso actualizado
    let updatedProgress = null;
    if (moduleId) {
      const progress = db.getProgress(moduleId);
      if (progress) {
        updatedProgress = {
          totalLessons: progress.total_lessons,
          completedLessons: progress.completed_lessons,
          totalExercises: progress.total_exercises,
          completedExercises: progress.completed_exercises,
          lessonProgress: progress.total_lessons > 0 
            ? Math.round((progress.completed_lessons / progress.total_lessons) * 100) 
            : 0,
          exerciseProgress: progress.total_exercises > 0
            ? Math.round((progress.completed_exercises / progress.total_exercises) * 100)
            : 0
        };
      }
    }
    
    console.log(`✅ Progreso actualizado exitosamente`);
    
    res.json({
      success: true,
      message: type === 'reset' 
        ? 'Progreso del módulo reiniciado' 
        : `${type === 'lesson' ? 'Lección' : 'Ejercicio'} ${completed !== false ? 'completado' : 'desmarcado'}`,
      progress: updatedProgress
    });

  } catch (error) {
    console.error('❌ Error actualizando progreso:', error.message);
    res.status(500).json({ 
      error: 'Error interno actualizando progreso',
      details: error.message
    });
  }
}
