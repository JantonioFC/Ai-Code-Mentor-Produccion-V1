// utils/formatters.js

/**
 * Formatea una cadena de fecha ISO a un formato localizado legible,
 * utilizando la configuración regional del sistema del usuario por defecto.
 * @param {string} isoString - La fecha en formato ISO (ej. '2025-09-01T08:03:51.028Z').
 * @returns {string} La fecha formateada (ej. '1/9/2025, 05:03:51').
 */
export const formatDate = (isoString) => {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  // Usar toLocaleString() sin argumentos utiliza el locale y timezone del sistema.
  return date.toLocaleString(); 
};
