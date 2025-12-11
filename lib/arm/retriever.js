/**
 * ARM (Active Retrieval Module) - Retriever Component
 * 
 * Este módulo implementa el primer componente del ARM según la ARQUITECTURA VIVA v7.0.
 * El Recuperador es responsable de obtener contenido HTML crudo de URLs externas
 * de forma robusta y resiliente.
 * 
 * Principios implementados:
 * - 3.7: Manejo Resiliente de Red (async/await, manejo de errores, verificación de códigos de estado)
 * - 3.9: Ciudadanía Digital Responsable (User-Agent personalizado, identificación clara)
 * 
 * @author Mentor Coder
 * @version 1.0.0
 * @fecha 2025-09-18
 */

/**
 * Obtiene el contenido HTML crudo de una URL específica de forma robusta.
 * 
 * Esta función implementa un cliente HTTP resiliente que:
 * - Maneja errores de red de forma controlada
 * - Verifica códigos de estado HTTP
 * - Se identifica como ciudadano digital responsable
 * - Proporciona logs dinámicos sobre el estado de la operación
 * 
 * @param {string} url - La URL de la fuente oficial a consultar
 * @returns {Promise<string>} El contenido HTML crudo de la página
 * @throws {Error} Si la URL no es válida, la petición falla, o el código de estado no es 200
 * 
 * @example
 * // Uso básico
 * const html = await fetchRawHTML('https://ai.google/responsibility/principles/');
 * console.log(html); // Contenido HTML de la página
 * 
 * @example  
 * // Manejo de errores
 * try {
 *   const html = await fetchRawHTML('https://ejemplo-invalido.com/404');
 * } catch (error) {
 *   console.error('Error al obtener contenido:', error.message);
 * }
 */
async function fetchRawHTML(url) {
  // Validación de entrada - Fail Fast
  if (!url || typeof url !== 'string') {
    throw new Error('ARM-RETRIEVER-001: URL debe ser una cadena válida');
  }

  // Validación básica de formato URL
  try {
    new URL(url);
  } catch (urlError) {
    throw new Error(`ARM-RETRIEVER-002: URL no válida - ${urlError.message}`);
  }

  console.log(`[ARM-RETRIEVER] Iniciando petición HTTP a: ${url}`);

  try {
    // Configuración de la petición HTTP con User-Agent personalizado
    // Implementa Principio 3.9: Ciudadanía Digital Responsable
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'MentorCoder/1.0 (Ecosistema360 Educational Platform; +https://github.com/ecosistema360)'
      },
      // Timeout implícito - Node.js fetch tiene timeout por defecto
      // Para implementación futura: AbortController para timeouts personalizados
    });

    console.log(`[ARM-RETRIEVER] Respuesta recibida - Código: ${response.status} ${response.statusText}`);

    // Implementa Principio 3.7: Verificación de códigos de estado HTTP
    if (!response.ok) {
      // Manejo específico para diferentes códigos de error
      if (response.status === 404) {
        throw new Error(`ARM-RETRIEVER-404: Recurso no encontrado en ${url}`);
      } else if (response.status >= 500) {
        throw new Error(`ARM-RETRIEVER-5XX: Error del servidor (${response.status}) en ${url}`);
      } else if (response.status === 403) {
        throw new Error(`ARM-RETRIEVER-403: Acceso denegado a ${url}`);
      } else {
        throw new Error(`ARM-RETRIEVER-HTTP: Error HTTP ${response.status} - ${response.statusText} para ${url}`);
      }
    }

    // Obtener el contenido HTML como texto
    const htmlContent = await response.text();
    
    console.log(`[ARM-RETRIEVER] Contenido obtenido exitosamente - Tamaño: ${htmlContent.length} caracteres`);
    
    // Validación básica del contenido obtenido
    if (!htmlContent || htmlContent.length === 0) {
      throw new Error(`ARM-RETRIEVER-EMPTY: Contenido vacío recibido de ${url}`);
    }

    return htmlContent;

  } catch (error) {
    // Manejo de errores de red y otros errores del fetch
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      // Error de red típico (DNS, conexión, timeout)
      console.error(`[ARM-RETRIEVER] Error de red: ${error.message}`);
      throw new Error(`ARM-RETRIEVER-NETWORK: Error de conexión de red para ${url} - ${error.message}`);
    } else if (error.message.startsWith('ARM-RETRIEVER-')) {
      // Re-lanzar errores controlados que ya tienen el formato correcto
      console.error(`[ARM-RETRIEVER] Error controlado: ${error.message}`);
      throw error;
    } else {
      // Error inesperado
      console.error(`[ARM-RETRIEVER] Error inesperado: ${error.message}`);
      throw new Error(`ARM-RETRIEVER-UNEXPECTED: Error inesperado al obtener ${url} - ${error.message}`);
    }
  }
}

module.exports = {
  fetchRawHTML
};
