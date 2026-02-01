const { clarityGate } = require('../ai/ClarityGate'); // Need to export instance or new it
const { ClarityGate } = require('../ai/ClarityGate');
const { queryExpander } = require('../rag/QueryExpander');
const { contentRetriever } = require('../rag/ContentRetriever'); // Assuming singleton export
const { lessonService } = require('./LessonService');
const { logger } = require('../utils/logger');

class SmartLessonGenerator {
    constructor() {
        this.gate = new ClarityGate();
        this.maxRetries = 2;
    }

    /**
     * Agentic Flow:
     * 1. Initial Retrieval
     * 2. Clarity Check
     * 3. (Optional) Expansion & Retry
     * 4. Generation
     */
    async generateWithAutonomy(params) {
        let retrievalContext = await this._retrieve(params.topic);
        let retries = 0;
        let clarityPass = false;

        // --- Clarity Assurance Loop ---
        while (retries < this.maxRetries && !clarityPass) {
            try {
                // Check if context is good enough
                await this.gate.checkRelevance(params.topic, retrievalContext);
                clarityPass = true;
                logger.info(`[SmartGen] Clarity Check Passed (Attempt ${retries + 1})`);
            } catch (error) {
                if (error.name === 'LowConfidenceError') {
                    logger.warn(`[SmartGen] Clarity Check Failed: ${error.message}. Retrying...`);

                    // Autonomous Action: Expand Query
                    const expandedQueries = await queryExpander.expand(params.topic, { useLLM: true });
                    const additionalContext = await Promise.all(
                        expandedQueries.map(q => this._retrieve(q))
                    );

                    // Merge contexts (deduplication simplified here)
                    retrievalContext = [...retrievalContext, ...additionalContext.flat()];
                    retries++;
                } else {
                    throw error;
                }
            }
        }

        if (!clarityPass) {
            logger.warn('[SmartGen] Max retries reached. Proceeding with best available context.');
        }

        // --- Generation Phase ---
        // Inject validated context into params for the base service
        // (Assuming LessonService can accept pre-defined context, or we modify it)
        // For now, we simulate passing it or assume LessonService does its own retrieval if not provided.
        // If LessonService fetches its own context, this "Gate" is bypassed unless we inject it.
        // Ideally LessonService should accept `context` override.

        return lessonService.generateLesson({
            ...params,
            injectedContext: retrievalContext
        });
    }

    async _retrieve(query) {
        // Wrapper for ContentRetriever
        try {
            // return contentRetriever.retrieve(query);
            // Mocking if module not fully ready, but typically:
            if (contentRetriever && typeof contentRetriever.retrieve === 'function') {
                return await contentRetriever.retrieve(query);
            }
            return []; // Fallback
        } catch (e) {
            logger.error(`[SmartGen] Retrieval error: ${e.message}`);
            return [];
        }
    }
}

module.exports = { SmartLessonGenerator, smartLessonGenerator: new SmartLessonGenerator() };
