/**
 * API Endpoint: POST /api/generate-lesson
 * Genera una lección personalizada usando Gemini AI y la guarda en BD
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { weekRepository } = require('../../lib/repositories/WeekRepository');
const { contentRetriever } = require('../../lib/rag/ContentRetriever');
const { TEMPLATE_PROMPT_UNIVERSAL, SYSTEM_PROMPT } = require('../../lib/prompts/LessonPrompts');

// Imports for persistence
import { withOptionalAuth } from '../../utils/authMiddleware';
import db from '../../lib/db';
import rateLimit from '../../lib/rate-limit';

async function handler(req, res) {
    // Rate limiting: AI profile (10 req/5min)
    try {
        await rateLimit(req, res, 'ai');
    } catch (e) {
        return; // Response already handled by rateLimit
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method Not Allowed',
            message: 'Este endpoint solo acepta POST requests'
        });
    }

    // Check if Gemini API is configured
    if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️  [LESSON-GEN] GEMINI_API_KEY not configured');
        return res.status(501).json({
            error: 'Service Not Configured',
            message: 'La generación de lecciones con IA requiere configurar GEMINI_API_KEY en .env.local'
        });
    }

    // AUTH CHECK: Ensure user is logged in to save content
    const { isAuthenticated, userId } = req.authContext;
    if (!isAuthenticated || !userId) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Debe iniciar sesión para generar y guardar lecciones'
        });
    }

    const { semanaId, dia, pomodoroIndex } = req.body;

    // Validate required parameters
    if (!semanaId || !dia || pomodoroIndex === undefined) {
        console.warn('⚠️  [LESSON-GEN] Missing required parameters', { semanaId, dia, pomodoroIndex });
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Faltan parámetros requeridos: semanaId, dia, pomodoroIndex',
            received: { semanaId, dia, pomodoroIndex }
        });
    }

    try {
        console.log(`📝 [LESSON-GEN] Generating lesson: week=${semanaId}, day=${dia}, pomodoro=${pomodoroIndex}`);

        // 1. Obtener contexto de la base de datos
        const contexto = await getGranularContext(parseInt(semanaId), parseInt(dia), parseInt(pomodoroIndex));

        // 2. Obtener contexto RAG (contenido relevante del currículo)
        const ragContext = contentRetriever.buildPromptContext(
            parseInt(semanaId),
            parseInt(dia) - 1,
            parseInt(pomodoroIndex)
        );

        // 3. Construir prompt final
        const prompt = buildPrompt(contexto, ragContext);

        // 4. Llamar a Gemini API con auto-discovery del mejor modelo disponible
        const { modelDiscovery } = await import('../../lib/ai/discovery/ModelDiscovery.js');

        // Obtener el mejor modelo disponible (gemini-2.5-flash, gemini-2.5-pro, etc.)
        const primaryModel = await modelDiscovery.getPrimaryModel();

        if (!primaryModel) {
            throw new Error('No se encontró ningún modelo de Gemini disponible. Verifica tu API key.');
        }

        console.log(`🤖 [LESSON-GEN] Using model: ${primaryModel.name}`);

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: primaryModel.name });

        const result = await model.generateContent({
            contents: [
                { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] }
            ],
            generationConfig: {
                temperature: 0.7,
                topP: 0.9,
                maxOutputTokens: 8192,  // Aumentado para evitar truncamiento de lecciones largas
            }
        });

        const response = await result.response;
        const generatedText = response.text();

        // 5. Parsear respuesta JSON (Gemini retorna JSON en markdown)
        let lessonData;
        try {
            // ESTRATEGIA A: bloque markdown con JSON completo (regex greedy)
            const jsonMatchGreedy = generatedText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/i);
            if (jsonMatchGreedy) {
                lessonData = JSON.parse(jsonMatchGreedy[1]);
                console.log('✅ [LESSON-GEN] JSON extraído via bloque markdown (greedy)');
            } else {
                // ESTRATEGIA B: JSON sin bloque markdown, bien formado
                const firstBrace = generatedText.indexOf('{');
                const lastBrace = generatedText.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                    lessonData = JSON.parse(generatedText.substring(firstBrace, lastBrace + 1));
                    console.log('✅ [LESSON-GEN] JSON extraído via búsqueda de llaves');
                } else {
                    throw new Error('No se encontró estructura JSON en la respuesta');
                }
            }

            // Si el JSON parseado tiene campo 'contenido', extraerlo y normalizar
            // para que el frontend reciba siempre { title, lesson (markdown puro), exercises }
            if (lessonData.contenido && !lessonData.lesson) {
                console.log('🔄 [LESSON-GEN] Normalizando estructura: contenido → lesson');
                lessonData = {
                    title: lessonData.titulo || `Lección: Semana ${semanaId}, Día ${dia}, Pomodoro ${pomodoroIndex}`,
                    lesson: lessonData.contenido,
                    exercises: lessonData.ejercicios || lessonData.exercises || [],
                    metadata: lessonData.metadata || {}
                };
            }

        } catch (parseError) {
            console.error('❌ [LESSON-GEN] Failed to parse Gemini response as JSON:', parseError.message);
            console.error('❌ [LESSON-GEN] Response length:', generatedText.length);
            console.error('❌ [LESSON-GEN] First 300 chars:', generatedText.substring(0, 300));

            // ESTRATEGIA C (fallback robusto): extraer campo 'contenido' por búsqueda de comilla no escapada
            // funciona incluso con JSON truncado y NO incluye el JSON de ejercicios al final
            const CLAVES_C = ['"contenido": "', '"lesson": "', '"content": "'];
            let extractedFromPosition = null;
            for (const CLAVE of CLAVES_C) {
                const clavIdx = generatedText.indexOf(CLAVE);
                if (clavIdx !== -1) {
                    const start = clavIdx + CLAVE.length;
                    // Avanzar hasta la primera comilla NO precedida por \
                    let end = start;
                    while (end < generatedText.length) {
                        if (generatedText[end] === '"' && generatedText[end - 1] !== '\\') break;
                        end++;
                    }
                    const raw = generatedText.slice(start, end);
                    if (raw.length > 50) {
                        extractedFromPosition = raw
                            .replace(/\\n/g, '\n')
                            .replace(/\\t/g, '\t')
                            .replace(/\\"/g, '"')
                            .trimEnd();
                        break;
                    }
                }
            }

            if (extractedFromPosition) {
                console.log('🔄 [LESSON-GEN] Extrayendo contenido por posición (JSON truncado), chars:', extractedFromPosition.length);

                // Intentar extraer también el array de quiz/ejercicios del texto crudo
                // (puede estar al final del JSON truncado como "quiz": [...])
                let extractedExercises = [];
                try {
                    const quizMatch = generatedText.match(/"(?:quiz|ejercicios|exercises)":\s*(\[[\s\S]*?\]\s*[},\]])/i);
                    if (quizMatch) {
                        const arr = JSON.parse(quizMatch[1]);
                        if (Array.isArray(arr) && arr.length > 0) {
                            extractedExercises = arr;
                            console.log('✅ [LESSON-GEN] Ejercicios extraídos del JSON truncado:', arr.length);
                        }
                    }
                } catch (_) {
                    console.log('⚠️ [LESSON-GEN] No se pudieron extraer ejercicios del JSON truncado');
                }

                lessonData = {
                    title: `Lección: Semana ${semanaId}, Día ${dia}, Pomodoro ${pomodoroIndex}`,
                    lesson: extractedFromPosition,
                    exercises: extractedExercises,
                    note: 'Contenido extraído de JSON truncado por límite de tokens'
                };
            } else {
                // Fallback final: guardar texto crudo — el frontend lo mostrará tal cual
                lessonData = {
                    title: `Lección: Semana ${semanaId}, Día ${dia}, Pomodoro ${pomodoroIndex}`,
                    lesson: generatedText,
                    exercises: [],
                    note: 'Contenido generado sin formato JSON estructurado'
                };
            }
        }

        console.log('✅ [LESSON-GEN] Lesson generated successfully');

        // PERSISTENCE: Save generated content to database
        const contentToSave = {
            ...lessonData,
            metadata: {
                weekId: semanaId,
                dayNumber: dia,
                pomodoroNumber: pomodoroIndex,
                generatedAt: new Date().toISOString(),
                model: primaryModel.name
            }
        };

        const diaIndex = parseInt(dia) - 1; // Convert 1-based day to 0-based index

        let savedToDatabase = false;
        let dbErrorDebug = null;

        try {
            // Validate user_id matches schema (integer?)
            // If Supabase uses UUID, this might fail if column is INTEGER
            // But let's try to save anyway

            const insertResult = db.transaction(() => {
                // Delete existing if any
                db.prepare(`
                    DELETE FROM generated_content 
                    WHERE user_id = ? AND semana_id = ? AND dia_index = ? AND pomodoro_index = ?
                `).run(userId, semanaId, diaIndex, pomodoroIndex);

                return db.prepare(`
                    INSERT INTO generated_content (user_id, semana_id, dia_index, pomodoro_index, content)
                    VALUES (?, ?, ?, ?, ?)
                `).run(userId, semanaId, diaIndex, pomodoroIndex, JSON.stringify(contentToSave));
            })();

            console.log('💾 [LESSON-GEN] Lesson saved to DB with ID:', insertResult.lastInsertRowid);
            savedToDatabase = true;
        } catch (dbError) {
            console.error('❌ [LESSON-GEN] Error saving to DB:', dbError);
            dbErrorDebug = dbError.message;
            // Continue execution, return generated content even if save failed
        }

        // Return format that matches frontend expectations
        // Frontend expects: { lesson: "string content", title: "...", exercises: [...] }
        return res.status(200).json({
            success: true,
            ...lessonData,  // Spread lesson data directly (title, lesson, exercises, etc.)
            savedToDatabase: savedToDatabase,
            metadata: contentToSave.metadata,
            debug: { dbError: dbErrorDebug }
        });

    } catch (error) {
        console.error('❌ [LESSON-GEN] Error generating lesson:', error);

        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
            debug: {
                weekId: semanaId,
                dayNumber: dia,
                pomodoroNumber: pomodoroIndex
            }
        });
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Obtiene el contexto granular (semana > día > pomodoro) de la base de datos
 */
