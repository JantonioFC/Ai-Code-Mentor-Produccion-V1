// Endpoint de prueba para diagnosticar el error
// GET /api/test-week-context?semana=1&dia=1&pomodoro=0

export default async function handler(req, res) {
  const { semana = 1, dia = 1, pomodoro = 0 } = req.query;
  
  console.log(`🧪 [TEST] Probando extracción de contexto para semana ${semana}, día ${dia}, pomodoro ${pomodoro}`);
  
  try {
    // Importar dinámicamente el módulo
    const { getWeekDetails } = require('../../lib/curriculum-sqlite.js');
    
    // Paso 1: Obtener datos de la semana
    console.log(`📚 [TEST] Obteniendo datos de semana ${semana}...`);
    const semanaEncontrada = getWeekDetails(parseInt(semana));
    
    if (!semanaEncontrada) {
      return res.status(404).json({
        error: 'Semana no encontrada',
        semana: parseInt(semana),
        debug: {
          step: 'getWeekDetails',
          result: 'null'
        }
      });
    }
    
    console.log(`✅ [TEST] Semana encontrada: ${semanaEncontrada.titulo_semana}`);
    
    // Paso 2: Verificar esquema_diario
    if (!semanaEncontrada.esquema_diario || !Array.isArray(semanaEncontrada.esquema_diario)) {
      return res.status(500).json({
        error: 'Esquema diario no disponible',
        debug: {
          step: 'validate_esquema_diario',
          hasEsquemaDiario: !!semanaEncontrada.esquema_diario,
          isArray: Array.isArray(semanaEncontrada.esquema_diario),
          type: typeof semanaEncontrada.esquema_diario
        }
      });
    }
    
    console.log(`✅ [TEST] Esquema diario válido: ${semanaEncontrada.esquema_diario.length} días`);
    
    // Paso 3: Obtener día específico
    const diaIndex = parseInt(dia) - 1; // Convertir a 0-based
    const diaData = semanaEncontrada.esquema_diario[diaIndex];
    
    if (!diaData) {
      return res.status(400).json({
        error: 'Día no encontrado',
        debug: {
          step: 'get_dia',
          dia: parseInt(dia),
          diaIndex,
          availableDays: semanaEncontrada.esquema_diario.length,
          esquemaDiario: semanaEncontrada.esquema_diario.map((d, i) => ({
            index: i,
            dia: d.dia,
            concepto: d.concepto
          }))
        }
      });
    }
    
    console.log(`✅ [TEST] Día encontrado: ${diaData.concepto}`);
    
    // Paso 4: Verificar pomodoros
    if (!diaData.pomodoros || !Array.isArray(diaData.pomodoros)) {
      return res.status(500).json({
        error: 'Pomodoros no disponibles',
        debug: {
          step: 'validate_pomodoros',
          hasPomodoros: !!diaData.pomodoros,
          isArray: Array.isArray(diaData.pomodoros),
          type: typeof diaData.pomodoros,
          diaData
        }
      });
    }
    
    console.log(`✅ [TEST] Pomodoros válidos: ${diaData.pomodoros.length} elementos`);
    
    // Paso 5: Obtener pomodoro específico
    const pomodoroIndex = parseInt(pomodoro);
    
    if (pomodoroIndex < 0 || pomodoroIndex >= diaData.pomodoros.length) {
      return res.status(400).json({
        error: 'Índice de pomodoro fuera de rango',
        debug: {
          step: 'validate_pomodoro_index',
          pomodoroIndex,
          availablePomodoros: diaData.pomodoros.length,
          pomodoros: diaData.pomodoros
        }
      });
    }
    
    const textoPomodoro = diaData.pomodoros[pomodoroIndex];
    console.log(`✅ [TEST] Pomodoro extraído: "${textoPomodoro.substring(0, 50)}..."`);
    
    // Paso 6: Construir contexto
    const contexto = {
      tematica_semanal: semanaEncontrada.titulo_semana,
      concepto_del_dia: diaData.concepto,
      texto_del_pomodoro: textoPomodoro
    };
    
    console.log(`✅ [TEST] Contexto construido exitosamente`);
    
    // Respuesta exitosa
    return res.status(200).json({
      success: true,
      message: 'Contexto extraído exitosamente',
      contexto,
      debug: {
        semana: parseInt(semana),
        dia: parseInt(dia),
        pomodoro: pomodoroIndex,
        weekData: {
          titulo: semanaEncontrada.titulo_semana,
          modulo: semanaEncontrada.modulo_titulo,
          fase: semanaEncontrada.fase_titulo,
          totalDias: semanaEncontrada.esquema_diario.length
        }
      }
    });
    
  } catch (error) {
    console.error(`❌ [TEST] Error durante diagnóstico:`, error);
    
    return res.status(500).json({
      error: 'Error interno',
      message: error.message,
      stack: error.stack,
      debug: {
        semana,
        dia,
        pomodoro
      }
    });
  }
}
