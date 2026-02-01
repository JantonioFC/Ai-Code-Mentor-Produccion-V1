
// __tests__/lib/services/SmartLessonGenerator.test.js
import { smartLessonGenerator } from '../../../lib/services/SmartLessonGenerator';
import { queryExpander } from '../../../lib/rag/QueryExpander';
import { contentRetriever } from '../../../lib/rag/ContentRetriever';
import { lessonService } from '../../../lib/services/LessonService';

// Mock dependencies
jest.mock('../../../lib/rag/QueryExpander', () => ({
    queryExpander: { expand: jest.fn().mockResolvedValue(['expanded query']) }
}));
jest.mock('../../../lib/rag/ContentRetriever', () => ({
    contentRetriever: { retrieve: jest.fn() }
}));
jest.mock('../../../lib/services/LessonService', () => ({
    lessonService: {
        generateLesson: jest.fn().mockResolvedValue({
            content: 'Mocked Lesson',
            metadata: { attempts: 1 }
        })
    }
}));
// Auto-mock ClarityGate class
jest.mock('../../../lib/ai/ClarityGate');

describe('SmartLessonGenerator (Agentic Logic)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default mocks
        queryExpander.expand.mockResolvedValue(['expanded query']);
        contentRetriever.retrieve.mockResolvedValue([{ content: 'context data' }]);

        // Mock the instance method directly
        // smartLessonGenerator.gate is the instance of ClarityGate
        smartLessonGenerator.gate.checkRelevance.mockResolvedValue({ isRelevant: true, score: 0.9 });
    });

    test('should generate lesson successfully on first try', async () => {
        await smartLessonGenerator.generateWithAutonomy({ topic: 'React' });

        expect(contentRetriever.retrieve).toHaveBeenCalledTimes(1);
        expect(smartLessonGenerator.gate.checkRelevance).toHaveBeenCalled();
    });

    test('should retry when clarity check fails', async () => {
        smartLessonGenerator.gate.checkRelevance
            .mockRejectedValueOnce({ name: 'LowConfidenceError' })
            .mockResolvedValueOnce({ isRelevant: true });

        await smartLessonGenerator.generateWithAutonomy({ topic: 'Unknown' });

        // queryExpander called?
        // We mocked queryExpander object.
        // But smartLessonGenerator imports it.
        // jest.mock above should handle it.
        // Let's verify import usage.

        expect(contentRetriever.retrieve).toHaveBeenCalledTimes(2);
    });

    test('should proceed after max retries', async () => {
        smartLessonGenerator.gate.checkRelevance.mockRejectedValue({ name: 'LowConfidenceError' });

        await smartLessonGenerator.generateWithAutonomy({ topic: 'Impossible' });

        expect(smartLessonGenerator.gate.checkRelevance).toHaveBeenCalledTimes(2);
    });
});
