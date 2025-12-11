/**
 * MISIÓN 18: MOCK DE RESPUESTA SANDBOX
 * 
 * Fixture determinista para test E2E SANDBOX-001
 * Simula respuesta exitosa de Gemini API sin llamadas de red reales
 * 
 * OBJETIVO: Transformar pipeline de ROJO → VERDE mediante aislamiento
 * de dependencia externa no determinista (Gemini API)
 */

/**
 * Mock de respuesta exitosa de /api/sandbox/generate
 * Estructura basada en generate.js (líneas 251-262)
 */
const mockSandboxResponse = {
  title: "Conceptos Básicos de JavaScript ES6",
  lesson: `# Conceptos Básicos de JavaScript ES6

## Introducción

JavaScript ES6 (ECMAScript 2015) introdujo mejoras significativas al lenguaje, incluyendo arrow functions y destructuring, que simplifican el código y mejoran la legibilidad.

## Conceptos Clave

### Arrow Functions

Las arrow functions proporcionan una sintaxis más concisa para escribir funciones:

\`\`\`javascript
// Función tradicional
const suma = function(a, b) {
  return a + b;
};

// Arrow function
const suma = (a, b) => a + b;
\`\`\`

**Características:**
- Sintaxis más corta
- Binding léxico de \`this\`
- Retorno implícito en funciones de una línea

### Destructuring

El destructuring permite extraer valores de arrays u objetos en variables distintas:

\`\`\`javascript
// Destructuring de objetos
const persona = { nombre: 'Juan', edad: 30 };
const { nombre, edad } = persona;

// Destructuring de arrays
const numeros = [1, 2, 3];
const [primero, segundo] = numeros;
\`\`\`

**Ventajas:**
- Código más limpio
- Extracción rápida de propiedades
- Valores por defecto integrados

## Ejemplos Prácticos

### Arrow Functions en Array Methods

\`\`\`javascript
const numeros = [1, 2, 3, 4, 5];

// Usar arrow function con map
const dobles = numeros.map(n => n * 2);
console.log(dobles); // [2, 4, 6, 8, 10]

// Filtrar con arrow function
const pares = numeros.filter(n => n % 2 === 0);
console.log(pares); // [2, 4]
\`\`\`

### Destructuring en Parámetros de Función

\`\`\`javascript
// Función que recibe objeto con destructuring
const saludar = ({ nombre, edad }) => {
  console.log(\`Hola \${nombre}, tienes \${edad} años\`);
};

saludar({ nombre: 'Ana', edad: 25 });
// Output: "Hola Ana, tienes 25 años"
\`\`\`

## Analogía para Mejor Comprensión

**Arrow Functions:** Imagina que las arrow functions son el "modo express" en un restaurante. En lugar de escribir toda la receta completa (función tradicional), solo escribes los ingredientes y el plato está listo automáticamente.

**Destructuring:** Es como desempacar una maleta directamente en cajones específicos. En lugar de sacar todo y luego organizarlo, cada cosa va directamente a su lugar correcto.

## Mejores Prácticas

1. **Arrow Functions:**
   - Usa arrow functions para callbacks simples
   - Evítalas cuando necesites \`this\` dinámico
   - Úsalas en métodos de array (map, filter, reduce)

2. **Destructuring:**
   - Aplícalo en parámetros de función para mayor claridad
   - Usa nombres descriptivos en destructuring
   - Aprovecha valores por defecto cuando sea apropiado

## Conclusión

Arrow functions y destructuring son herramientas fundamentales de ES6 que:
- Reducen la cantidad de código necesario
- Mejoran la legibilidad del código
- Simplifican operaciones comunes
- Son ampliamente adoptadas en JavaScript moderno

Dominar estos conceptos es esencial para escribir código JavaScript moderno y eficiente.`,
  
  exercises: [
    {
      question: "¿Cuál es una ventaja clave de las arrow functions en JavaScript ES6?",
      type: "multiple_choice",
      options: [
        "Proporcionan sintaxis más concisa y binding léxico de this",
        "Son más rápidas en ejecución que funciones tradicionales",
        "Permiten múltiples valores de retorno",
        "Solo funcionan con arrays"
      ],
      correctAnswerIndex: 0,
      explanation: "Las arrow functions ofrecen una sintaxis más corta y tienen binding léxico de 'this', lo que significa que heredan el contexto del scope en el que fueron definidas."
    },
    {
      question: "¿Qué hace el siguiente código? const { nombre, edad } = persona;",
      type: "multiple_choice",
      options: [
        "Crea un objeto con dos propiedades",
        "Extrae las propiedades nombre y edad del objeto persona en variables separadas",
        "Compara dos objetos",
        "Define una función con dos parámetros"
      ],
      correctAnswerIndex: 1,
      explanation: "Este código usa destructuring para extraer las propiedades 'nombre' y 'edad' del objeto 'persona' y crear variables independientes con esos valores."
    },
    {
      question: "¿Cuándo es apropiado usar arrow functions en lugar de funciones tradicionales?",
      type: "multiple_choice",
      options: [
        "Siempre, sin excepciones",
        "Nunca, son solo sintaxis alternativa",
        "En callbacks simples y métodos de array, pero evitando cuando se necesita this dinámico",
        "Solo en loops"
      ],
      correctAnswerIndex: 2,
      explanation: "Las arrow functions son ideales para callbacks simples y métodos de array (map, filter, etc.), pero deben evitarse cuando se necesita un 'this' dinámico ya que tienen binding léxico."
    }
  ],
  
  generatedAt: new Date().toISOString(),
  inputLength: 85, // Longitud del input de test: "Explícame los conceptos básicos de JavaScript ES6..."
  
  sandboxMetadata: {
    endpointType: "sandbox_gemini_v2_MOCK",
    promptVersion: "pedagogical_fidelity_v2.0",
    contentSource: "mock_test_fixture",
    processingMode: "e2e_deterministic_mock",
    architecture: "playwright_route_interceptor",
    missionId: "M-18",
    isMock: true
  }
};

module.exports = { mockSandboxResponse };
