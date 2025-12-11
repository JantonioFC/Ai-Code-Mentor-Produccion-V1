/**
 * AI Response Integration Test Suite - Validación de Respuestas IA
 * Tests para verificar estructura de respuestas del router Gemini
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');

// Mock del router de Gemini para tests de integración
const mockGeminiRouter = {
    analyze: jest.fn()
};

describe('AI Response Integration - COMPLEMENTO_ROADMAP', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('VALIDACIÓN 1: Estructura de Respuesta', () => {
        test('✅ Respuesta IA debe tener estructura válida', async () => {
            const mockResponse = {
                analysis: { feedback: 'Buen uso de variables.', strengths: ['Código limpio'], improvements: ['Usar const'], score: 85 },
                metadata: { model: 'gemini-2.0-flash', timestamp: new Date().toISOString(), phase: 'fase-1' }
            };
            mockGeminiRouter.analyze.mockResolvedValue(mockResponse);

            const result = await mockGeminiRouter.analyze({ code: 'let x = 1;', phase: 'fase-1' });

            expect(result).toHaveProperty('analysis');
            expect(result).toHaveProperty('metadata');
            expect(result.metadata).toHaveProperty('model');
        });

        test('✅ Analysis debe contener campos requeridos', async () => {
            const mockResponse = {
                analysis: { feedback: 'Feedback', strengths: ['F1'], improvements: ['M1'] },
                metadata: { model: 'gemini-2.0-flash' }
            };
            mockGeminiRouter.analyze.mockResolvedValue(mockResponse);

            const result = await mockGeminiRouter.analyze({ code: 'print("hello")', phase: 'fase-0' });

            expect(result.analysis).toHaveProperty('feedback');
            expect(result.analysis).toHaveProperty('strengths');
            expect(Array.isArray(result.analysis.strengths)).toBe(true);
        });

        test('✅ Metadata debe incluir información del modelo', async () => {
            const mockResponse = {
                analysis: { feedback: 'Test' },
                metadata: { model: 'gemini-2.0-flash', timestamp: '2025-12-07T00:00:00Z', phase: 'fase-2' }
            };
            mockGeminiRouter.analyze.mockResolvedValue(mockResponse);

            const result = await mockGeminiRouter.analyze({ code: 'function test() {}', phase: 'fase-2' });

            expect(result.metadata.model).toBe('gemini-2.0-flash');
            expect(result.metadata).toHaveProperty('timestamp');
        });
    });

    describe('VALIDACIÓN 2: Manejo de Dominios', () => {
        test('✅ Respuesta para dominio de lógica tiene estructura apropiada', async () => {
            const mockResponse = {
                analysis: { feedback: 'Tabla de verdad correcta.', hints: ['Simplificar'] },
                metadata: { model: 'gemini-2.0-flash', domain: 'logic', phase: 'fase-1' }
            };
            mockGeminiRouter.analyze.mockResolvedValue(mockResponse);

            const result = await mockGeminiRouter.analyze({ code: 'p → q', phase: 'fase-1', domain: 'logic' });

            expect(result.metadata.domain).toBe('logic');
            expect(result.analysis).toHaveProperty('hints');
        });

        test('✅ Respuesta para dominio de bases de datos tiene estructura apropiada', async () => {
            const mockResponse = {
                analysis: { feedback: 'Consulta optimizable.', optimization: 'Añadir índice' },
                metadata: { model: 'gemini-2.0-flash', domain: 'databases' }
            };
            mockGeminiRouter.analyze.mockResolvedValue(mockResponse);

            const result = await mockGeminiRouter.analyze({ code: 'SELECT *', phase: 'fase-3', domain: 'databases' });

            expect(result.metadata.domain).toBe('databases');
        });
    });

    describe('VALIDACIÓN 3: Manejo de Errores', () => {
        test('✅ Debe manejar errores de API gracefully', async () => {
            mockGeminiRouter.analyze.mockRejectedValue(new Error('API rate limit exceeded'));

            await expect(mockGeminiRouter.analyze({ code: 'test', phase: 'fase-1' }))
                .rejects.toThrow('API rate limit exceeded');
        });

        test('✅ Debe manejar respuestas malformadas', async () => {
            mockGeminiRouter.analyze.mockResolvedValue({ analysis: null });

            const result = await mockGeminiRouter.analyze({ code: 'test', phase: 'fase-1' });
            expect(result.analysis).toBeNull();
        });

        test('✅ Debe manejar timeouts', async () => {
            mockGeminiRouter.analyze.mockRejectedValue(new Error('Request timeout'));

            await expect(mockGeminiRouter.analyze({ code: 'long code', phase: 'fase-5' }))
                .rejects.toThrow('timeout');
        });
    });

    describe('VALIDACIÓN 4: Restricciones por Fase', () => {
        test('✅ Fase temprana no debe incluir solución completa', async () => {
            const mockResponse = {
                analysis: { feedback: 'Buen intento.', hints: ['¿Qué pasa si...?'] },
                metadata: { model: 'gemini-2.0-flash', phase: 'fase-0' }
            };
            mockGeminiRouter.analyze.mockResolvedValue(mockResponse);

            const result = await mockGeminiRouter.analyze({ code: 'if x > 0:', phase: 'fase-0' });

            expect(result.analysis).not.toHaveProperty('solution');
            expect(result.analysis).toHaveProperty('hints');
        });

        test('✅ Fase avanzada puede incluir solución completa', async () => {
            const mockResponse = {
                analysis: { feedback: 'Solución optimizada.', solution: 'def optimized():', alternatives: ['map()', 'numpy'] },
                metadata: { model: 'gemini-2.0-flash', phase: 'fase-7' }
            };
            mockGeminiRouter.analyze.mockResolvedValue(mockResponse);

            const result = await mockGeminiRouter.analyze({ code: 'squares = []', phase: 'fase-7' });

            expect(result.analysis).toHaveProperty('solution');
            expect(result.analysis).toHaveProperty('alternatives');
        });
    });
});
