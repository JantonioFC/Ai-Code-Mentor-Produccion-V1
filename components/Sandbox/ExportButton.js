import { useState } from 'react';

// ExportButton.js - Botón para exportar lección a archivo Markdown
// MISIÓN 216.0 FASE 4: Exportación de lecciones generadas a formato .md
// CORRECCIÓN BUG-216-1: UTF-8 encoding, formato de fecha y normalización de filename

export default function ExportButton({ generatedLesson }) {
  const [isExporting, setIsExporting] = useState(false);

  // Función auxiliar para normalizar texto (remover acentos y caracteres especiales)
  const normalizeText = (text) => {
    if (!text) return '';
    
    return text
      .normalize('NFD') // Descomponer caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '') // Remover marcas diacríticas
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remover caracteres especiales (mantener espacios)
      .trim()
      .replace(/\s+/g, '-') // Reemplazar espacios con guión simple
      .replace(/-+/g, '-') // Colapsar múltiples guiones en uno
      .toLowerCase();
  };

  // Función para formatear fecha de forma consistente
  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // Función para generar contenido Markdown
  const generateMarkdown = (lesson) => {
    if (!lesson) return '';

    const lines = [];

    // Título
    if (lesson.title) {
      lines.push(`# ${lesson.title}`);
      lines.push('');
    }

    // Metadata
    lines.push('---');
    
    // Usar generatedAt si existe y es válido, sino usar fecha actual
    let generatedDate;
    if (lesson.generatedAt) {
      generatedDate = new Date(lesson.generatedAt);
      // Validar que la fecha sea válida
      if (isNaN(generatedDate.getTime())) {
        console.warn('[EXPORT] generatedAt inválido, usando fecha actual');
        generatedDate = new Date();
      }
    } else {
      console.warn('[EXPORT] generatedAt no disponible, usando fecha actual');
      generatedDate = new Date();
    }
    lines.push(`**Generado:** ${formatDateTime(generatedDate)}`);
    if (lesson.inputLength) {
      lines.push(`**Contenido procesado:** ${lesson.inputLength} caracteres`);
    }
    if (lesson.exercises && lesson.exercises.length > 0) {
      lines.push(`**Ejercicios:** ${lesson.exercises.length}`);
    }
    lines.push('---');
    lines.push('');

    // Contenido principal
    if (lesson.lesson) {
      lines.push('## 📖 Contenido de la Lección');
      lines.push('');
      lines.push(lesson.lesson);
      lines.push('');
    }

    // Ejercicios
    if (lesson.exercises && lesson.exercises.length > 0) {
      lines.push('---');
      lines.push('');
      lines.push('## 🎯 Ejercicios Interactivos');
      lines.push('');

      lesson.exercises.forEach((exercise, index) => {
        lines.push(`### Ejercicio ${index + 1}`);
        lines.push('');
        
        // Pregunta
        if (exercise.question) {
          lines.push(`**Pregunta:** ${exercise.question}`);
          lines.push('');
        }

        // Opciones
        if (exercise.options && Array.isArray(exercise.options)) {
          lines.push('**Opciones:**');
          exercise.options.forEach((option, optIndex) => {
            const isCorrect = exercise.correctAnswerIndex === optIndex;
            const marker = isCorrect ? '✅' : '   ';
            lines.push(`${marker} ${String.fromCharCode(65 + optIndex)}. ${option}`);
          });
          lines.push('');
        }

        // Explicación
        if (exercise.explanation) {
          lines.push('**Explicación:**');
          lines.push(exercise.explanation);
          lines.push('');
        }

        lines.push('');
      });
    }

    // Footer
    lines.push('---');
    lines.push('');
    lines.push('*Generado por Sandbox de Aprendizaje - AI Code Mentor*');
    lines.push('');

    return lines.join('\n');
  };

  // Función para descargar archivo
  const handleExport = () => {
    if (!generatedLesson) {
      console.error('❌ [EXPORT] No hay lección para exportar');
      return;
    }

    setIsExporting(true);

    try {
      console.log('📥 [EXPORT] Generando archivo Markdown...');

      // Generar contenido Markdown
      const markdownContent = generateMarkdown(generatedLesson);

      // CORRECCIÓN BUG-216-1: Agregar BOM UTF-8 para mejor compatibilidad
      // BOM (Byte Order Mark) ayuda a editores de texto a detectar UTF-8
      const BOM = '\uFEFF';
      const contentWithBOM = BOM + markdownContent;

      // Crear blob con encoding UTF-8 explícito
      const blob = new Blob([contentWithBOM], { 
        type: 'text/markdown;charset=utf-8' 
      });

      // Generar nombre de archivo con normalización correcta
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
      
      // CORRECCIÓN BUG-216-1: Normalización mejorada del título
      const title = generatedLesson.title 
        ? normalizeText(generatedLesson.title.substring(0, 40))
        : 'leccion-sandbox';
      
      const filename = `${title}-${dateStr}-${timeStr}.md`;

      // Crear URL y descargar
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ [EXPORT] Archivo descargado:', filename);

      // Mensaje de éxito breve
      setTimeout(() => {
        alert(`✅ Lección exportada: ${filename}`);
      }, 100);

    } catch (error) {
      console.error('❌ [EXPORT] Error:', error);
      alert('❌ Error al exportar la lección. Revisa la consola.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={!generatedLesson || isExporting}
      className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
        !generatedLesson || isExporting
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : 'bg-green-600 text-white hover:bg-green-700 transform hover:scale-105 shadow-md hover:shadow-lg'
      }`}
      title="Exportar lección a archivo Markdown"
    >
      {isExporting ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Exportando...
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar .md
        </>
      )}
    </button>
  );
}
