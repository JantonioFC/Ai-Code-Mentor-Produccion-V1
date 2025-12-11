/**
 * ARM (Active Retrieval Module) - Extractor Component
 * 
 * Este módulo implementa el segundo componente del ARM según la ARQUITECTURA VIVA v7.0.
 * El Extractor es responsable de procesar el HTML crudo obtenido por el Retriever
 * y extraer únicamente el contenido pedagógico relevante.
 * 
 * Principios implementados:
 * - 3.8: Procesamiento Defensivo de Datos No Estructurados
 * - K.I.S.S.: Mantiene la lógica simple pero robusta
 * - Fail Fast: Valida entrada y maneja errores de forma clara
 * 
 * @author Mentor Coder
 * @version 1.0.0
 * @fecha 2025-09-18
 */

const cheerio = require('cheerio');

/**
 * Selectores comunes para identificar el contenido principal de una página.
 * Ordenados por prioridad: más específicos primero, más genéricos al final.
 */
const MAIN_CONTENT_SELECTORS = [
  // Semánticos HTML5
  'main[role="main"]',
  'main',
  'article',
  '[role="main"]',
  
  // Selectores específicos de plataformas educativas comunes
  '.lesson-content',
  '.course-content',
  '.article-content',
  '.post-content',
  '.content-main',
  
  // Selectores genéricos comunes
  '#main-content',
  '#content',
  '#primary',
  '.main-content',
  '.content',
  '.entry-content',
  
  // Como último recurso, buscar el contenedor más probable
  'body'
];

/**
 * Selectores de elementos que deben eliminarse del contenido extraído.
 * Estos elementos típicamente no contienen contenido pedagógico útil.
 */
const NOISE_SELECTORS = [
  'script',
  'style',
  'nav',
  'header',
  'footer',
  '.navigation',
  '.nav',
  '.menu',
  '.sidebar',
  '.advertisement',
  '.ads',
  '.social-share',
  '.comments',
  '.comment',
  '.breadcrumb',
  '[role="banner"]',
  '[role="navigation"]',
  '[role="complementary"]',
  '[role="contentinfo"]'
];

/**
 * Extrae el contenido principal de texto de una cadena HTML.
 * 
 * Esta función implementa una estrategia defensiva que:
 * - Intenta múltiples selectores para encontrar el contenido principal
 * - Limpia el contenido de elementos no textuales
 * - Normaliza espacios en blanco y saltos de línea
 * - Maneja casos donde no se encuentra contenido sin fallar
 * 
 * @param {string} htmlString - El contenido HTML crudo a procesar
 * @returns {string|null} El texto limpio extraído, o null si no se encuentra contenido
 * 
 * @example
 * // Uso básico con HTML válido
 * const html = '<main><h1>Título</h1><p>Contenido pedagógico</p></main>';
 * const content = extractMainContent(html);
 * console.log(content); // "Título\n\nContenido pedagógico"
 * 
 * @example
 * // Manejo de HTML sin estructura clara
 * const messyHtml = '<div>Contenido mezclado<script>alert("ads");</script></div>';
 * const content = extractMainContent(messyHtml);
 * // Devuelve el contenido limpio sin scripts
 * 
 * @example
 * // Manejo de entrada inválida
 * const content = extractMainContent(''); // Devuelve null sin fallar
 * const content2 = extractMainContent(null); // Devuelve null sin fallar
 */
