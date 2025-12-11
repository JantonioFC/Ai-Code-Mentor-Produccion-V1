// AI CODE MENTOR - Module Processing Endpoint
// Convierte contenido .md en lecciones educativas usando Gemini
// FASE 2: Integrado con SQLite para persistencia de datos

const db = require('../../lib/database');

// Función para extraer secciones del markdown
const parseMarkdownContent = (content) => {
  // Dividir por headers principales (# o ##)
  const sections = content.split(/^#{1,2}\s+/m).filter(section => section.trim());
  
  // El primer elemento puede ser contenido sin header
  const parsedSections = sections.map((section, index) => {
    const lines = section.trim().split('\n');
    const title = lines[0] || `Sección ${index + 1}`;
    const content = lines.slice(1).join('\n').trim();
    
    return {
      title: title.replace(/#+\s*/, '').trim(),
      content: content,
      order: index
    };
  });

  return parsedSections.filter(section => section.content.length > 50); // Filtrar secciones muy cortas
};

// Prompts especializados para convertir contenido técnico en lecciones educativas
const generateLessonPrompt = (sectionTitle, sectionContent, lessonIndex, totalLessons) => {
  return `CONTENIDO TÉCNICO ORIGINAL:
**Título:** ${sectionTitle}
**Contenido:**
${sectionContent}

CONTEXTO:
- Esta es la lección ${lessonIndex + 1} de ${totalLessons} total
- Es parte de un módulo de estudio autogestionado
- El objetivo es enseñar conceptos de desarrollo full stack

TAREA: Convierte este contenido técnico en una LECCIÓN EDUCATIVA explicativa.

📚 ESTRUCTURA DE LECCIÓN REQUERIDA:

**1. INTRODUCCIÓN PEDAGÓGICA (2-3 líneas):**
- ¿Por qué es importante este tema?
- ¿Cómo conecta con el desarrollo full stack?

**2. EXPLICACIÓN CONCEPTUAL (párrafo principal):**
- Explica los conceptos de forma clara y progresiva
- Usa analogías del mundo real cuando sea apropiado
- Enfócate en el "por qué" no solo el "qué"

**3. EJEMPLOS PRÁCTICOS:**
- Si hay código, explica línea por línea lo importante
- Si hay conceptos, da ejemplos concretos
- Conecta con casos de uso reales

**4. PUNTOS CLAVE (3-5 bullets):**
- Los conceptos más importantes para recordar
- Tips prácticos y mejores prácticas
- Errores comunes a evitar

**5. CONEXIONES:**
- ¿Cómo se relaciona con temas anteriores?
- ¿Qué viene después en el aprendizaje?

ESTILO:
- Tono mentoring: como un desarrollador senior enseñando
- Claro y accesible, pero técnicamente preciso
- Enfoque en comprensión profunda, no memorización
- Incluye context de "por qué esto importa"

La lección debe ser AUTOCONTENIDA y PROGRESIVA, asumiendo que el estudiante sigue un curriculum estructurado.`;
};

// Prompt para generar ejercicios sugeridos
const generateExercisesPrompt = (lessonTitle, lessonContent) => {
  return `LECCIÓN COMPLETADA:
**Título:** ${lessonTitle}
**Contenido de la lección:** ${lessonContent}

TAREA: Genera 2-4 EJERCICIOS PRÁCTICOS que refuercen el aprendizaje de esta lección.

TIPOS DE EJERCICIOS A CONSIDERAR:
- **Coding exercises:** Implementar conceptos específicos
- **Analysis exercises:** Analizar código existente
- **Design exercises:** Planificar arquitectura o solución
- **Debug exercises:** Encontrar y corregir problemas
- **Research exercises:** Investigar herramientas o técnicas

FORMATO DE RESPUESTA (solo los ejercicios, sin explicaciones adicionales):
1. [Descripción clara y específica del ejercicio]
2. [Otro ejercicio diferente que refuerce otros aspectos]
3. [Si aplica, un tercer ejercicio más desafiante]

Los ejercicios deben ser:
- Específicos y alcanzables
- Progresivos en dificultad
- Relevantes para desarrollo full stack
- Implementables con las herramientas mencionadas en la lección`;
};

// Función principal para procesar módulo con Gemini
const processModuleWithGemini = async (filename, content) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('API key de Gemini no configurada');
  }

  // Parsear contenido markdown
  const sections = parseMarkdownContent(content);
  
  if (sections.length === 0) {
    throw new Error('No se encontraron secciones válidas en el archivo .md');
  }

  console.log(`📖 Procesando ${sections.length} secciones del módulo ${filename}`);

  const lessons = [];

  // Procesar cada sección como una lección
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    console.log(`🔄 Procesando lección ${i + 1}: ${section.title}`);

    try {
      // Generar lección educativa
      const lessonPrompt = generateLessonPrompt(section.title, section.content, i, sections.length);
      
      // MISIÓN 215+: Leer modelo desde variable de entorno
      const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash';
      const lessonResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: lessonPrompt }]
          }],
          generationConfig: {
            // MISIÓN 215+: Límite aumentado para contenido completo
            maxOutputTokens: 4000,
            temperature: 0.4,
            candidateCount: 1
          }
        })
      });

      if (!lessonResponse.ok) {
        throw new Error(`Error generando lección ${i + 1}: ${lessonResponse.status}`);
      }

      const lessonData = await lessonResponse.json();
      const lessonContent = lessonData.candidates[0].content.parts[0].text;

      // Generar ejercicios para la lección
      const exercisesPrompt = generateExercisesPrompt(section.title, lessonContent);
      
      const exercisesResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: exercisesPrompt }]
          }],
          generationConfig: {
            // MISIÓN 215+: Límite aumentado para ejercicios completos
            maxOutputTokens: 2000,
            temperature: 0.3,
            candidateCount: 1
          }
        })
      });

      let exercises = [];
      if (exercisesResponse.ok) {
        const exercisesData = await exercisesResponse.json();
        const exercisesText = exercisesData.candidates[0].content.parts[0].text;
        
        // Parsear ejercicios (buscar líneas numeradas)
        exercises = exercisesText
          .split('\n')
          .filter(line => /^\d+\./.test(line.trim()))
          .map(line => line.replace(/^\d+\.\s*/, '').trim())
          .filter(exercise => exercise.length > 10);
      }

      lessons.push({
        title: section.title,
        content: lessonContent,
        exercises: exercises,
        order: i,
        difficulty: i < sections.length / 3 ? 'Básico' : i < (sections.length * 2) / 3 ? 'Intermedio' : 'Avanzado',
        originalSection: {
          title: section.title,
          content: section.content.substring(0, 200) + '...'
        }
      });

      console.log(`✅ Lección ${i + 1} completada con ${exercises.length} ejercicios`);

      // Pequeña pausa para evitar rate limits
      if (i < sections.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`❌ Error procesando lección ${i + 1}:`, error);
      
      // Agregar lección básica en caso de error
      lessons.push({
        title: section.title,
        content: `Error al generar contenido explicativo para "${section.title}". Contenido original disponible para revisión.`,
        exercises: [],
        order: i,
        difficulty: 'Básico',
        error: true,
        originalSection: {
          title: section.title,
          content: section.content
        }
      });
    }
  }

  return lessons;
};

