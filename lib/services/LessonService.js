import { logger } from '../utils/logger';

// --- Modern JS Pattern: Functional Composition Utility aka "Pipe" ---
// Allows flowing data through a series of pure functions
const pipe = (...fns) => (x) => fns.reduce((v, f) => v.then(f), Promise.resolve(x));

const MOCK_DELAY = 1000;

export class LessonService {

    // Public Interface remains clean
    async generateLesson(params) {
        logger.info(`[LessonService] Pipeline Started: ${params.topic}`);

        // Execute Functional Pipeline
        const result = await pipe(
            this._validateContext,
            this._simulateAIGeneration,
            this._structureOutput,
            this._enrichMetadata
        )(params);

        return result;
    }

    // --- Functional Stages (Pure-ish transformation steps) ---

    _validateContext = async (data) => {
        // Example of "Guard Clause" pattern
        if (!data.topic) throw new Error('Topic is required');
        return {
            ...data,
            timestamp: Date.now()
        };
    }

    _simulateAIGeneration = async (data) => {
        await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
        return {
            ...data,
            rawContent: `# ${data.topic}\n\nGenerated content for ${data.difficulty} level.`
        };
    }

    _structureOutput = async (data) => {
        return {
            id: `gen-${data.timestamp}`,
            title: `Lección experta: ${data.topic}`, // Template Literal
            content: data.rawContent,
            difficulty: data.difficulty,
            language: data.language || 'es'
        };
    }

    _enrichMetadata = async (lesson) => {
        // Destructuring & Spread
        return {
            ...lesson,
            metadata: {
                engine: 'v3-pipeline',
                generated_at: new Date().toISOString(),
                ...lesson.metadata
            }
        };
    }
}

export const lessonService = new LessonService();
