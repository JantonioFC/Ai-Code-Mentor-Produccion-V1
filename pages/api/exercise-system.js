/**
 * AI CODE MENTOR V4.2 - Integrated Exercise Environment API
 * Sistema de ejercicios con entorno de ejecución y corrección automática
 */

const fs = require('fs');
const path = require('path');
import rateLimit from '../../lib/rate-limit'; // Anti-Abuse

export default async function handler(req, res) {
  const { action } = req.query;

  try {
    await rateLimit(req, res);
  } catch (e) {
    return;
  }

  try {
    switch (action) {
      case 'execute-code':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Método no permitido' });
        }

        const { code, language, exerciseId, lessonPath } = req.body;

        if (!code || !language || !exerciseId) {
          return res.status(400).json({
            error: 'Parámetros requeridos: code, language, exerciseId'
          });
        }

        // Execute code based on language
        let result;
        switch (language) {
          case 'javascript':
            result = await executeJavaScript(code);
            break;
          case 'python':
            result = await executePython(code);
            break;
          case 'react':
            result = await executeReact(code);
            break;
          default:
            throw new Error(`Lenguaje no soportado: ${language}`);
        }

        // Auto-save exercise attempt
        await autoSaveExerciseAttempt({
          lessonPath,
          exerciseId,
          code,
          language,
          result,
          timestamp: new Date().toISOString()
        });

        res.json({
          success: true,
          result,
          message: 'Código ejecutado y guardado automáticamente'
        });
        break;

      case 'check-solution':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Método no permitido' });
        }

        const { userCode, exerciseDescription, language: lang } = req.body;

        const feedback = await checkSolutionWithAI(userCode, exerciseDescription, lang);

        res.json({
          success: true,
          feedback,
          timestamp: new Date().toISOString()
        });
        break;

      case 'get-exercise-history':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Método no permitido' });
        }

        const { lesson_path, exercise_id } = req.query;
        const history = getExerciseHistory(lesson_path, exercise_id);

        res.json({
          success: true,
          history
        });
        break;

      default:
        res.status(400).json({
          error: 'Acción no válida',
          availableActions: ['execute-code', 'check-solution', 'get-exercise-history']
        });
    }

  } catch (error) {
    console.error('❌ Exercise system error:', error.message);
    res.status(500).json({
      error: 'Error en sistema de ejercicios',
      details: error.message
    });
  }
}

// Execute JavaScript code safely
async function executeJavaScript(code) {
  const vm = require('vm');
  try {
    // Create safe execution context
    const results = [];
    const errors = [];

    const sandbox = {
      console: {
        log: (...args) => results.push(args.join(' ')),
        error: (...args) => errors.push(args.join(' '))
      },
      results,
      errors
    };

    const context = vm.createContext(sandbox);

    // Wrap user code to capture output
    const wrappedCode = `
      try {
        ${code}
      } catch (e) {
        errors.push(e.message);
      }
      JSON.stringify({ results, errors });
    `;

    // Execute in isolated context with timeout (DoS Protection)
    const result = vm.runInContext(wrappedCode, context, {
      timeout: 1000, // 1 second max execution time
      displayErrors: false
    });

    return JSON.parse(result);

  } catch (error) {
    // Handle Timeouts and Syntax Errors
    return {
      results: [],
      errors: [error.message.includes('Script execution timed out')
        ? 'Error: Execution timed out (Possible infinite loop)'
        : error.message]
    };
  }
}

// Execute React code (simplified JSX validation)
async function executeReact(code) {
  try {
    // Basic JSX syntax validation
    const hasJSX = /<[^>]+>/.test(code);
    const hasProps = /props\./.test(code);
    const hasHooks = /(useState|useEffect)/.test(code);

    const analysis = {
      hasJSX,
      hasProps,
      hasHooks,
      isValidComponent: /^(function|const)\s+\w+/.test(code.trim()),
      syntaxValid: true // Simplified validation
    };

    return {
      analysis,
      message: analysis.isValidComponent ? 'Componente React válido' : 'Estructura de componente incompleta',
      results: [`Análisis completado: JSX=${hasJSX}, Props=${hasProps}, Hooks=${hasHooks}`]
    };

  } catch (error) {
    return {
      results: [],
      errors: [error.message]
    };
  }
}

