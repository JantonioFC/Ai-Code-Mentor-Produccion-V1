/**
 * Factory de Prompts Dinámicos por Fase
 * Construye prompts personalizados según la fase del estudiante
 * Soporta múltiples dominios: programming, logic, databases, math
 * 
 * @module lib/prompts/factory/PromptFactory
 */

import fs from 'fs';
import path from 'path';

const TEMPLATES_DIR = path.join(process.cwd(), 'lib', 'prompts', 'templates');
const CONSTRAINTS_PATH = path.join(process.cwd(), 'lib', 'prompts', 'constraints', 'by-phase.json');
const DOMAINS_DIR = path.join(process.cwd(), 'lib', 'prompts', 'domains');

/**
 * Factory para construir prompts personalizados
 */
export class PromptFactory {
    constructor() {
        this.templatesCache = new Map();
        this.constraintsCache = null;
        this.domainCache = new Map();
    }

    /**
     * Construir prompt completo para una consulta
     * @param {Object} context - Contexto de la consulta
     * @returns {Object} - Prompts del sistema y usuario
     */
    buildPrompt(context) {
        const { phase, language, analysisType, code, domain = 'programming' } = context;

        const template = this.loadTemplate(phase);

        // Cargar constraints según dominio
        const constraints = domain === 'programming'
            ? this.loadConstraints(phase)
            : this.loadDomainConstraints(domain, phase);

        // Para dominios no-programming, cargar también el system prompt del dominio
        let domainContext = '';
        if (domain !== 'programming') {
            const domainConfig = this.loadDomainConfig(domain);
            if (domainConfig?.systemPrompt) {
                domainContext = `\n\n${domainConfig.systemPrompt}`;
            }
        }

        const systemPrompt = this.interpolate(template, {
            language: this.getLanguageName(language),
            phase: phase,
            analysisType: analysisType || 'general'
        }) + domainContext;

        const userPrompt = this.buildUserPrompt(code, language, constraints);

        return {
            system: systemPrompt,
            user: userPrompt,
            constraints: constraints,
            domain: domain
        };
    }

    /**
     * Cargar template de prompt desde archivo
     * @param {string} phase - Fase del estudiante
     * @returns {string} - Contenido del template
     */
    loadTemplate(phase) {
        if (this.templatesCache.has(phase)) {
            return this.templatesCache.get(phase);
        }

        const templatePath = path.join(TEMPLATES_DIR, `${phase}.md`);

        try {
            if (typeof window === 'undefined' && fs.existsSync(templatePath)) {
                const template = fs.readFileSync(templatePath, 'utf-8');
                this.templatesCache.set(phase, template);
                return template;
            }
        } catch (error) {
            console.warn(`[PromptFactory] Template ${phase} no encontrado, usando default`);
        }

        // Template por defecto
        return this.getDefaultTemplate(phase);
    }

    /**
     * Obtener template por defecto
     * @param {string} phase - Fase
     * @returns {string}
     */
    getDefaultTemplate(phase) {
        const templates = {
            'fase-0': `Eres un tutor muy paciente que enseña programación a principiantes completos.

Tu objetivo es ayudar al estudiante a comprender conceptos básicos sin abrumarlo.

**DEBES:**
- Usar lenguaje muy simple y ejemplos visuales
- Celebrar cada pequeño logro
- Explicar paso a paso

**NO DEBES:**
- Usar jerga técnica sin explicarla
- Asumir conocimientos previos
- Sugerir conceptos avanzados (async, classes, POO)

El estudiante está trabajando con **{{language}}** en la **{{phase}}**.`,

            'fase-1': `Eres un asistente educativo que guía en fundamentos de programación.

**DEBES:**
- Enfocarte en buenas prácticas de código limpio
- Introducir debugging strategies
- Explicar el razonamiento detrás de las sugerencias

**NO DEBES:**
- Dar soluciones completas directamente
- Sugerir optimizaciones prematuras

El estudiante está trabajando con **{{language}}** en la **{{phase}}**.`,

            'fase-5': `Eres un mentor senior que ayuda con arquitectura y diseño avanzado.

**DEBES:**
- Hacer code review de nivel profesional
- Sugerir patrones de diseño cuando sean apropiados
- Considerar performance y mantenibilidad

El estudiante está trabajando con **{{language}}** en la **{{phase}}**.`
        };

        return templates[phase] || templates['fase-1'];
    }

    /**
     * Cargar constraints desde archivo JSON
     * @param {string} phase - Fase
     * @returns {Object}
     */
    loadConstraints(phase) {
        if (!this.constraintsCache) {
            try {
                if (typeof window === 'undefined' && fs.existsSync(CONSTRAINTS_PATH)) {
                    const content = fs.readFileSync(CONSTRAINTS_PATH, 'utf-8');
                    this.constraintsCache = JSON.parse(content);
                }
            } catch (error) {
                console.warn('[PromptFactory] Constraints no encontrados, usando defaults');
            }

            if (!this.constraintsCache) {
                this.constraintsCache = this.getDefaultConstraints();
            }
        }

        return this.constraintsCache[phase] || this.constraintsCache['default'];
    }

    /**
     * Cargar constraints específicos de un dominio
     * @param {string} domain - Dominio (logic, databases, math)
     * @param {string} phase - Fase del estudiante (beginner, intermediate, advanced)
     * @returns {Object}
     */
    loadDomainConstraints(domain, phase) {
        const cacheKey = `${domain}-constraints`;

        if (this.domainCache.has(cacheKey)) {
            const domainConstraints = this.domainCache.get(cacheKey);
            return this.mapPhaseToLevel(domainConstraints, phase);
        }

        const constraintsPath = path.join(DOMAINS_DIR, domain, 'constraints.json');

        try {
            if (typeof window === 'undefined' && fs.existsSync(constraintsPath)) {
                const content = fs.readFileSync(constraintsPath, 'utf-8');
                const domainConstraints = JSON.parse(content);
                this.domainCache.set(cacheKey, domainConstraints);
                return this.mapPhaseToLevel(domainConstraints, phase);
            }
        } catch (error) {
            console.warn(`[PromptFactory] Domain constraints ${domain} no encontrados`);
        }

        return this.getDefaultConstraints()['default'];
    }

