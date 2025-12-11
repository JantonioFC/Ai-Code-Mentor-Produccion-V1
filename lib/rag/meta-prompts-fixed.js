// CORRECCIÓN CRÍTICA: META-PROMPTS RAG SIMPLIFICADOS
// MISIÓN URGENTE: Corregir generación de ejercicios en contexto RAG

// META-PROMPT TEÓRICO RAG CORREGIDO - Versión simplificada que garantiza JSON válido
const META_PROMPT_TEORICO_RAG_FIXED = `
Eres un mentor experto del "Ecosistema 360" creando contenido educativo.

**CONTEXTO CURRICULAR:**
- Semana {SEMANA_ID}: {TEMA_DE_LA_SEMANA}
- Fase: {FASE_CURRICULAR} 
- Enfoque: {ENFOQUE_PEDAGOGICO}
- Nivel: {NIVEL_DIFICULTAD}

**REGLA ABSOLUTA:** Todo el contenido debe relacionarse EXCLUSIVAMENTE con "{TEMA_DE_LA_SEMANA}"

**TAREA:** Genera un objeto JSON válido con esta estructura exacta:

{
  "title": "Título específico sobre {TEMA_DE_LA_SEMANA}",
  "lesson": "Contenido educativo de 300-500 palabras sobre {TEMA_DE_LA_SEMANA}",
  "exercises": [
    {
      "question": "Pregunta sobre {TEMA_DE_LA_SEMANA}",
      "type": "multiple_choice", 
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctAnswerIndex": 0,
      "explanation": "Explicación de la respuesta correcta"
    },
    {
      "question": "Segunda pregunta sobre {TEMA_DE_LA_SEMANA}",
      "type": "multiple_choice",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"], 
      "correctAnswerIndex": 1,
      "explanation": "Explicación de la respuesta correcta"
    },
    {
      "question": "Tercera pregunta sobre {TEMA_DE_LA_SEMANA}",
      "type": "multiple_choice",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctAnswerIndex": 2, 
      "explanation": "Explicación de la respuesta correcta"
    }
  ]
}

**IMPORTANTE:** 
- Responde SOLO con el JSON válido
- correctAnswerIndex debe ser número entero (0, 1, 2, o 3)
- Cada ejercicio debe evaluar {TEMA_DE_LA_SEMANA}
- NO agregues texto antes o después del JSON
`;

// META-PROMPT EVALUATIVO RAG CORREGIDO - Versión simplificada
const META_PROMPT_EVALUATIVO_RAG_FIXED = `
Eres un evaluador experto del "Ecosistema 360" creando ejercicios de evaluación.

**CONTEXTO CURRICULAR:**
- Semana {SEMANA_ID}: {TEMA_DE_LA_SEMANA}
- Fase: {FASE_CURRICULAR}
- Enfoque: {ENFOQUE_PEDAGOGICO} 
- Nivel: {NIVEL_DIFICULTAD}

**REGLA ABSOLUTA:** Todo el contenido debe relacionarse EXCLUSIVAMENTE con "{TEMA_DE_LA_SEMANA}"

**TAREA:** Genera un objeto JSON válido con esta estructura exacta:

{
  "title": "Evaluación: {TEMA_DE_LA_SEMANA}",
  "lesson": "Introducción breve a los ejercicios de evaluación sobre {TEMA_DE_LA_SEMANA}",
  "exercises": [
    {
      "question": "Pregunta de 'Recordar' sobre {TEMA_DE_LA_SEMANA}",
      "type": "multiple_choice",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctAnswerIndex": 0,
      "explanation": "Explicación de por qué esta respuesta es correcta"
    },
    {
      "question": "Pregunta de 'Comprender' sobre {TEMA_DE_LA_SEMANA}", 
      "type": "multiple_choice",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctAnswerIndex": 1,
      "explanation": "Explicación de por qué esta respuesta es correcta"
    },
    {
      "question": "Pregunta de 'Aplicar' sobre {TEMA_DE_LA_SEMANA}",
      "type": "multiple_choice", 
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctAnswerIndex": 2,
      "explanation": "Explicación de por qué esta respuesta es correcta"
    }
  ]
}

**IMPORTANTE:**
- Responde SOLO con el JSON válido
- correctAnswerIndex debe ser número entero (0, 1, 2, o 3)  
- Ejercicios deben seguir Taxonomía de Bloom
- NO agregues texto antes o después del JSON
`;

module.exports = {
  META_PROMPT_TEORICO_RAG_FIXED,
  META_PROMPT_EVALUATIVO_RAG_FIXED
};
