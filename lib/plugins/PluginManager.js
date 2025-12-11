/**
 * Plugin Manager - Gestión Central de Plugins
 * Responsable del ciclo de vida, registro y ejecución de plugins
 * 
 * @module lib/plugins/PluginManager
 * @see COMPLEMENTO_ROADMAP.md - Fase 3: Sistema de Plugins
 */

import { validatePlugin } from './interfaces/IPlugin';

/**
 * Gestor central de plugins
 * Singleton que maneja el registro, inicialización y ejecución de plugins
 */
export class PluginManager {
    constructor() {
        /** @type {Map<string, Object>} */
        this.plugins = new Map();

        /** @type {Map<string, string[]>} - Dominio -> Lista de nombres de plugins */
        this.domainPlugins = new Map();

        /** @type {boolean} */
        this.initialized = false;

        /** @type {Object} - Contexto compartido entre plugins */
        this.context = {};
    }

    /**
     * Registrar un nuevo plugin
     * @param {Object} plugin - Plugin a registrar (debe implementar IPlugin)
     * @returns {{ success: boolean, error?: string }}
     */
    register(plugin) {
        // Validar que el plugin cumple la interfaz
        const validation = validatePlugin(plugin);
        if (!validation.valid) {
            console.error(`[PluginManager] Plugin inválido:`, validation.errors);
            return {
                success: false,
                error: `Plugin inválido: ${validation.errors.join(', ')}`
            };
        }

        // Verificar que no exista ya
        if (this.plugins.has(plugin.name)) {
            console.warn(`[PluginManager] Plugin '${plugin.name}' ya registrado, sobrescribiendo...`);
            this.unregister(plugin.name);
        }

        // Verificar dependencias
        for (const dep of plugin.dependencies || []) {
            if (!this.plugins.has(dep)) {
                return {
                    success: false,
                    error: `Dependencia no satisfecha: ${dep}`
                };
            }
        }

        // Registrar el plugin
        this.plugins.set(plugin.name, plugin);

        // Registrar en índice de dominio si aplica
        if (plugin.domain) {
            if (!this.domainPlugins.has(plugin.domain)) {
                this.domainPlugins.set(plugin.domain, []);
            }
            this.domainPlugins.get(plugin.domain).push(plugin.name);
        }

        console.log(`[PluginManager] Plugin '${plugin.name}' v${plugin.version} registrado`);

        return { success: true };
    }

    /**
     * Desregistrar un plugin por nombre
     * @param {string} name - Nombre del plugin a desregistrar
     * @returns {boolean} - True si fue desregistrado
     */
    unregister(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            console.warn(`[PluginManager] Plugin '${name}' no encontrado`);
            return false;
        }

        // Verificar que ningún otro plugin depende de este
        for (const [otherName, otherPlugin] of this.plugins) {
            if (otherPlugin.dependencies?.includes(name)) {
                console.error(`[PluginManager] No se puede desregistrar '${name}', '${otherName}' depende de él`);
                return false;
            }
        }

        // Destruir el plugin
        try {
            plugin.destroy();
        } catch (error) {
            console.error(`[PluginManager] Error destruyendo '${name}':`, error);
        }

        // Remover del índice de dominio
        if (plugin.domain && this.domainPlugins.has(plugin.domain)) {
            const domainList = this.domainPlugins.get(plugin.domain);
            const index = domainList.indexOf(name);
            if (index > -1) {
                domainList.splice(index, 1);
            }
        }

        this.plugins.delete(name);
        console.log(`[PluginManager] Plugin '${name}' desregistrado`);

