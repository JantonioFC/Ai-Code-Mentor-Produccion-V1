/**
 * LessonFactory - Generador de datos de prueba para Lecciones
 * Patrón: Object Mother / Factory
 */
export class LessonFactory {
    static create(overrides = {}) {
        return {
            id: overrides.id || `lesson-${Math.random().toString(36).substr(2, 9)}`,
            title: overrides.title || 'Introducción a React Hooks',
            content: overrides.content || '# React Hooks\n\nLos hooks permiten usar estado...',
            difficulty: overrides.difficulty || 'beginner',
            topics: overrides.topics || ['react', 'hooks', 'frontend'],
            estimated_time: overrides.estimated_time || '30 min',
            source_url: overrides.source_url || 'https://react.dev',
            generated_at: overrides.generated_at || new Date().toISOString(),
            exercises: overrides.exercises || [],
            ...overrides
        };
    }

    static createList(count, overrides = {}) {
        return Array.from({ length: count }).map((_, index) =>
            this.create({ ...overrides, id: `lesson-${index}` })
        );
    }
}
