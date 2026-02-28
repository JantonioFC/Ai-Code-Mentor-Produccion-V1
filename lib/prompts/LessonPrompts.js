/**
 * TEMPLATES DE PROMPTS PARA GENERACIÓN DE LECCIONES
 * Refactorizado con Few-Shot Prompting según análisis de 'prompt-engineering-patterns'
 */

// ============================================================
// 1. SYSTEM PROMPT (Persona y Comportamiento Global)
// ============================================================
export const SYSTEM_PROMPT = `Eres un tutor de programación experto.
Tu tarea es crear micro-lecciones educativas basadas EXCLUSIVAMENTE en el contexto proporcionado.

🛑 **DIRECTIVA DE FIDELIDAD CONTEXTUAL ABSOLUTA:**
- NO uses conocimiento previo sobre CS50 o Harvard.
- Tu única fuente de verdad es el [CONTEXTO] que te dé el usuario.
- Si el contexto menciona "Scratch", habla SOLO de Scratch.
- NUNCA menciones lenguajes de programación textual (C, Python) si el contexto es de programación visual.

📈 **RECURSOS VISUALES OBLIGATORIOS** (incluye cuando el tema lo amerite):
- **Diagramas de flujo o arquitectura:** Usa bloques de código \`\`\`mermaid para mostrar relaciones, flujos o estructuras.
  Ejemplos de uso: flujos de ejecución, jerarquías de clases, ciclo de vida de un proceso, arquitectura de un sistema.
- **Tablas comparativas:** Usa tablas Markdown (| col1 | col2 |) para comparar conceptos, métodos, pros/contras.
  Ejemplos: comparar bucles, operadores, paradigmas, herramientas.
- **Bloques de código:** Siempre con el lenguaje especificado (\`\`\`python, \`\`\`javascript, etc.).

**FORMATO DE RESPUESTA:** Siempre responde en JSON válido con las claves: "contenido" (string Markdown) y "quiz" (array).`;

// ============================================================
// 2. FEW-SHOT EXAMPLES (Guía de Estructura y Calidad)
// ============================================================
export const FEW_SHOT_EXAMPLES = [
  {
    role: 'user',
    content: `[CONTEXTO]
Temática Semanal: Introducción a la programación visual
Concepto del Día: Bloques de control
Tarea Específica del Pomodoro: Aprender a usar el bloque "repetir" en Scratch
[/CONTEXTO]`
  },
  {
    role: 'assistant',
    content: JSON.stringify({
      contenido: `# El Bloque "Repetir" en Scratch: Tu Primera Herramienta de Automatización 🔄

## ¿Qué es el Bloque Repetir?
El bloque "repetir" es una de las herramientas más poderosas en Scratch. Te permite ejecutar una secuencia de acciones múltiples veces sin tener que arrastrar el mismo bloque una y otra vez.

### Analogía: El Reproductor de Música
Imagina que quieres escuchar tu canción favorita 5 veces seguidas. En lugar de presionar "play" 5 veces manualmente, usas la función de "repetir" del reproductor. El bloque "repetir" de Scratch funciona exactamente igual: le dices cuántas veces quieres que algo suceda, y él se encarga del resto.

## ¿Cómo Funciona?
1. Arrastra el bloque "repetir (10)" desde la categoría "Control".
2. Coloca dentro los bloques que quieres que se repitan.
3. Ajusta el número para indicar cuántas repeticiones deseas.

### Ejemplo 1: Hacer que un sprite camine
\`\`\`
repetir (10)
  mover (10) pasos
fin
\`\`\`
El sprite avanzará 100 pasos en total (10 pasos × 10 repeticiones).

### Ejemplo 2: Dibujar un cuadrado
\`\`\`
repetir (4)
  mover (100) pasos
  girar 90 grados
fin
\`\`\`
Cada lado del cuadrado se dibuja con "mover", y "girar" prepara el siguiente lado.

### Ejemplo 3: Animación de salto
\`\`\`
repetir (5)
  cambiar y por (20)
  esperar (0.1) segundos
  cambiar y por (-20)
  esperar (0.1) segundos
fin
\`\`\`
El sprite subirá y bajará 5 veces, creando un efecto de salto.

## ¿Por Qué es Importante?
- **Eficiencia:** Menos bloques = código más limpio.
- **Precisión:** Garantiza que la acción se repita exactamente el número de veces deseado.
- **Fundamento:** Este concepto de "bucle" es universal en todos los lenguajes de programación.

## Conexión con Otros Conceptos
El bloque "repetir" se combina perfectamente con:
- **Cambios de disfraz:** Para crear animaciones frame-by-frame.
- **Sensores:** Usando "repetir hasta que" para bucles condicionales.`,
      quiz: [
        {
          pregunta: "¿Cuál es la ventaja principal del bloque 'repetir'?",
          opciones: [
            "Hace que el código sea más colorido",
            "Permite ejecutar acciones múltiples veces automáticamente",
            "Solo funciona con el sprite del gato",
            "Requiere conexión a internet"
          ],
          respuesta_correcta: "Permite ejecutar acciones múltiples veces automáticamente"
        },
        {
          pregunta: "Si usas 'repetir (4)' con 'mover (50) pasos' dentro, ¿cuántos pasos totales dará el sprite?",
          opciones: ["4 pasos", "50 pasos", "200 pasos", "54 pasos"],
          respuesta_correcta: "200 pasos"
        },
        {
          pregunta: "¿Qué forma dibujarías si usas 'repetir (3)' con 'mover (100) pasos' y 'girar 120 grados'?",
          opciones: ["Un cuadrado", "Un triángulo", "Un círculo", "Una línea recta"],
          respuesta_correcta: "Un triángulo"
        }
      ]
    }, null, 2)
  }
];

