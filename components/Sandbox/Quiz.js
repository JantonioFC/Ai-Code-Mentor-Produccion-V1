import { useState } from 'react';

// Quiz.js - Componente Interactivo de Quiz
// MISIÓN 134.0: Desacoplar lógica de quiz de visualización de lección
// MISIÓN 188 COMPLETADA: Soporte para correctAnswerIndex (formato sandbox) y correctAnswer (formato legacy)
// FUNCIONALIDAD: Manejo de estado de interacción, selección de opciones, feedback visual
// PROPS: exercise object {question, options[], correctAnswerIndex|correctAnswer, explanation, type}

export default function Quiz({ exercise, questionNumber }) {
  // Estado del componente para manejar interactividad
  const [userSelection, setUserSelection] = useState(null); // Opción seleccionada por el usuario
  const [isAnswered, setIsAnswered] = useState(false); // Si el usuario ya respondió
  const [isCorrect, setIsCorrect] = useState(false); // Si la respuesta fue correcta

  // Función para manejar la selección de una opción
  const handleSelectOption = (selectedOptionIndex, selectedOption) => {
    // Prevenir nueva selección si ya respondió
    if (isAnswered) return;

    // Actualizar estado de selección
    setUserSelection(selectedOptionIndex);
    setIsAnswered(true);

    // MISIÓN 188: Verificar respuesta usando correctAnswerIndex (sandbox format)
    let isAnswerCorrect = false;
    
    if (typeof exercise.correctAnswerIndex === 'number') {
      // Formato sandbox: usar índice numérico
      isAnswerCorrect = selectedOptionIndex === exercise.correctAnswerIndex;
    } else if (exercise.correctAnswer) {
      // Formato legacy: usar texto de respuesta
      isAnswerCorrect = 
        selectedOption === exercise.correctAnswer || 
        String.fromCharCode(65 + selectedOptionIndex) === exercise.correctAnswer ||
        selectedOption.trim().toLowerCase() === exercise.correctAnswer.trim().toLowerCase();
    } else {
      console.warn('⚠️ [Quiz] Ejercicio sin correctAnswerIndex ni correctAnswer válido');
    }
    
    setIsCorrect(isAnswerCorrect);
  };

  // Función para obtener el estilo de cada opción
  const getOptionStyle = (optionIndex) => {
    if (!isAnswered) {
      // Estado inicial: opciones clicables
      return "flex items-start p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors";
    }

    if (optionIndex === userSelection) {
      // Opción seleccionada por el usuario
      return isCorrect 
        ? "flex items-start p-3 border-2 border-green-500 bg-green-50 rounded-md cursor-default" // Correcta
        : "flex items-start p-3 border-2 border-red-500 bg-red-50 rounded-md cursor-default"; // Incorrecta
    }

    // Otras opciones después de responder
    return "flex items-start p-3 border border-gray-200 bg-gray-50 rounded-md cursor-default opacity-60";
  };

  // Función para obtener el estilo de la letra identificadora
  const getLetterStyle = (optionIndex) => {
    if (!isAnswered) {
      return "inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-blue-600 bg-blue-100 rounded-full mr-3 mt-0.5 flex-shrink-0";
    }

    if (optionIndex === userSelection) {
      return isCorrect
        ? "inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-green-700 bg-green-200 rounded-full mr-3 mt-0.5 flex-shrink-0"
        : "inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-red-700 bg-red-200 rounded-full mr-3 mt-0.5 flex-shrink-0";
    }

    return "inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-gray-500 bg-gray-200 rounded-full mr-3 mt-0.5 flex-shrink-0";
  };

  // Función para reiniciar el quiz
  const handleReset = () => {
    setUserSelection(null);
    setIsAnswered(false);
    setIsCorrect(false);
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-green-300 shadow-sm">
      {/* Pregunta */}
      <div className="mb-4">
        <h6 className="font-medium text-green-800 mb-2">
          📝 Pregunta {questionNumber}:
        </h6>
        <p className="text-gray-800 font-medium">
          {exercise.question || exercise}
        </p>
      </div>

      {/* Opciones Multiple Choice Interactivas */}
      {exercise.options && Array.isArray(exercise.options) && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-600 mb-3">
            {isAnswered ? 'Tu respuesta:' : 'Selecciona una opción:'}
          </p>
          <div className="space-y-2">
            {exercise.options.map((option, optionIndex) => (
              <div
                key={optionIndex}
                className={getOptionStyle(optionIndex)}
                onClick={() => handleSelectOption(optionIndex, option)}
              >
                <span className={getLetterStyle(optionIndex)}>
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                <span className={`text-gray-700 ${isAnswered && optionIndex === userSelection ? 'font-medium' : ''}`}>
                  {option}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback después de responder */}
      {isAnswered && (
        <div className="space-y-3">
          {/* Resultado de la respuesta */}
          <div className={`p-3 rounded-md border ${
            isCorrect 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <p className={`text-sm font-medium mb-1 ${
              isCorrect ? 'text-green-700' : 'text-red-700'
            }`}>
              {isCorrect ? '🎉 ¡Correcto!' : '❌ Incorrecto'}
            </p>
            {!isCorrect && (
              <p className="text-red-800 text-sm">
                <strong>Respuesta correcta:</strong> {' '}
                {typeof exercise.correctAnswerIndex === 'number' && exercise.options
                  ? `${String.fromCharCode(65 + exercise.correctAnswerIndex)}) ${exercise.options[exercise.correctAnswerIndex]}`
                  : exercise.correctAnswer || 'No especificada'
                }
              </p>
            )}
          </div>

          {/* Explicación pedagógica */}
          {exercise.explanation && (
            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-sm font-medium text-blue-700 mb-1">
                💡 Explicación:
              </p>
              <p className="text-blue-800 text-sm">
                {exercise.explanation}
              </p>
            </div>
          )}

          {/* Botón para reintentar */}
          <div className="flex justify-end">
            <button
              onClick={handleReset}
              className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              🔄 Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Tipo de ejercicio (debug info) */}
      {exercise.type && (
        <div className="mt-3 text-xs text-gray-500">
          Tipo: {exercise.type}
        </div>
      )}
    </div>
  );
}