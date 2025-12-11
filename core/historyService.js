// core/historyService.js
import fs from 'fs/promises';
import path from 'path';

// La ruta a nuestro archivo de "base de datos" JSON.
const historyFilePath = path.resolve(process.cwd(), 'data/history.json');

/**
 * Lee y parsea el historial de análisis con opciones de paginación.
 * @param {Object} options - Opciones de consulta.
 * @param {number} options.limit - Número máximo de elementos a devolver.
 * @returns {Promise<Array>} Un array con las entradas del historial.
 */
export const getHistory = async (options = {}) => {
  const { limit } = options;
  try {
    const data = await fs.readFile(historyFilePath, 'utf8');
    let history = JSON.parse(data);

    if (limit) {
      return history.slice(0, parseInt(limit, 10));
    }
    
    return history;
  } catch (error) {
    // Si el archivo no existe o hay un error, devolvemos un array vacío.
    console.error('Error al leer el historial:', error);
    return [];
  }
};

/**
 * Añade una nueva entrada al historial de análisis.
 * @param {object} analysisEntry - El objeto de análisis a guardar.
 */
export const addToHistory = async (analysisEntry) => {
  try {
    const history = await getHistory();
    history.unshift(analysisEntry); // Añade la nueva entrada al principio
    await fs.writeFile(historyFilePath, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Error al escribir en el historial:', error);
  }
};
