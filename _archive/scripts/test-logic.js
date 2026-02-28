const processContent = (rawContent) => {
    if (!rawContent) return '';

    let processed = rawContent;

    if (typeof processed === 'string') {
        const trimmed = processed.trim();

        // 1. Intentar extraer de bloques de código markdown solo si parece ser un objeto JSON
        const codeBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i;
        const match = trimmed.match(codeBlockRegex);

        if (match) {
            try {
                const parsed = JSON.parse(match[1]);
                return processContent(parsed); // Recursivo con el objeto parseado
            } catch (e) {
                // Si falla el parseo, devolver el texto original para no perder el markdown
                return processed;
            }
        }

        // 2. Si es un string que parece JSON directo
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                const parsed = JSON.parse(trimmed);
                return processContent(parsed);
            } catch (e) {
                return processed;
            }
        }

        return processed;
    } else if (typeof processed === 'object') {
        // Extraer campos conocidos
        const extracted = processed.lesson || processed.contenido || processed.content;

        if (extracted) {
            if (typeof extracted === 'object') {
                return JSON.stringify(extracted, null, 2);
            }
            return processContent(extracted);
        }

        // Fallback: si es un objeto sin campos conocidos, mostrarlo como JSON
        return JSON.stringify(processed, null, 2);
    }
    return String(processed);
};

// TEST CASE 1: The data found in DB
const dbData = {
    "title": "Lección: Semana 7, Día 5, Pomodoro 2",
    "lesson": "```json\n{\n  \"contenido\": \"# 💾 Recuperación de Datos\\n\\nBla bla bla\\n\\n```javascript\\nconsole.log('test')\\n```\"\n}\n```",
    "exercises": []
};

const result = processContent(dbData);
console.log('Result length:', result.length);
console.log('Result start:', result.substring(0, 100));
console.log('Is result just the code block?:', !result.includes('# 💾'));