// Handler principal
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  let moduleId = null; // Para tracking en caso de error

  try {
    const { filename, content } = req.body;

    // Validaciones
    if (!filename || !content) {
      return res.status(400).json({ error: 'Filename y content son requeridos' });
    }

    if (!filename.endsWith('.md')) {
      return res.status(400).json({ error: 'Solo se permiten archivos .md' });
    }

    if (content.length < 100) {
      return res.status(400).json({ error: 'El contenido del archivo es muy corto' });
    }

    if (content.length > 50000) {
      return res.status(400).json({ error: 'El archivo es muy grande (máximo 50KB)' });
    }

    console.log(`🚀 Iniciando procesamiento de módulo: ${filename}`);
    console.log(`📝 Tamaño del contenido: ${content.length} caracteres`);

    // Crear módulo en database
    moduleId = `module_${Date.now()}`;
    const moduleTitle = filename.replace('.md', '').replace(/-/g, ' ').replace(/_/g, ' ');
    
    const moduleResult = db.createModule({
      id: moduleId,
      title: moduleTitle,
      filename: filename,
      content: content,
      status: 'processing',
      lesson_count: 0
    });

    if (!moduleResult.success) {
      throw new Error('Error creando módulo en database');
    }

    console.log(`💾 Módulo creado en DB con ID: ${moduleId}`);

    // Procesar módulo
    const lessons = await processModuleWithGemini(filename, content);

    console.log(`✅ Módulo procesado exitosamente: ${lessons.length} lecciones generadas`);

    // Guardar lecciones en database
    const lessonsToSave = lessons.map((lesson, index) => ({
      id: `lesson_${moduleId}_${index + 1}`,
      lesson_number: index + 1,
      title: lesson.title,
      difficulty: lesson.difficulty.toLowerCase().replace('á', 'a').replace('é', 'e'),
      content: lesson.content
    }));

    const lessonsResult = db.createLessons(moduleId, lessonsToSave);
    
    if (lessonsResult.success) {
      console.log(`💾 ${lessonsResult.count} lecciones guardadas en DB`);
      
      // Guardar ejercicios para cada lección
      let totalExercises = 0;
      for (let i = 0; i < lessons.length; i++) {
        if (lessons[i].exercises && lessons[i].exercises.length > 0) {
          const lessonId = `lesson_${moduleId}_${i + 1}`;
          const exercisesToSave = lessons[i].exercises.map((exercise, j) => ({
            id: `exercise_${lessonId}_${j + 1}`,
            exercise_number: j + 1,
            description: exercise,
            solution: null
          }));
          
          const exercisesResult = db.createExercises(lessonId, exercisesToSave);
          if (exercisesResult.success) {
            totalExercises += exercisesResult.count;
          }
        }
      }
      
      console.log(`💾 ${totalExercises} ejercicios guardados en DB`);
    }

    // Actualizar estado del módulo
    db.updateModule(moduleId, {
      status: 'completed',
      lesson_count: lessons.length,
      processed_content: JSON.stringify({
        lessons: lessons.length,
        exercises: lessons.reduce((sum, l) => sum + l.exercises.length, 0),
        processedAt: new Date().toISOString()
      })
    });

    console.log(`✅ Módulo ${moduleId} completamente procesado y guardado`);

    res.json({
      success: true,
      module: {
        id: moduleId,
        filename: filename,
        name: filename.replace('.md', ''),
        processedAt: new Date().toISOString(),
        contentLength: content.length,
        saved: true
      },
      lessons: lessons,
      stats: {
        totalLessons: lessons.length,
        lessonsWithExercises: lessons.filter(l => l.exercises.length > 0).length,
        errorLessons: lessons.filter(l => l.error).length
      }
    });

  } catch (error) {
    console.error('❌ Error procesando módulo:', error.message);
    
    // Si hay un moduleId, actualizar estado a error
    if (moduleId) {
      db.updateModule(moduleId, {
        status: 'error',
        processed_content: JSON.stringify({ error: error.message })
      });
    }
    
    res.status(500).json({ 
      error: 'Error interno procesando el módulo',
      details: error.message
    });
  }
}