/**
 * API Endpoint: POST /api/v1/lessons/stream
 * Genera una lección con streaming usando Server-Sent Events.
 * Parte de Phase 10.4: Optional Improvements
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { weekRepository } from '../../../../lib/repositories/WeekRepository';
import { contentRetriever } from '../../../../lib/rag/ContentRetriever';
import { TEMPLATE_PROMPT_UNIVERSAL, SYSTEM_PROMPT } from '../../../../lib/prompts/LessonPrompts';

// Eliminada config de edge runtime para soporte completo de dependencias Node.js

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const body = await req.json();
        const { semanaId, dia, pomodoroIndex } = body;

        // Obtener contexto
        const contexto = await getGranularContext(semanaId, dia, pomodoroIndex);
        const ragContext = contentRetriever.buildPromptContext(semanaId, dia - 1, pomodoroIndex);
        const prompt = buildPrompt(contexto, ragContext);

        // Configurar Gemini para streaming
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const result = await model.generateContentStream({
            contents: [
                { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] }
            ],
            generationConfig: {
                temperature: 0.7,
                topP: 0.9,
                maxOutputTokens: 8192,
            }
        });

        // Crear stream de respuesta
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Enviar evento de inicio
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start', contexto })}\n\n`));

                    let fullText = '';

                    for await (const chunk of result.stream) {
                        const text = chunk.text();
                        fullText += text;

                        // Enviar chunk de texto
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                            type: 'chunk',
                            text,
                            accumulated: fullText.length
                        })}\n\n`));
                    }

                    // Intentar parsear la respuesta completa
                    let parsed = null;
                    try {
                        const jsonMatch = fullText.match(/```json\n?([\s\S]*?)\n?```/);
                        if (jsonMatch) {
                            parsed = JSON.parse(jsonMatch[1]);
                        } else {
                            parsed = JSON.parse(fullText);
                        }
                    } catch (e) {
                        parsed = { rawContent: fullText };
                    }

                    // Enviar evento de finalización
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'end',
                        success: true,
                        data: parsed,
                        totalLength: fullText.length
                    })}\n\n`));

                } catch (error) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'error',
                        error: error.message
                    })}\n\n`));
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('[API Stream] Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Funciones auxiliares

async function getGranularContext(semanaId, dia, pomodoroIndex) {
    const semanaEncontrada = weekRepository.getWeekDetails(semanaId);
    if (!semanaEncontrada) throw new Error(`Semana ${semanaId} no encontrada`);

    const diaData = semanaEncontrada.esquema_diario?.[dia - 1];
    if (!diaData) throw new Error(`Día ${dia} no encontrado`);

    const textoPomodoro = diaData.pomodoros?.[pomodoroIndex];
    if (!textoPomodoro) throw new Error(`Pomodoro ${pomodoroIndex} no encontrado`);

    return {
        tematica_semanal: semanaEncontrada.titulo_semana,
        concepto_del_dia: diaData.concepto,
        texto_del_pomodoro: textoPomodoro
    };
}

function buildPrompt(contexto, ragContext) {
    const basePrompt = TEMPLATE_PROMPT_UNIVERSAL
        .replace(/{tematica_semanal}/g, contexto.tematica_semanal)
        .replace(/{concepto_del_dia}/g, contexto.concepto_del_dia)
        .replace(/{texto_del_pomodoro}/g, contexto.texto_del_pomodoro);

    return `${ragContext}\n\n---\n\n${basePrompt}`;
}
