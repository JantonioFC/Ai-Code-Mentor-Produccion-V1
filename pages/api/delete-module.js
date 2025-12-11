// AI CODE MENTOR - Delete Module Endpoint
// FASE 2: Elimina un módulo y todo su contenido asociado

const db = require('../../lib/database');

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { moduleId } = req.query;
    
    if (!moduleId) {
      return res.status(400).json({ error: 'moduleId es requerido' });
    }
    
    console.log(`🗑️ Eliminando módulo ${moduleId}...`);
    
    // Verificar que el módulo existe
    const module = db.getModule(moduleId);
    
    if (!module) {
      return res.status(404).json({ error: 'Módulo no encontrado' });
    }
    
    // Eliminar módulo (cascada eliminará lecciones, ejercicios y progreso)
    const result = db.deleteModule(moduleId);
    
    if (!result.success) {
      throw new Error(result.error || 'Error eliminando módulo');
    }
    
    console.log(`✅ Módulo ${module.title} eliminado exitosamente`);
    
    // Obtener estadísticas actualizadas
    const stats = db.getOverallStats();
    
    res.json({
      success: true,
      message: `Módulo "${module.title}" eliminado exitosamente`,
      deletedModule: {
        id: module.id,
        title: module.title,
        filename: module.filename
      },
      updatedStats: {
        totalModules: stats.total_modules || 0,
        totalLessons: stats.total_lessons || 0,
        totalExercises: stats.total_exercises || 0
      }
    });

  } catch (error) {
    console.error('❌ Error eliminando módulo:', error.message);
    res.status(500).json({ 
      error: 'Error interno eliminando módulo',
      details: error.message
    });
  }
}
