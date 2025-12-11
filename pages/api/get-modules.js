// AI CODE MENTOR - Get Modules Endpoint
// FASE 2: Recupera todos los módulos guardados en Supabase

import { getAllModules, getOverallStats } from '../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    console.log('📋 Recuperando módulos de la base de datos...');
    
    // Obtener todos los módulos con su progreso
    const modules = await getAllModules();
    
    // Obtener estadísticas generales
    const stats = await getOverallStats();
    
    console.log(`✅ ${modules?.length || 0} módulos encontrados`);
    
    // Formatear módulos para el frontend - asegurar que modules es un array
    const formattedModules = (modules || []).map(module => {
      // Calcular progreso porcentual
      const lessonProgress = module.total_lessons > 0 
        ? Math.round((module.completed_lessons / module.total_lessons) * 100) 
        : 0;
      
      const exerciseProgress = module.total_exercises > 0
        ? Math.round((module.completed_exercises / module.total_exercises) * 100)
        : 0;
      
      return {
        id: module.id,
        title: module.title,
        filename: module.filename,
        status: module.status,
        uploadDate: module.upload_date,
        lessons: {
          total: module.lesson_count || 0,
          completed: module.completed_lessons || 0,
          progress: lessonProgress
        },
        exercises: {
          total: module.total_exercises || 0,
          completed: module.completed_exercises || 0,
          progress: exerciseProgress
        },
        overallProgress: Math.round((lessonProgress + exerciseProgress) / 2)
      };
    });
    
    // Ordenar por fecha de upload (más reciente primero)
    formattedModules.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    
    res.json({
      success: true,
      modules: formattedModules,
      stats: {
        totalModules: stats.total_modules || 0,
        totalLessons: stats.total_lessons || 0,
        completedLessons: stats.completed_lessons || 0,
        totalExercises: stats.total_exercises || 0,
        completedExercises: stats.completed_exercises || 0,
        overallProgress: stats.total_lessons > 0
          ? Math.round((stats.completed_lessons / stats.total_lessons) * 100)
          : 0
      }
    });

  } catch (error) {
    console.error('❌ Error recuperando módulos:', error.message);
    res.status(500).json({ 
      error: 'Error interno recuperando módulos',
      details: error.message
    });
  }
}