async function getGranularContext(semanaId, dia, pomodoroIndex) {
    const semanaEncontrada = weekRepository.getWeekDetails(semanaId);

    if (!semanaEncontrada) {
        throw new Error(`Semana ${semanaId} no encontrada en la base de datos`);
    }

    const diaData = semanaEncontrada.esquema_diario?.[dia - 1];
    if (!diaData) {
        throw new Error(`Día ${dia} no encontrado en esquema diario de semana ${semanaId}`);
    }

    const textoPomodoro = diaData.pomodoros?.[pomodoroIndex];
    if (!textoPomodoro) {
        throw new Error(`Pomodoro ${pomodoroIndex} no encontrado en día ${dia}`);
    }

    return {
        tematica_semanal: semanaEncontrada.titulo_semana,
        concepto_del_dia: diaData.concepto,
        texto_del_pomodoro: textoPomodoro
    };
}

/**
 * Construye el prompt final combinando el template con el contexto RAG
 */
function buildPrompt(contexto, ragContext) {
    const basePrompt = TEMPLATE_PROMPT_UNIVERSAL
        .replace(/{tematica_semanal}/g, contexto.tematica_semanal)
        .replace(/{concepto_del_dia}/g, contexto.concepto_del_dia)
        .replace(/{texto_del_pomodoro}/g, contexto.texto_del_pomodoro);

    return `${ragContext}\n\n---\n\n${basePrompt}`;
}

// Apply authentication middleware
export default withOptionalAuth(handler);
