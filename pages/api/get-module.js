// AI CODE MENTOR - Get Module Details Endpoint
// FASE 2: Recupera un módulo específico con sus lecciones y ejercicios

const db = require('../../lib/database');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { moduleId } = req.query;
    
    if (!moduleId) {
      return res.status(400).json({ error: 'moduleId es requerido' });
    }
    
    console.log(`📖 Recuperando módulo ${moduleId}...`);
    
    // Obtener módulo
    const module = db.getModule(moduleId);
    
    if (!module) {
      return res.status(404).json({ error: 'Módulo no encontrado' });
    }
    
    // Obtener lecciones del módulo
    const lessons = db.getModuleLessons(moduleId);
    
    // Obtener ejercicios para cada lección
    const lessonsWithExercises = lessons.map(lesson => {
      const exercises = db.getLessonExercises(lesson.id);
      
      return {
        id: lesson.id,
        lessonNumber: lesson.lesson_number,
        title: lesson.title,
        difficulty: lesson.difficulty,
        content: lesson.content,
        completed: lesson.completed === 1,
        completedDate: lesson.completed_date,
        exercises: exercises.map(ex => ({
          id: ex.id,
          exerciseNumber: ex.exercise_number,
          description: ex.description,
          completed: ex.completed === 1,
          solution: ex.solution,
          userSolution: ex.user_solution,
          completedDate: ex.completed_date
        }))
      };
    });
    
    // Obtener progreso
    const progress = db.getProgress(moduleId);
    
    console.log(`✅ Módulo encontrado con ${lessons.length} lecciones`);
    
    res.json({
      success: true,
      module: {
        id: module.id,
        title: module.title,
        filename: module.filename,
        status: module.status,
        uploadDate: module.upload_date,
        content: module.content, // Contenido original .md
        processedContent: module.processed_content ? JSON.parse(module.processed_content) : null,
        lessonCount: module.lesson_count
      },
      lessons: lessonsWithExercises,
      progress: {
        totalLessons: progress?.total_lessons || 0,
        completedLessons: progress?.completed_lessons || 0,
        totalExercises: progress?.total_exercises || 0,
        completedExercises: progress?.completed_exercises || 0,
        lastActivity: progress?.last_activity,
        lessonProgress: progress?.total_lessons > 0 
          ? Math.round((progress.completed_lessons / progress.total_lessons) * 100) 
          : 0,
        exerciseProgress: progress?.total_exercises > 0
          ? Math.round((progress.completed_exercises / progress.total_exercises) * 100)
          : 0
      }
    });

  } catch (error) {
    console.error('❌ Error recuperando módulo:', error.message);
    res.status(500).json({ 
      error: 'Error interno recuperando módulo',
      details: error.message
    });
  }
}