function extractMainContent(htmlString) {
  console.log('[ARM-EXTRACTOR] Iniciando extracción de contenido...');

  // Validación de entrada - Fail Fast (Principio 4.3)
  if (!htmlString || typeof htmlString !== 'string') {
    console.log('[ARM-EXTRACTOR] Entrada inválida - devolviendo null');
    return null;
  }

  if (htmlString.trim().length === 0) {
    console.log('[ARM-EXTRACTOR] HTML vacío - devolviendo null');
    return null;
  }

  try {
    // Cargar el HTML con cheerio
    const $ = cheerio.load(htmlString);
    console.log(`[ARM-EXTRACTOR] HTML cargado - ${htmlString.length} caracteres`);

    // Primero, eliminar elementos de ruido de todo el documento
    // Esto mejora la calidad de la extracción posterior
    NOISE_SELECTORS.forEach(selector => {
      const removed = $(selector).remove();
      if (removed.length > 0) {
        console.log(`[ARM-EXTRACTOR] Eliminados ${removed.length} elementos: ${selector}`);
      }
    });

    // Buscar el contenido principal usando los selectores ordenados por prioridad
    let mainContentElement = null;
    let usedSelector = null;

    for (const selector of MAIN_CONTENT_SELECTORS) {
      const element = $(selector);
      if (element.length > 0) {
        mainContentElement = element.first();
        usedSelector = selector;
        console.log(`[ARM-EXTRACTOR] Contenido encontrado usando selector: ${selector}`);
        break;
      }
    }

    // Si no se encontró contenido principal, implementar estrategia defensiva
    if (!mainContentElement) {
      console.log('[ARM-EXTRACTOR] Advertencia: No se encontró contenido principal con selectores estándar');
      // Como última opción, intentar extraer todo el texto del body
      mainContentElement = $('body');
      usedSelector = 'body (fallback)';
    }

    // Si aún no hay contenido, devolver null sin fallar
    if (!mainContentElement || mainContentElement.length === 0) {
      console.log('[ARM-EXTRACTOR] No se pudo extraer contenido - devolviendo null');
      return null;
    }

    // Extraer el texto limpio
    let extractedText = mainContentElement.text();

    // Normalizar espacios en blanco y saltos de línea
    extractedText = extractedText
      .replace(/\s+/g, ' ')           // Múltiples espacios → un espacio
      .replace(/\n\s*\n/g, '\n\n')    // Múltiples saltos de línea → doble salto
      .trim();                        // Eliminar espacios al inicio/final

    console.log(`[ARM-EXTRACTOR] Extracción completada - Selector: ${usedSelector}, Texto: ${extractedText.length} caracteres`);

    // Validación final: si el texto extraído está vacío, devolver null
    if (!extractedText || extractedText.length === 0) {
      console.log('[ARM-EXTRACTOR] Texto extraído vacío - devolviendo null');
      return null;
    }

    // Log del texto extraído (primeros 200 caracteres para debug)
    const preview = extractedText.length > 200 
      ? extractedText.substring(0, 200) + '...'
      : extractedText;
    console.log(`[ARM-EXTRACTOR] Vista previa del contenido: "${preview}"`);

    return extractedText;

  } catch (error) {
    // Manejo defensivo de errores - no fallar, sino devolver null y loggear
    console.error(`[ARM-EXTRACTOR] Error durante la extracción: ${error.message}`);
    console.error('[ARM-EXTRACTOR] Devolviendo null debido al error');
    return null;
  }
}

/**
 * Función de utilidad para obtener estadísticas del contenido extraído.
 * Útil para debugging y monitoreo de la calidad de la extracción.
 * 
 * @param {string} htmlString - El contenido HTML a analizar
 * @returns {Object} Objeto con estadísticas del contenido
 */
function getExtractionStats(htmlString) {
  const extractedContent = extractMainContent(htmlString);
  
  if (!extractedContent) {
    return {
      success: false,
      textLength: 0,
      wordCount: 0,
      lineCount: 0
    };
  }

  return {
    success: true,
    textLength: extractedContent.length,
    wordCount: extractedContent.split(/\s+/).length,
    lineCount: extractedContent.split('\n').length,
    preview: extractedContent.substring(0, 100) + (extractedContent.length > 100 ? '...' : '')
  };
}

module.exports = {
  extractMainContent,
  getExtractionStats,
  // Exportar constantes para testing
  MAIN_CONTENT_SELECTORS,
  NOISE_SELECTORS
};