        return true;
    }

    /**
     * Obtener un plugin por nombre
     * @param {string} name - Nombre del plugin
     * @returns {Object|null}
     */
    get(name) {
        return this.plugins.get(name) || null;
    }

    /**
     * Obtener todos los plugins registrados
     * @returns {Object[]}
     */
    getAll() {
        return Array.from(this.plugins.values());
    }

    /**
     * Obtener plugins por dominio
     * @param {string} domain - Dominio (logic, databases, math, programming)
     * @returns {Object[]}
     */
    getByDomain(domain) {
        const pluginNames = this.domainPlugins.get(domain) || [];
        return pluginNames.map(name => this.plugins.get(name)).filter(Boolean);
    }

    /**
     * Inicializar todos los plugins registrados
     * @param {Object} context - Contexto de la aplicación
     * @returns {Promise<{ initialized: string[], failed: string[] }>}
     */
    async initializeAll(context = {}) {
        this.context = context;
        const initialized = [];
        const failed = [];

        // Ordenar por dependencias (topological sort simplificado)
        const sortedPlugins = this._sortByDependencies();

        for (const plugin of sortedPlugins) {
            try {
                const success = await plugin.initialize(this.context);
                if (success) {
                    initialized.push(plugin.name);
                } else {
                    failed.push(plugin.name);
                }
            } catch (error) {
                console.error(`[PluginManager] Error inicializando '${plugin.name}':`, error);
                failed.push(plugin.name);
            }
        }

        this.initialized = true;
        console.log(`[PluginManager] Inicialización completa: ${initialized.length} OK, ${failed.length} fallidos`);

        return { initialized, failed };
    }

    /**
     * Ejecutar un método en todos los plugins
     * @param {string} method - Nombre del método a ejecutar
     * @param {...any} args - Argumentos para el método
     * @returns {Promise<Map<string, any>>} - Resultados por nombre de plugin
     */
    async executeAll(method, ...args) {
        const results = new Map();

        for (const [name, plugin] of this.plugins) {
            if (typeof plugin[method] === 'function') {
                try {
                    const result = await plugin[method](...args);
                    results.set(name, result);
                } catch (error) {
                    console.error(`[PluginManager] Error ejecutando ${method} en '${name}':`, error);
                    results.set(name, { error: error.message });
                }
            }
        }

        return results;
    }

    /**
     * Ejecutar pipeline de análisis con todos los plugins
     * @param {string} code - Código a analizar
     * @param {Object} context - Contexto del análisis
     * @returns {Promise<Object>}
     */
    async analyze(code, context) {
        let processedCode = code;
        let processedContext = { ...context };

        // Pre-procesamiento
        for (const plugin of this.plugins.values()) {
            if (typeof plugin.preProcess === 'function') {
                const result = plugin.preProcess(processedCode, processedContext);
                processedCode = result.code || processedCode;
                processedContext = result.context || processedContext;
            }
        }

        // Análisis principal
        const analyses = new Map();
        const relevantPlugins = context.domain
            ? this.getByDomain(context.domain)
            : this.getAll();

        for (const plugin of relevantPlugins) {
            if (typeof plugin.analyze === 'function') {
                try {
                    const result = await plugin.analyze(processedCode, processedContext);
                    analyses.set(plugin.name, result);
                } catch (error) {
                    console.error(`[PluginManager] Error en análisis de '${plugin.name}':`, error);
                }
            }
        }

        // Post-procesamiento
        let combinedResult = {
            code: processedCode,
            context: processedContext,
            pluginResults: Object.fromEntries(analyses)
        };

        for (const plugin of this.plugins.values()) {
            if (typeof plugin.postProcess === 'function') {
                combinedResult = plugin.postProcess(combinedResult, processedContext);
            }
        }

        return combinedResult;
    }

    /**
     * Ordenar plugins por dependencias (topological sort)
     * @private
     * @returns {Object[]}
     */
    _sortByDependencies() {
        const sorted = [];
        const visited = new Set();
        const visiting = new Set();

        const visit = (plugin) => {
            if (visited.has(plugin.name)) return;
            if (visiting.has(plugin.name)) {
                throw new Error(`Dependencia circular detectada: ${plugin.name}`);
            }

            visiting.add(plugin.name);

            for (const depName of plugin.dependencies || []) {
                const dep = this.plugins.get(depName);
                if (dep) visit(dep);
            }

            visiting.delete(plugin.name);
            visited.add(plugin.name);
            sorted.push(plugin);
        };

        for (const plugin of this.plugins.values()) {
            visit(plugin);
        }

        return sorted;
    }

    /**
     * Destruir todos los plugins y limpiar el manager
     */
    destroyAll() {
        for (const [name, plugin] of this.plugins) {
            try {
                plugin.destroy();
            } catch (error) {
                console.error(`[PluginManager] Error destruyendo '${name}':`, error);
            }
        }

        this.plugins.clear();
        this.domainPlugins.clear();
        this.initialized = false;
        console.log('[PluginManager] Todos los plugins destruidos');
    }

    /**
     * Obtener estadísticas del manager
     * @returns {Object}
     */
    getStats() {
        return {
            totalPlugins: this.plugins.size,
            initialized: this.initialized,
            pluginsByDomain: Object.fromEntries(
                Array.from(this.domainPlugins).map(([domain, plugins]) => [domain, plugins.length])
            ),
            plugins: Array.from(this.plugins.values()).map(p => ({
                name: p.name,
                version: p.version,
                domain: p.domain
            }))
        };
    }
}

// Exportar instancia singleton
export const pluginManager = new PluginManager();

export default PluginManager;