// Execute Python code (placeholder - would need actual Python runtime)
async function executePython(code) {
  // In production, this would use a Python runtime or service
  return {
    results: ['Python execution would run here'],
    message: 'Python runtime no disponible en esta demo',
    code_analysis: {
      has_functions: /def\s+\w+/.test(code),
      has_variables: /\w+\s*=/.test(code),
      has_imports: /import\s+\w+/.test(code)
    }
  };
}

// AI-powered solution checking
async function checkSolutionWithAI(userCode, exerciseDescription, language) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key no configurada');
  }

  const prompt = `SISTEMA DE CORRECCIÓN AUTOMÁTICA DE EJERCICIOS

EJERCICIO ASIGNADO:
${exerciseDescription}

CÓDIGO ENVIADO POR EL ESTUDIANTE:
\`\`\`${language}
${userCode}
\`\`\`

TAREA: Evalúa la solución del estudiante y proporciona feedback constructivo.

CRITERIOS DE EVALUACIÓN:
1. **Corrección Técnica**: ¿El código funciona correctamente?
2. **Cumplimiento de Requisitos**: ¿Satisface todos los objetivos del ejercicio?
3. **Mejores Prácticas**: ¿Sigue convenciones y patrones recomendados?
4. **Calidad del Código**: Legibilidad, estructura, nombres descriptivos

FORMATO DE RESPUESTA:
**EVALUACIÓN: [EXCELENTE/BIEN/NECESITA MEJORAS/INCOMPLETO]**

**PUNTOS FUERTES:**
- [Aspectos positivos específicos]

**ÁREAS DE MEJORA:**
- [Sugerencias concretas de mejora]

**CÓDIGO SUGERIDO (si necesario):**
\`\`\`${language}
[Versión mejorada o corrección]
\`\`\`

**PRÓXIMOS PASOS:**
[Recomendaciones para continuar aprendiendo]

Proporciona feedback específico, constructivo y educativo que ayude al estudiante a mejorar.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.3,
          candidateCount: 1
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;

  } catch (error) {
    console.error('❌ Error in AI feedback:', error.message);
    return `Error generando feedback automático: ${error.message}`;
  }
}

// Auto-save exercise attempts
async function autoSaveExerciseAttempt(attemptData) {
  try {
    const exercisesDir = path.join(process.cwd(), 'exports', 'ejercicios');
    if (!fs.existsSync(exercisesDir)) {
      fs.mkdirSync(exercisesDir, { recursive: true });
    }

    const filename = `${attemptData.lessonPath.replace(/\./g, '_')}_${attemptData.exerciseId}_${Date.now()}.json`;
    const filepath = path.join(exercisesDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(attemptData, null, 2), 'utf8');
    console.log(`💾 Exercise attempt auto-saved: ${filename}`);

  } catch (error) {
    console.error('❌ Error auto-saving exercise:', error.message);
  }
}

// Get exercise history for a specific exercise
function getExerciseHistory(lessonPath, exerciseId) {
  try {
    const exercisesDir = path.join(process.cwd(), 'exports', 'ejercicios');
    if (!fs.existsSync(exercisesDir)) {
      return [];
    }

    const files = fs.readdirSync(exercisesDir);
    const pattern = `${lessonPath.replace(/\./g, '_')}_${exerciseId}_`;

    return files
      .filter(file => file.startsWith(pattern))
      .map(file => {
        const filepath = path.join(exercisesDir, file);
        const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        return {
          filename: file,
          ...content
        };
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  } catch (error) {
    console.error('❌ Error getting exercise history:', error.message);
    return [];
  }
}
