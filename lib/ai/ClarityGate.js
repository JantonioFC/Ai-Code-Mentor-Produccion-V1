const geminiRouter = require('./router/GeminiRouter');
const { logger } = require('../utils/logger'); // Assuming utils/logger exists at lib/utils/logger.js, so from lib/ai it is ../utils/logger

class LowConfidenceError extends Error {
    constructor(message, score) {
        super(message);
        this.name = 'LowConfidenceError';
        this.score = score;
    }
}

class ClarityGate {
    constructor(threshold = 0.7) {
        this.threshold = threshold;
    }

    /**
     * Evaluates if the retrieved context is relevant enough for the query.
     * @param {string} query - The user's intent or topic.
     * @param {string|Array} context - The retrieved snippets.
     * @returns {Promise<boolean>} - True if relevant, throws LowConfidenceError if not.
     */
    async checkRelevance(query, context) {
        const contextStr = Array.isArray(context) ? context.join('\n\n') : context;

        // Skip check if no context (let the generator handle 'no context' scenario, or fail here?)
        // If no context, retrieval failed. That's a different error.
        if (!contextStr || contextStr.length < 10) {
            logger.warn('[ClarityGate] No context provided to evaluate.');
            return true; // Pass through, let generator decide.
        }

        const prompt = `
        Act as an Epistemic Judge for an Educational AI.
        
        **QUERY:** "${query}"
        
        **RETRIEVED CONTEXT:**
        """
        ${contextStr.substring(0, 3000)} ... (truncated)
        """
        
        **TASK:**
        Evaluate if the RETRIEVED CONTEXT contains sufficient information to answer the QUERY or generate a valid lesson about it.
        Return a JSON with:
        - "relevance_score": number between 0.0 and 1.0 (1.0 = perfect match, 0.0 = completely irrelevant)
        - "reasoning": short explanation
        
        **CRITERIA:**
        - High score (>0.7): Context directly addresses the topic.
        - Low score (<0.5): Context talks about something else.
        
        **RESPONSE (JSON ONLY):**
        `;

        try {
            const response = await geminiRouter.analyze({
                prompt,
                responseType: 'json',
                temperature: 0.1 // Low temp for rigorous evaluation
            });

            const result = this._parseResponse(response);

            logger.info(`[ClarityGate] Relevance Score: ${result.relevance_score} | ${result.reasoning}`);

            if (result.relevance_score < this.threshold) {
                throw new LowConfidenceError(
                    `Context relevance (${result.relevance_score}) below threshold (${this.threshold}). Reasoning: ${result.reasoning}`,
                    result.relevance_score
                );
            }

            return true;

        } catch (error) {
            if (error instanceof LowConfidenceError) throw error;

            // If LLM fails, we fail open (log and proceed) to avoid blocking usage due to outage
            logger.error(`[ClarityGate] Evaluation failed: ${error.message}. Proceeding with caution.`);
            return true;
        }
    }

    _parseResponse(response) {
        try {
            if (typeof response === 'object' && response !== null) return response;
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : { relevance_score: 1.0, reasoning: "Parse Error" };
        } catch (e) {
            return { relevance_score: 1.0, reasoning: "Fallback" };
        }
    }
}

module.exports = { ClarityGate, LowConfidenceError };