// ============================================================
// 3. USER PROMPT TEMPLATE (Tarea Específica con Variables)
// ============================================================
export const USER_PROMPT_TEMPLATE = `[CONTEXTO]
Temática Semanal: {tematica_semanal}
Concepto del Día: {concepto_del_dia}
Tarea Específica del Pomodoro: {texto_del_pomodoro}
[/CONTEXTO]

Genera una lección educativa EXTREMADAMENTE DETALLADA Y ROBUSTA (mínimo 4000 palabras, superando los 25000 caracteres) siguiendo esta estructura:
1. **Título claro** con emoji.
2. **Explicación exhaustiva y profunda** del QUÉ, CÓMO y POR QUÉ, cubriendo todos los casos de uso y edge cases relevantes.
3. **Una analogía** clara para facilitar la comprensión.
4. **Si el tema involucra flujos, arquitecturas o procesos:** incluye un diagrama \`\`\`mermaid que visualice el concepto.
5. **Si hay conceptos que comparar (métodos, herramientas, enfoques):** incluye una tabla Markdown.
6. **3 ejemplos prácticos** progresivos con bloques de código.
7. **Conexión** con conceptos relacionados del contexto.
8. **Quiz** con 3 preguntas de opción múltiple, con campo "respuesta_correcta" usando la letra ("A", "B", "C" o "D").

Responde SOLO en formato JSON válido con las claves: "contenido" (string con Markdown completo incluyendo diagramas y tablas) y "quiz" (array de objetos con "pregunta", "opciones", "respuesta_correcta").`;

// ============================================================
// 4. BUILDER FUNCTION (Ensambla el Prompt Final)
// ============================================================
/**
 * Construye el array de mensajes para la API de Gemini.
 * @param {Object} context - { tematica_semanal, concepto_del_dia, texto_del_pomodoro }
 * @param {boolean} includeFewShot - Si incluir ejemplos (default: true)
 * @returns {Array<{role: string, content: string}>}
 */
export function buildLessonPromptMessages(context, includeFewShot = true) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT }
  ];

  // Agregar ejemplos opcionales
  if (includeFewShot) {
    messages.push(...FEW_SHOT_EXAMPLES);
  }

  // Agregar el prompt del usuario con variables reemplazadas
  const userPrompt = USER_PROMPT_TEMPLATE
    .replace('{tematica_semanal}', context.tematica_semanal || '')
    .replace('{concepto_del_dia}', context.concepto_del_dia || '')
    .replace('{texto_del_pomodoro}', context.texto_del_pomodoro || '');

  messages.push({ role: 'user', content: userPrompt });

  return messages;
}

// ============================================================
// 5. LEGACY EXPORT (Compatibilidad con código existente)
// ============================================================
export const TEMPLATE_PROMPT_UNIVERSAL = `${SYSTEM_PROMPT}

${USER_PROMPT_TEMPLATE}`;
