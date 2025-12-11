/**
 * Interfaz base para Plugins - Sistema de Extensiones
 * Define el contrato que todos los plugins deben implementar
 * 
 * @module lib/plugins/interfaces/IPlugin
 * @see COMPLEMENTO_ROADMAP.md - Fase 3: Sistema de Plugins
 */

/**
 * Interfaz base para plugins
 * @interface IPlugin
 * @description Define los métodos y propiedades requeridos para un plugin
 */
export const IPlugin = {
    /**
     * Nombre único del plugin
     * @type {string}
     */
    name: '',

    /**
     * Versión del plugin (semver)
     * @type {string}
     */
    version: '1.0.0',

    /**
     * Descripción del propósito del plugin
     * @type {string}
     */
    description: '',

    /**
     * Dominio al que aplica el plugin (optional)
     * @type {string|null}
     */
    domain: null,

    /**
     * Dependencias de otros plugins (nombres)
     * @type {string[]}
     */
    dependencies: [],

    /**
     * Inicializar el plugin
     * Llamado cuando el plugin es registrado en el PluginManager
     * @async
     * @param {Object} context - Contexto de la aplicación
     * @returns {Promise<boolean>} - True si inicialización exitosa
     */
    initialize: async (context) => {
        console.log(`[${this.name}] Plugin initialized`);
        return true;
    },

    /**
     * Analizar código según la lógica del plugin
     * @async
     * @param {string} code - Código a analizar
     * @param {Object} context - Contexto del análisis (fase, dominio, etc)
     * @returns {Promise<Object>} - Resultado del análisis
     */
    analyze: async (code, context) => {
        return {
            pluginName: this.name,
            result: null
        };
    },

    /**
     * Pre-procesar antes del análisis principal
     * Útil para transformaciones o validaciones
     * @param {string} code - Código original
     * @param {Object} context - Contexto
     * @returns {Object} - { code: string, context: Object }
     */
    preProcess: (code, context) => {
        return { code, context };
    },

    /**
     * Post-procesar después del análisis principal
     * Útil para enriquecimiento de resultados
     * @param {Object} result - Resultado del análisis
     * @param {Object} context - Contexto
     * @returns {Object} - Resultado enriquecido
     */
    postProcess: (result, context) => {
        return result;
    },

    /**
     * Renderizar componente UI del plugin (opcional)
     * Para plugins que agregan elementos visuales
     * @param {Object} props - Props de React
     * @returns {React.ReactElement|null}
     */
    render: (props) => null,

    /**
     * Obtener configuración del plugin
     * @returns {Object} - Configuración actual
     */
    getConfig: () => ({}),

    /**
     * Actualizar configuración del plugin
     * @param {Object} config - Nueva configuración
     */
    setConfig: (config) => { },

    /**
     * Destruir el plugin y liberar recursos
     * Llamado cuando el plugin es desregistrado
     * @returns {void}
     */
    destroy: () => {
        console.log(`[${this.name}] Plugin destroyed`);
    }
};

/**
 * Crear una implementación de plugin a partir de opciones
 * Factory helper para crear plugins consistentes
 * 
 * @param {Object} options - Opciones del plugin
 * @param {string} options.name - Nombre único
 * @param {string} options.version - Versión
 * @param {string} options.description - Descripción
 * @param {Function} options.analyze - Función de análisis
 * @returns {Object} - Instancia del plugin
 */
export function createPlugin(options) {
    return {
        ...IPlugin,
        ...options,
        initialize: options.initialize || IPlugin.initialize,
        analyze: options.analyze || IPlugin.analyze,
        destroy: options.destroy || IPlugin.destroy
    };
}

/**
 * Validar que un objeto implementa la interfaz IPlugin
 * @param {Object} plugin - Objeto a validar
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePlugin(plugin) {
    const errors = [];

    if (!plugin.name || typeof plugin.name !== 'string') {
        errors.push('Plugin debe tener un nombre (string)');
    }

    if (!plugin.version || typeof plugin.version !== 'string') {
        errors.push('Plugin debe tener una versión (string)');
    }

    if (typeof plugin.initialize !== 'function') {
        errors.push('Plugin debe implementar initialize()');
    }

    if (typeof plugin.analyze !== 'function') {
        errors.push('Plugin debe implementar analyze()');
    }

    if (typeof plugin.destroy !== 'function') {
        errors.push('Plugin debe implementar destroy()');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

export default IPlugin;
