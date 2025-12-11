// core/lessonsService.js
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

const lessonsDirectory = path.resolve(process.cwd(), 'db/lessons');

/**
 * Asegura que el directorio de lecciones existe, creándolo si es necesario.
 */
const ensureLessonsDirectory = () => {
  if (!fsSync.existsSync(lessonsDirectory)) {
    fsSync.mkdirSync(lessonsDirectory, { recursive: true });
    console.log(`📁 Directorio de lecciones creado: ${lessonsDirectory}`);
  }
};

/**
 * Escanea el directorio de lecciones y devuelve una lista de metadatos
 * de todas las lecciones disponibles.
 * @returns {Promise<Array<object>>} Una lista de objetos, cada uno con el id y título de una lección.
 */
export const getAllLessons = async () => {
  ensureLessonsDirectory();
  try {
    const filenames = await fs.readdir(lessonsDirectory);
    
    // Filtramos para ignorar archivos que no son JSON o el de ejemplo.
    const lessonFiles = filenames.filter(
      (file) => file.endsWith('.json') && file !== '_example.json'
    );

    const lessons = await Promise.all(
      lessonFiles.map(async (filename) => {
        const filePath = path.join(lessonsDirectory, filename);
        const fileContents = await fs.readFile(filePath, 'utf8');
        const lessonData = JSON.parse(fileContents);
        
        // Devolvemos solo los metadatos necesarios para una lista.
        return {
          lessonId: lessonData.lessonId,
          title: lessonData.title,
        };
      })
    );
    
    return lessons;
  } catch (error) {
    console.error('Error al leer las lecciones:', error);
    return []; // Devolvemos un array vacío si hay un error.
  }
};

/**
 * Obtiene el contenido completo de una lección específica por su ID.
 * @param {string} lessonId - El ID de la lección a obtener.
 * @returns {Promise<object|null>} El objeto completo de la lección o null si no se encuentra.
 */
export const getLessonById = async (lessonId) => {
    ensureLessonsDirectory();
    try {
        // Asumimos que el ID de la lección corresponde al nombre del archivo por simplicidad
        const filename = `${lessonId}.json`;
        const filePath = path.join(lessonsDirectory, filename);
        const fileContents = await fs.readFile(filePath, 'utf8');
        return JSON.parse(fileContents);
    } catch (error) {
        console.error(`Error al leer la lección ${lessonId}:`, error);
        return null; // Devuelve null si no se encuentra o hay error
    }
}
