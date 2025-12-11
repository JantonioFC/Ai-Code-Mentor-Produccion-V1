/**
 * Storage Manager - Persistencia Local con IndexedDB
 * Almacena historial de análisis y borradores auto-guardados
 * 
 * @module lib/storage/StorageManager
 */

const DB_NAME = 'ai-code-mentor';
const DB_VERSION = 1;

/**
 * Stores disponibles en la base de datos
 */
const STORES = {
    ANALYSES: 'analyses',
    DRAFTS: 'drafts',
    PREFERENCES: 'preferences'
};

/**
 * Manager de almacenamiento con IndexedDB
 */
class StorageManager {
    constructor() {
        this.db = null;
        this.isInitialized = false;
    }

    /**
     * Inicializar IndexedDB
     * @returns {Promise<void>}
     */
    async init() {
        if (this.isInitialized) return;

        // Solo ejecutar en cliente
        if (typeof window === 'undefined') {
            console.log('[StorageManager] Server-side, skipping IndexedDB');
            return;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('[StorageManager] Error opening database:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isInitialized = true;
                console.log('[StorageManager] Database initialized');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Store para historial de análisis
                if (!db.objectStoreNames.contains(STORES.ANALYSES)) {
                    const analysisStore = db.createObjectStore(STORES.ANALYSES, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    analysisStore.createIndex('timestamp', 'timestamp', { unique: false });
                    analysisStore.createIndex('language', 'language', { unique: false });
                    analysisStore.createIndex('phase', 'phase', { unique: false });
                }

                // Store para borradores
                if (!db.objectStoreNames.contains(STORES.DRAFTS)) {
                    db.createObjectStore(STORES.DRAFTS, {
                        keyPath: 'id'
                    });
                }

                // Store para preferencias
                if (!db.objectStoreNames.contains(STORES.PREFERENCES)) {
                    db.createObjectStore(STORES.PREFERENCES, {
                        keyPath: 'key'
                    });
                }
            };
        });
    }

    /**
     * Verificar si está inicializado
     * @returns {boolean}
     */
    isReady() {
        return this.isInitialized && this.db !== null;
    }

    // ============================================================================
    // ANÁLISIS
    // ============================================================================

    /**
     * Guardar un análisis en el historial
     * @param {Object} data - Datos del análisis
     * @returns {Promise<number>} - ID del análisis guardado
     */
    async saveAnalysis(data) {
        await this.ensureInitialized();

        const analysis = {
            timestamp: new Date().toISOString(),
            code: data.code,
            codePreview: data.code?.substring(0, 200) || '',
            language: data.language || 'javascript',
            phase: data.phase || 'fase-1',
            result: data.result,
            model: data.model || 'unknown',
            latency: data.latency || 0
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.ANALYSES], 'readwrite');
            const store = transaction.objectStore(STORES.ANALYSES);
            const request = store.add(analysis);

            request.onsuccess = () => {
                console.log('[StorageManager] Analysis saved with ID:', request.result);
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('[StorageManager] Error saving analysis:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Obtener historial de análisis
     * @param {number} limit - Cantidad máxima de resultados
     * @returns {Promise<Array>}
     */
    async getAnalysisHistory(limit = 50) {
        await this.ensureInitialized();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.ANALYSES], 'readonly');
            const store = transaction.objectStore(STORES.ANALYSES);
            const index = store.index('timestamp');
            const request = index.openCursor(null, 'prev');

            const results = [];

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && results.length < limit) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Buscar análisis por filtros
     * @param {Object} filters - Filtros de búsqueda
     * @returns {Promise<Array>}
     */
    async searchAnalyses(filters = {}) {
        const allAnalyses = await this.getAnalysisHistory(500);

        return allAnalyses.filter(analysis => {
            // Filtro por texto
            if (filters.searchTerm) {
                const term = filters.searchTerm.toLowerCase();
                const matchesCode = analysis.code?.toLowerCase().includes(term);
                const matchesFeedback = analysis.result?.analysis?.feedback?.toLowerCase().includes(term);
                if (!matchesCode && !matchesFeedback) return false;
            }

            // Filtro por lenguaje
            if (filters.language && filters.language !== 'all') {
                if (analysis.language !== filters.language) return false;
            }

            // Filtro por fecha
            if (filters.dateRange && filters.dateRange !== 'all') {
                const analysisDate = new Date(analysis.timestamp);
                const now = new Date();

                switch (filters.dateRange) {
                    case 'today':
                        const todayStart = new Date(now.setHours(0, 0, 0, 0));
                        if (analysisDate < todayStart) return false;
                        break;
                    case 'week':
                        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                        if (analysisDate < weekAgo) return false;
                        break;
                    case 'month':
                        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                        if (analysisDate < monthAgo) return false;
                        break;
                }
            }

            return true;
        });
    }

