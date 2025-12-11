// AI CODE MENTOR - Interactive Quiz Component
// MISIÓN 147 FASE 2: Componente de quiz verdaderamente interactivo
// Elimina pre-resolución y implementa autoevaluación pedagógica real

import { useState } from 'react';

export default function InteractiveQuiz({ exercises }) {
  // Estado local para gestionar respuestas de cada pregunta
  const [quizState, setQuizState] = useState(() => {
    // Inicializar estado para cada ejercicio
    return exercises.map(() => ({
      userSelection: null,    // Índice de la opción seleccionada por el usuario
      isAnswered: false      // Si la pregunta ya fue respondida
    }));
  });

  // Función para manejar selección de respuesta
  const handleAnswerSelection = (questionIndex, optionIndex) => {
    // Solo permitir responder si no ha sido respondida
    if (quizState[questionIndex].isAnswered) return;

    // Actualizar estado de la pregunta específica
    setQuizState(prevState => {
      const newState = [...prevState];
      newState[questionIndex] = {
        userSelection: optionIndex,
        isAnswered: true
      };
      return newState;
    });

    console.log(`🎯 Quiz: Pregunta ${questionIndex + 1} respondida con opción ${optionIndex}`);
  };

  // Función para resetear una pregunta específica
  const resetQuestion = (questionIndex) => {
    setQuizState(prevState => {
      const newState = [...prevState];
      newState[questionIndex] = {
        userSelection: null,
        isAnswered: false
      };
      return newState;
    });
  };

  // Función para resetear todo el quiz
  const resetAllQuiz = () => {
    setQuizState(exercises.map(() => ({
      userSelection: null,
      isAnswered: false
    })));
  };

  // Si no hay ejercicios, no renderizar nada
  if (!exercises || exercises.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Header del quiz con estadísticas */}
      <div className="flex items-center justify-between">
        <h5 className="font-semibold text-gray-900">Ejercicios de Práctica:</h5>
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-gray-600">
            Respondidas: {quizState.filter(q => q.isAnswered).length}/{exercises.length}
          </span>
          {quizState.some(q => q.isAnswered) && (
            <button
              onClick={resetAllQuiz}
              className="text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Reiniciar Todo
            </button>
          )}
        </div>
      </div>

      {/* Lista de preguntas */}
      <div className="space-y-4">
        {exercises.map((exercise, questionIndex) => {
          const questionState = quizState[questionIndex];
          const isCorrect = questionState.isAnswered && 
                           questionState.userSelection === exercise.correctAnswerIndex;

          return (
            <div key={questionIndex} className="border border-gray-200 rounded-lg p-4">
              {/* Pregunta */}
              <div className="flex items-start justify-between mb-4">
                <h6 className="font-medium text-gray-900 flex-1">
                  {questionIndex + 1}. {exercise.question}
                </h6>
                {questionState.isAnswered && (
                  <button
                    onClick={() => resetQuestion(questionIndex)}
                    className="text-sm text-gray-500 hover:text-gray-700 ml-2"
                  >
                    Reintentar
                  </button>
                )}
              </div>

              {/* Opciones */}
              <div className="space-y-2 mb-4">
                {exercise.options.map((option, optionIndex) => {
                  let buttonClass = 'p-3 rounded text-sm text-left w-full transition-colors ';
                  
                  if (!questionState.isAnswered) {
                    // ESTADO INICIAL: Sin respuesta, clickeable
                    buttonClass += 'bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer';
                  } else {
                    // ESTADO RESPONDIDO: Mostrar feedback visual
                    const isThisCorrect = optionIndex === exercise.correctAnswerIndex;
                    const isUserSelection = optionIndex === questionState.userSelection;
                    
                    if (isThisCorrect) {
                      // Opción correcta: siempre verde
                      buttonClass += 'bg-green-100 border border-green-300 text-green-800';
                    } else if (isUserSelection) {
                      // Opción incorrecta seleccionada por el usuario: roja
                      buttonClass += 'bg-red-100 border border-red-300 text-red-800';
                    } else {
                      // Otras opciones: gris neutral
                      buttonClass += 'bg-gray-50 border border-gray-200 text-gray-600';
                    }
                    
                    buttonClass += ' cursor-default';
                  }

                  return (
                    <button
                      key={optionIndex}
                      onClick={() => handleAnswerSelection(questionIndex, optionIndex)}
                      disabled={questionState.isAnswered}
                      className={buttonClass}
                    >
                      <div className="flex items-center">
                        <span className="font-medium mr-3">
                          {String.fromCharCode(65 + optionIndex)}.
                        </span>
                        <span className="flex-1">{option}</span>
                        
                        {/* Indicadores visuales cuando está respondido */}
                        {questionState.isAnswered && (
                          <>
                            {optionIndex === exercise.correctAnswerIndex && (
                              <span className="ml-2 text-green-600 font-semibold">✓ Correcta</span>
                            )}
                            {optionIndex === questionState.userSelection && 
                             optionIndex !== exercise.correctAnswerIndex && (
                              <span className="ml-2 text-red-600 font-semibold">✗ Tu respuesta</span>
                            )}
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Resultado y explicación (solo visible cuando respondido) */}
              {questionState.isAnswered && (
                <div className="space-y-3">
                  {/* Indicador de resultado */}
                  <div className={`p-3 rounded-lg ${
                    isCorrect 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center">
                      <span className={`text-lg mr-2 ${
                        isCorrect ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isCorrect ? '🎉' : '😅'}
                      </span>
                      <span className={`font-medium ${
                        isCorrect ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {isCorrect ? '¡Correcto!' : 'Incorrecto'}
                      </span>
                      {!isCorrect && (
                        <span className="text-gray-700 ml-2">
                          La respuesta correcta es <strong>{String.fromCharCode(65 + exercise.correctAnswerIndex)}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Explicación */}
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-900">
                      <strong>Explicación:</strong> {exercise.explanation}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer con estadísticas finales */}
      {quizState.every(q => q.isAnswered) && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="text-center">
            <div className="text-indigo-900 font-semibold mb-2">
              🎯 Quiz Completado
            </div>
            <div className="text-sm text-indigo-700">
              Puntuación: {quizState.filter((q, index) => q.userSelection === exercises[index].correctAnswerIndex).length}/{exercises.length} preguntas correctas
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