    /**
     * Mapear fase de programación a nivel de dominio
     * @param {Object} domainConstraints - Constraints del dominio
     * @param {string} phase - Fase (fase-0 a fase-7)
     * @returns {Object}
     */
    mapPhaseToLevel(domainConstraints, phase) {
        // Mapear fases del currículo a niveles del dominio
        const phaseNum = parseInt(phase?.replace('fase-', '') || '0');
        let level;

        if (phaseNum <= 2) {
            level = 'beginner';
        } else if (phaseNum <= 5) {
            level = 'intermediate';
        } else {
            level = 'advanced';
        }

        return domainConstraints.constraints?.[level] || domainConstraints.constraints?.beginner || {};
    }

    /**
     * Cargar configuración base de un dominio
     * @param {string} domain - Dominio (logic, databases, math)
     * @returns {Object}
     */
    loadDomainConfig(domain) {
        const cacheKey = `${domain}-base`;

        if (this.domainCache.has(cacheKey)) {
            return this.domainCache.get(cacheKey);
        }

        const basePath = path.join(DOMAINS_DIR, domain, 'base.json');

        try {
            if (typeof window === 'undefined' && fs.existsSync(basePath)) {
                const content = fs.readFileSync(basePath, 'utf-8');
                const domainConfig = JSON.parse(content);
                this.domainCache.set(cacheKey, domainConfig);
                return domainConfig;
            }
        } catch (error) {
            console.warn(`[PromptFactory] Domain config ${domain} no encontrado`);
        }

        return null;
    }

    /**
     * Constraints por defecto
     * @returns {Object}
     */
    getDefaultConstraints() {
        return {
            'fase-0': {
                maxComplexitySuggestions: 1,
                avoidConcepts: ['async', 'promises', 'classes', 'OOP'],
                encourageConcepts: ['variables', 'functions', 'loops', 'conditionals'],
                responseFormat: {
                    feedback: 'string',
                    strengths: ['string'],
                    improvements: ['string'],
                    nextSteps: ['string']
                }
            },
            'fase-1': {
                maxComplexitySuggestions: 2,
                avoidConcepts: ['design patterns', 'architecture'],
                encourageConcepts: ['functions', 'arrays', 'objects', 'basic algorithms'],
                responseFormat: {
                    feedback: 'string',
                    strengths: ['string'],
                    improvements: ['string'],
                    examples: ['string'],
                    score: 'number'
                }
            },
            'fase-5': {
                maxComplexitySuggestions: 5,
                avoidConcepts: [],
                encourageConcepts: ['architecture', 'design patterns', 'testing', 'scalability'],
                responseFormat: {
                    feedback: 'string',
                    strengths: ['string'],
                    improvements: ['string'],
                    examples: ['string'],
                    score: 'number',
                    architecturalNotes: 'string'
                }
            },
            'default': {
                maxComplexitySuggestions: 3,
                avoidConcepts: [],
                encourageConcepts: ['clean code', 'best practices'],
                responseFormat: {
                    feedback: 'string',
                    strengths: ['string'],
                    improvements: ['string']
                }
            }
        };
    }

    /**
     * Interpolar variables en template
     * @param {string} template - Template con placeholders
     * @param {Object} variables - Variables a interpolar
     * @returns {string}
     */
    interpolate(template, variables) {
        let result = template;

        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            result = result.replace(regex, value);
        }

        return result;
    }

    /**
     * Construir prompt de usuario con código
     * @param {string} code - Código a analizar
     * @param {string} language - Lenguaje
     * @param {Object} constraints - Restricciones
     * @returns {string}
     */
    buildUserPrompt(code, language, constraints) {
        const parts = [
            `Analiza el siguiente código ${this.getLanguageName(language)}:`,
            '',
            '```' + (language || 'javascript'),
            code,
            '```',
            ''
        ];

        if (constraints.avoidConcepts?.length > 0) {
            parts.push(`**Conceptos a evitar:** ${constraints.avoidConcepts.join(', ')}`);
        }

        if (constraints.encourageConcepts?.length > 0) {
            parts.push(`**Conceptos a enfatizar:** ${constraints.encourageConcepts.join(', ')}`);
        }

        parts.push('');
        parts.push('Responde en formato JSON con esta estructura:');
        parts.push(JSON.stringify(constraints.responseFormat, null, 2));

        return parts.join('\n');
    }

    /**
     * Obtener nombre legible del lenguaje
     * @param {string} code - Código del lenguaje
     * @returns {string}
     */
    getLanguageName(code) {
        const names = {
            'js': 'JavaScript',
            'javascript': 'JavaScript',
            'py': 'Python',
            'python': 'Python',
            'java': 'Java',
            'cpp': 'C++',
            'c': 'C',
            'ts': 'TypeScript',
            'typescript': 'TypeScript'
        };
        return names[code?.toLowerCase()] || code || 'JavaScript';
    }

    /**
     * Limpiar cache de templates y dominios
     */
    clearCache() {
        this.templatesCache.clear();
        this.constraintsCache = null;
        this.domainCache.clear();
        console.log('[PromptFactory] Cache limpiado (templates, constraints, domains)');
    }
}

// Exportar instancia singleton
export const promptFactory = new PromptFactory();