    /**
     * Eliminar análisis antiguo
     * @param {number} daysToKeep - Días a mantener
     * @returns {Promise<number>} - Cantidad eliminada
     */
    async cleanOldAnalyses(daysToKeep = 30) {
        await this.ensureInitialized();

        const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.ANALYSES], 'readwrite');
            const store = transaction.objectStore(STORES.ANALYSES);
            const index = store.index('timestamp');
            const range = IDBKeyRange.upperBound(cutoffDate.toISOString());
            const request = index.openCursor(range);

            let deletedCount = 0;

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    deletedCount++;
                    cursor.continue();
                } else {
                    console.log(`[StorageManager] Cleaned ${deletedCount} old analyses`);
                    resolve(deletedCount);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    // ============================================================================
    // BORRADORES
    // ============================================================================

    /**
     * Guardar borrador de código
     * @param {string} code - Código
     * @param {string} language - Lenguaje
     */
    async saveDraft(code, language = 'javascript') {
        await this.ensureInitialized();

        const draft = {
            id: 'current',
            code,
            language,
            timestamp: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.DRAFTS], 'readwrite');
            const store = transaction.objectStore(STORES.DRAFTS);
            const request = store.put(draft);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Recuperar borrador
     * @returns {Promise<Object|null>}
     */
    async getDraft() {
        await this.ensureInitialized();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.DRAFTS], 'readonly');
            const store = transaction.objectStore(STORES.DRAFTS);
            const request = store.get('current');

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Limpiar borrador
     */
    async clearDraft() {
        await this.ensureInitialized();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.DRAFTS], 'readwrite');
            const store = transaction.objectStore(STORES.DRAFTS);
            const request = store.delete('current');

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // ============================================================================
    // PREFERENCIAS
    // ============================================================================

    /**
     * Guardar preferencia
     * @param {string} key - Clave
     * @param {*} value - Valor
     */
    async setPreference(key, value) {
        await this.ensureInitialized();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.PREFERENCES], 'readwrite');
            const store = transaction.objectStore(STORES.PREFERENCES);
            const request = store.put({ key, value, updatedAt: new Date().toISOString() });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Obtener preferencia
     * @param {string} key - Clave
     * @param {*} defaultValue - Valor por defecto
     * @returns {Promise<*>}
     */
    async getPreference(key, defaultValue = null) {
        await this.ensureInitialized();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.PREFERENCES], 'readonly');
            const store = transaction.objectStore(STORES.PREFERENCES);
            const request = store.get(key);

            request.onsuccess = () => {
                resolve(request.result?.value ?? defaultValue);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ============================================================================
    // UTILIDADES
    // ============================================================================

    /**
     * Asegurar que está inicializado
     */
    async ensureInitialized() {
        if (!this.isReady()) {
            await this.init();
        }
    }

    /**
     * Exportar todos los datos
     * @returns {Promise<Object>}
     */
    async exportAll() {
        const analyses = await this.getAnalysisHistory(1000);
        const draft = await this.getDraft();

        return {
            exportedAt: new Date().toISOString(),
            analyses,
            draft
        };
    }

    /**
     * Limpiar toda la base de datos
     */
    async clearAll() {
        await this.ensureInitialized();

        const stores = [STORES.ANALYSES, STORES.DRAFTS, STORES.PREFERENCES];

        for (const storeName of stores) {
            await new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }

        console.log('[StorageManager] All data cleared');
    }
}

// Exportar instancia singleton
export const storage = new StorageManager();
