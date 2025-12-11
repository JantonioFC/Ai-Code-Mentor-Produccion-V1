/**
 * Auto-Discovery de Modelos Google AI
 * Detecta automáticamente modelos disponibles via API
 * 
 * @module lib/ai/discovery/ModelDiscovery
 */

import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'lib', 'ai', 'config', 'models.json');
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Modelos conocidos con sus capacidades
 * Usado como fallback si la API no responde
 */
const KNOWN_MODELS = [
  {
    name: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    description: 'Modelo más capaz para análisis complejos',
    inputTokenLimit: 1048576,
    outputTokenLimit: 8192,
    supportedGenerationMethods: ['generateContent'],
    priority: 1
  },
  {
    name: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    description: 'Modelo rápido y eficiente',
    inputTokenLimit: 1048576,
    outputTokenLimit: 8192,
    supportedGenerationMethods: ['generateContent'],
    priority: 2
  },
  {
    name: 'gemini-2.0-flash-exp',
    displayName: 'Gemini 2.0 Flash (Experimental)',
    description: 'Versión experimental más reciente',
    inputTokenLimit: 1048576,
    outputTokenLimit: 8192,
    supportedGenerationMethods: ['generateContent'],
    priority: 3
  }
];

/**
 * Clase para descubrimiento automático de modelos Google AI
 */
export class ModelDiscovery {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.cache = null;
    this.lastDiscovery = null;
  }

  /**
   * Descubrir modelos disponibles
   * @param {boolean} forceRefresh - Forzar actualización ignorando cache
   * @returns {Promise<Array>} - Lista de modelos disponibles
   */
  async discover(forceRefresh = false) {
    // Verificar cache en memoria
    if (!forceRefresh && this.cache && this.isCacheValid()) {
      console.log('[ModelDiscovery] Usando cache en memoria');
      return this.cache;
    }

    // Verificar cache en archivo
    const fileCache = this.loadFromFile();
    if (!forceRefresh && fileCache && this.isFileCacheValid(fileCache)) {
      console.log('[ModelDiscovery] Usando cache de archivo');
      this.cache = fileCache.models;
      this.lastDiscovery = new Date(fileCache.lastUpdated);
      return this.cache;
    }

    // Descubrir via API
    try {
      const models = await this.fetchFromAPI();
      this.cache = models;
      this.lastDiscovery = new Date();
      this.saveToFile(models);
      console.log(`[ModelDiscovery] Descubiertos ${models.length} modelos via API`);
      return models;
    } catch (error) {
      console.error('[ModelDiscovery] Error consultando API:', error.message);
      // Usar modelos conocidos como fallback
      console.log('[ModelDiscovery] Usando modelos conocidos como fallback');
      return KNOWN_MODELS;
    }
  }

  /**
   * Consultar la API de Google AI para obtener modelos
   * @returns {Promise<Array>} - Modelos desde la API
   */
  async fetchFromAPI() {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY no configurada');
    }

    const url = `${this.baseUrl}/models?key=${this.apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Filtrar solo modelos que soporten generación de contenido
    const generativeModels = (data.models || [])
      .filter(model => 
        model.supportedGenerationMethods?.includes('generateContent') &&
        model.name?.includes('gemini')
      )
      .map((model, index) => ({
        name: model.name?.replace('models/', '') || model.name,
        displayName: model.displayName || model.name,
        description: model.description || '',
        inputTokenLimit: model.inputTokenLimit || 0,
        outputTokenLimit: model.outputTokenLimit || 0,
        supportedGenerationMethods: model.supportedGenerationMethods || [],
        priority: this.calculatePriority(model.name),
        discoveredAt: new Date().toISOString()
      }))
      .sort((a, b) => a.priority - b.priority);

    return generativeModels.length > 0 ? generativeModels : KNOWN_MODELS;
  }

  /**
   * Calcular prioridad del modelo basado en su nombre
   * @param {string} modelName - Nombre del modelo
   * @returns {number} - Prioridad (menor = más preferido)
   */
  calculatePriority(modelName) {
    if (modelName?.includes('1.5-pro')) return 1;
    if (modelName?.includes('1.5-flash')) return 2;
    if (modelName?.includes('2.0')) return 3;
    if (modelName?.includes('pro')) return 4;
    if (modelName?.includes('flash')) return 5;
    return 10;
  }

  /**
   * Verificar si el cache en memoria es válido
   * @returns {boolean}
   */
  isCacheValid() {
    if (!this.lastDiscovery) return false;
    const elapsed = Date.now() - this.lastDiscovery.getTime();
    return elapsed < CACHE_DURATION_MS;
  }

  /**
   * Verificar si el cache de archivo es válido
   * @param {Object} fileCache - Cache cargado del archivo
   * @returns {boolean}
   */
  isFileCacheValid(fileCache) {
    if (!fileCache?.lastUpdated) return false;
    const elapsed = Date.now() - new Date(fileCache.lastUpdated).getTime();
    return elapsed < CACHE_DURATION_MS;
  }

  /**
   * Cargar cache desde archivo
   * @returns {Object|null}
   */
  loadFromFile() {
    if (typeof window !== 'undefined') return null;

    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn('[ModelDiscovery] Error leyendo cache:', error.message);
    }
    return null;
  }

  /**
   * Guardar cache a archivo
   * @param {Array} models - Modelos a guardar
   */
  saveToFile(models) {
    if (typeof window !== 'undefined') return;

    try {
      const dir = path.dirname(CONFIG_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = {
        lastUpdated: new Date().toISOString(),
        models: models,
        cacheValidUntil: new Date(Date.now() + CACHE_DURATION_MS).toISOString()
      };

      fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
      console.log(`[ModelDiscovery] Cache guardado en ${CONFIG_PATH}`);
    } catch (error) {
      console.error('[ModelDiscovery] Error guardando cache:', error.message);
    }
  }

  /**
   * Obtener el modelo primario (mayor prioridad)
   * @returns {Promise<Object|null>}
   */
  async getPrimaryModel() {
    const models = await this.discover();
    return models.length > 0 ? models[0] : null;
  }

  /**
   * Obtener modelo de fallback
   * @param {string} excludeModel - Modelo a excluir
   * @returns {Promise<Object|null>}
   */
  async getFallbackModel(excludeModel) {
    const models = await this.discover();
    return models.find(m => m.name !== excludeModel) || null;
  }

  /**
   * Verificar si un modelo específico está disponible
   * @param {string} modelName - Nombre del modelo
   * @returns {Promise<boolean>}
   */
  async isModelAvailable(modelName) {
    const models = await this.discover();
    return models.some(m => m.name === modelName || m.name.includes(modelName));
  }

  /**
   * Forzar actualización del cache
   * @returns {Promise<Array>}
   */
  async refresh() {
    return this.discover(true);
  }
}

// Exportar instancia singleton
export const modelDiscovery = new ModelDiscovery();
