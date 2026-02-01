
import { z } from 'zod';

export const generateLessonSchema = z.object({
    topic: z.string().min(3).max(100).describe('The main topic of the lesson'),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe('Target difficulty level'),
    language: z.string().default('es').describe('Language code (es, en)'),
    user_id: z.string().optional().describe('User ID if authenticated')
});

export type GenerateLessonParams = z.infer<typeof generateLessonSchema>;
