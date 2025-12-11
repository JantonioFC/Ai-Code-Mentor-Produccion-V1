/**
 * CURRICULUM SERVICE V5 - ECOSISTEMA 360
 * Servicio centralizado para gestionar datos del currículo oficial
 * Misión 34.0 - Implementación desde cero
 * 
 * Proporciona una capa de abstracción entre el frontend y las APIs del currículo,
 * incluyendo cache inteligente, manejo de errores y transformación de datos.
 */

class CurriculumService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
        this.apiBase = '/api/curriculum';
    }

    /**
     * Obtiene la estructura jerárquica completa del currículo
     */
    async getFullStructure() {
        const cacheKey = 'curriculum-structure';
        
        if (this.hasValidCache(cacheKey)) {
            return this.getFromCache(cacheKey);
        }

        try {
            const response = await fetch(`${this.apiBase}/structure`);
            const result = await this.handleResponse(response);
            
            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            throw new Error(`Error obteniendo estructura del currículo: ${error.message}`);
        }
    }

    /**
     * Obtiene todas las fases con estadísticas
     */
    async getAllPhases() {
        const cacheKey = 'curriculum-phases';
        
        if (this.hasValidCache(cacheKey)) {
            return this.getFromCache(cacheKey);
        }

        try {
            const response = await fetch(`${this.apiBase}/phases`);
            const result = await this.handleResponse(response);
            
            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            throw new Error(`Error obteniendo fases: ${error.message}`);
        }
    }

    /**
     * Obtiene módulos de una fase específica
     */
    async getModulesByPhase(phaseId) {
        if (!phaseId) {
            throw new Error('ID de fase requerido');
        }

        const cacheKey = `modules-${phaseId}`;
        
        if (this.hasValidCache(cacheKey)) {
            return this.getFromCache(cacheKey);
        }

        try {
            const response = await fetch(`${this.apiBase}/modules/${phaseId}`);
            const result = await this.handleResponse(response);
            
            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            throw new Error(`Error obteniendo módulos de la fase: ${error.message}`);
        }
    }

    /**
     * Obtiene semanas de un módulo específico
     */
    async getWeeksByModule(moduleId) {
        if (!moduleId) {
            throw new Error('ID de módulo requerido');
        }

        const cacheKey = `weeks-${moduleId}`;
        
        if (this.hasValidCache(cacheKey)) {
            return this.getFromCache(cacheKey);
        }

        try {
            const response = await fetch(`${this.apiBase}/weeks/${moduleId}`);
            const result = await this.handleResponse(response);
            
            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            throw new Error(`Error obteniendo semanas del módulo: ${error.message}`);
        }
    }

    /**
     * Obtiene progreso del usuario autenticado
     */
    async getUserProgress() {
        // El progreso no se cachea ya que puede cambiar frecuentemente
        try {
            const response = await fetch(`${this.apiBase}/progress`, {
                credentials: 'include' // Incluir cookies de autenticación
            });
            
            if (response.status === 401) {
                throw new Error('Usuario no autenticado');
            }
            
            return await this.handleResponse(response);
        } catch (error) {
            throw new Error(`Error obteniendo progreso del usuario: ${error.message}`);
        }
    }

    /**
     * Actualiza progreso del usuario
     */
    async updateUserProgress(progressData) {
        if (!progressData || !progressData.progress_type) {
            throw new Error('Datos de progreso inválidos');
        }

        try {
            const response = await fetch(`${this.apiBase}/progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(progressData)
            });

            if (response.status === 401) {
                throw new Error('Usuario no autenticado');
            }

            const result = await this.handleResponse(response);
            
            // Invalidar cache relacionado al progreso
            this.invalidateProgressCache();
            
            return result;
        } catch (error) {
            throw new Error(`Error actualizando progreso: ${error.message}`);
        }
    }

    /**
     * Calcula métricas de progreso para el dashboard
     */
    async getDashboardMetrics() {
        try {
            const [phases, userProgress] = await Promise.all([
                this.getAllPhases(),
                this.getUserProgress()
            ]);

            return this.calculateDashboardMetrics(phases.data, userProgress.data);
        } catch (error) {
            // Si hay error obteniendo progreso del usuario, devolver métricas básicas
            if (error.message.includes('no autenticado')) {
                const phases = await this.getAllPhases();
                return this.calculateBasicMetrics(phases.data);
            }
            throw error;
        }
    }

    /**
     * Obtiene recomendación de próxima actividad
     */
    async getNextRecommendation() {
        try {
            const userProgress = await this.getUserProgress();
            const nextRecommended = userProgress.data.next_recommended;
            
            // Si existe recomendación del backend, transformar al formato esperado
            if (nextRecommended && nextRecommended.week_id) {
                return {
                    week: {
                        id: nextRecommended.week_id,
                        title: nextRecommended.week_title || 'Próxima Semana',
                        estimated_hours: nextRecommended.estimated_hours || 20,
                        week_number: nextRecommended.week_number || 1,
                        theme: nextRecommended.theme || 'Desarrollo de competencias'
                    },
                    phase: {
                        title: nextRecommended.phase_title || 'Fase Actual'
                    },
                    module: {
                        title: nextRecommended.module_title || 'Módulo Actual'
                    },
                    current_progress: nextRecommended.current_progress || 0
                };
            }
            
            // Si no hay recomendación específica, devolver null
            return null;
            
        } catch (error) {
            // Si no hay usuario autenticado o hay error, devolver recomendación por defecto
            console.log('Usuario no autenticado o error en recomendación:', error.message);
            return {
                week: {
                    id: 'fase-0-week-1',
                    title: 'Fundamentos de la Interacción con IA',
                    estimated_hours: 20,
                    week_number: 1,
                    theme: 'Cimentación del Arquitecto'
                },
                phase: {
                    title: 'Fase 0: La Cimentación del Arquitecto'
                },
                module: {
                    title: 'Módulo 1: Fundamentos'
                },
                current_progress: 0
            };
        }
    }

    /**
     * Obtiene el Plan de Acción Semanal del usuario
     * Basado en el EST (Esquema Semanal de Trabajo) con Modelo 5x4
     */
    async getWeeklyActionPlan() {
        try {
            const response = await fetch(`${this.apiBase}/weekly-plan`, {
                credentials: 'include' // Incluir cookies de autenticación
            });
            
            if (response.status === 401) {
                throw new Error('Usuario no autenticado');
            }

            if (response.status === 404) {
                // No se pudo determinar la semana actual
                return {
                    success: false,
                    error: 'No se pudo generar el plan semanal. Asegúrate de haber iniciado el currículo.',
                    suggestion: 'Comienza con la Fase 0 para establecer tu progreso inicial.'
                };
            }
            
            return await this.handleResponse(response);
        } catch (error) {
            if (error.message.includes('no autenticado')) {
                // Usuario no autenticado - devolver plan de inicio
                return {
                    success: false,
                    error: 'Usuario no autenticado',
                    starter_plan: {
                        title: 'Comienza tu viaje de aprendizaje',
                        description: 'Regístrate o inicia sesión para obtener tu plan personalizado',
                        suggested_action: 'Explorar Fase 0: La Cimentación del Arquitecto'
                    }
                };
            }
            throw new Error(`Error obteniendo plan semanal: ${error.message}`);
        }
    }

    /**
     * Marca una semana como completada (MISIÓN 41.0)
     * Motor de Progresión por Dependencias
     */
    async markWeekAsCompleted(weekId, completionNotes = '', evidenceLinks = []) {
        if (!weekId) {
            throw new Error('ID de semana requerido');
        }

        try {
            const response = await fetch(`${this.apiBase}/complete-week`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    week_id: weekId,
                    completion_notes: completionNotes,
                    evidence_links: evidenceLinks
                })
            });

            if (response.status === 401) {
                throw new Error('Usuario no autenticado');
            }

            if (response.status === 403) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'No tienes permisos para completar esta semana');
            }

            const result = await this.handleResponse(response);
            
            // Invalidar cache relacionado al progreso
            this.invalidateProgressCache();
            
            return result;
        } catch (error) {
            throw new Error(`Error marcando semana como completada: ${error.message}`);
        }
    }

    /**
     * Obtiene información sobre semanas bloqueadas para el usuario (MISIÓN 41.0)
     */
    async getLockedWeeks() {
        try {
            const response = await fetch(`${this.apiBase}/locked-weeks`, {
                credentials: 'include'
            });
            
            if (response.status === 401) {
                throw new Error('Usuario no autenticado');
            }
            
            return await this.handleResponse(response);
        } catch (error) {
            if (error.message.includes('no autenticado')) {
                return {
                    success: false,
                    error: 'Usuario no autenticado',
                    locked_weeks: []
                };
            }
            throw new Error(`Error obteniendo semanas bloqueadas: ${error.message}`);
        }
    }

    /**
     * Genera plan detallado de 5 días a partir de week_id (SUB-MISIÓN 41.2)
     * Expansión del Plan Semanal desde Próxima Actividad Recomendada
     */
    async generateDetailedPlan(weekId) {
        if (!weekId) {
            throw new Error('ID de semana requerido');
        }

        try {
            const response = await fetch(`${this.apiBase}/generate-detailed-plan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    week_id: weekId
                })
            });

            if (response.status === 401) {
                throw new Error('Usuario no autenticado');
            }

            if (response.status === 403) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'No tienes acceso a esta semana');
            }

            if (response.status === 404) {
                throw new Error('Semana no encontrada');
            }

            return await this.handleResponse(response);
        } catch (error) {
            if (error.message.includes('no autenticado')) {
                return {
                    success: false,
                    error: 'Usuario no autenticado. Inicia sesión para generar plan detallado.'
                };
            }
            throw new Error(`Error generando plan detallado: ${error.message}`);
        }
    }

    /**
     * Busca contenido específico en el currículo
     */
    async searchContent(query) {
        if (!query || query.trim().length < 3) {
            throw new Error('Consulta de búsqueda debe tener al menos 3 caracteres');
        }

        try {
            const structure = await this.getFullStructure();
            return this.performClientSideSearch(structure.data.curriculum, query);
        } catch (error) {
            throw new Error(`Error en búsqueda: ${error.message}`);
        }
    }

    /**
     * Obtiene estadísticas generales del currículo
     */
    async getCurriculumStats() {
        const cacheKey = 'curriculum-stats';
        
        if (this.hasValidCache(cacheKey)) {
            return this.getFromCache(cacheKey);
        }

        try {
            const structure = await this.getFullStructure();
            const stats = this.calculateCurriculumStats(structure.data);
            
            this.setCache(cacheKey, stats);
            return stats;
        } catch (error) {
            throw new Error(`Error calculando estadísticas: ${error.message}`);
        }
    }

    // MÉTODOS PRIVADOS

    /**
     * Maneja la respuesta de la API
     */
    async handleResponse(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Error en la respuesta de la API');
        }

        return data;
    }

    /**
     * Verifica si existe cache válido
     */
    hasValidCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return false;
        
        return Date.now() - cached.timestamp < this.cacheTimeout;
    }

    /**
     * Obtiene datos del cache
     */
    getFromCache(key) {
        return this.cache.get(key).data;
    }

    /**
     * Guarda datos en cache
     */
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Invalida cache relacionado al progreso
     */
    invalidateProgressCache() {
        const progressKeys = Array.from(this.cache.keys()).filter(key => 
            key.includes('progress') || key.includes('dashboard')
        );
        
        progressKeys.forEach(key => this.cache.delete(key));
    }

    /**
     * Limpia todo el cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Calcula métricas para el dashboard con progreso del usuario
     */
    calculateDashboardMetrics(phasesData, userProgressData) {
        const totalPhases = phasesData.phases.length;
        const totalModules = phasesData.phases.reduce((sum, phase) => sum + (phase.stats?.total_modules || 0), 0);
        const totalWeeks = phasesData.phases.reduce((sum, phase) => sum + (phase.stats?.total_weeks || 0), 0);
        const totalHours = totalWeeks * 20; // Modelo 5x4

        const userMetrics = userProgressData.overall_progress;

        return {
            phases: {
                total: totalPhases,
                completed: userMetrics.phases.completed,
                current: this.findCurrentPhase(phasesData.phases, userProgressData),
                percentage: userMetrics.phases.percentage
            },
            modules: {
                total: totalModules,
                completed: userMetrics.modules.completed,
                percentage: userMetrics.modules.percentage
            },
            weeks: {
                total: totalWeeks,
                completed: userMetrics.weeks.completed,
                percentage: userMetrics.weeks.percentage
            },
            hours: {
                total: totalHours,
                completed: userMetrics.estimated_hours_completed,
                percentage: Math.round((userMetrics.estimated_hours_completed / totalHours) * 100)
            },
            overall_percentage: userMetrics.overall_percentage,
            curriculum_status: userProgressData.curriculum_status,
            next_recommendation: userProgressData.next_recommended
        };
    }

    /**
     * Calcula métricas básicas sin progreso del usuario
     */
    calculateBasicMetrics(phasesData) {
        const totalPhases = phasesData.phases.length;
        const totalModules = phasesData.phases.reduce((sum, phase) => sum + (phase.stats?.total_modules || 0), 0);
        const totalWeeks = phasesData.phases.reduce((sum, phase) => sum + (phase.stats?.total_weeks || 0), 0);
        const totalHours = totalWeeks * 20;

        return {
            phases: { total: totalPhases, completed: 0, current: null, percentage: 0 },
            modules: { total: totalModules, completed: 0, percentage: 0 },
            weeks: { total: totalWeeks, completed: 0, percentage: 0 },
            hours: { total: totalHours, completed: 0, percentage: 0 },
            overall_percentage: 0,
            curriculum_status: {
                status: 'not_started',
                display: 'No iniciado',
                color: 'gray',
                description: 'Currículo listo para comenzar'
            },
            next_recommendation: null
        };
    }

    /**
     * Encuentra la fase actual del usuario
     */
    findCurrentPhase(phases, userProgressData) {
        // Buscar la primera fase no completada
        const progressByPhase = userProgressData.progress_by_phase;
        
        for (const phase of phases) {
            const phaseProgress = progressByPhase.find(p => p.phase_number === phase.phase_number);
            
            if (!phaseProgress || Object.keys(phaseProgress.modules).length === 0) {
                return phase;
            }
        }
        
        // Si todas están completadas, devolver la última
        return phases[phases.length - 1];
    }

    /**
     * Realiza búsqueda del lado del cliente
     */
    performClientSideSearch(curriculum, query) {
        const results = [];
        const searchTerm = query.toLowerCase();

        curriculum.forEach(phase => {
            // Buscar en título y propósito de la fase
            if (phase.title.toLowerCase().includes(searchTerm) || 
                (phase.purpose && phase.purpose.toLowerCase().includes(searchTerm))) {
                results.push({
                    type: 'phase',
                    match: phase,
                    relevance: this.calculateRelevance(phase.title + ' ' + phase.purpose, searchTerm)
                });
            }

            // Buscar en módulos
            phase.modules.forEach(module => {
                if (module.title.toLowerCase().includes(searchTerm) ||
                    (module.description && module.description.toLowerCase().includes(searchTerm))) {
                    results.push({
                        type: 'module',
                        match: module,
                        parent_phase: phase,
                        relevance: this.calculateRelevance(module.title + ' ' + module.description, searchTerm)
                    });
                }

                // Buscar en semanas
                module.weeks.forEach(week => {
                    if (week.title.toLowerCase().includes(searchTerm) ||
                        (week.theme && week.theme.toLowerCase().includes(searchTerm))) {
                        results.push({
                            type: 'week',
                            match: week,
                            parent_module: module,
                            parent_phase: phase,
                            relevance: this.calculateRelevance(week.title + ' ' + week.theme, searchTerm)
                        });
                    }
                });
            });
        });

        return results.sort((a, b) => b.relevance - a.relevance);
    }

    /**
     * Calcula relevancia de búsqueda
     */
    calculateRelevance(text, searchTerm) {
        const lowerText = text.toLowerCase();
        const lowerTerm = searchTerm.toLowerCase();
        
        let score = 0;
        
        // Coincidencia exacta en el título (mayor peso)
        if (lowerText.includes(lowerTerm)) {
            score += 10;
        }
        
        // Coincidencias de palabras individuales
        const searchWords = lowerTerm.split(' ');
        const textWords = lowerText.split(' ');
        
        searchWords.forEach(searchWord => {
            textWords.forEach(textWord => {
                if (textWord.includes(searchWord)) {
                    score += 1;
                }
            });
        });

        return score;
    }

    /**
     * Calcula estadísticas generales del currículo
     */
    calculateCurriculumStats(structureData) {
        const curriculum = structureData.curriculum;
        
        let totalObjectives = 0;
        let totalCompetencies = 0;
        let totalDeliverables = 0;
        let totalTechnologies = new Set();

        curriculum.forEach(phase => {
            totalObjectives += (phase.objectives || []).length;
            totalCompetencies += (phase.competencies || []).length;

            phase.modules.forEach(module => {
                totalObjectives += (module.objectives || []).length;
                totalDeliverables += (module.deliverables || []).length;
                
                (module.technologies || []).forEach(tech => totalTechnologies.add(tech));

                module.weeks.forEach(week => {
                    totalObjectives += (week.objectives || []).length;
                    totalDeliverables += (week.deliverables || []).length;
                });
            });
        });

        return {
            ...structureData.stats,
            content_stats: {
                total_objectives: totalObjectives,
                total_competencies: totalCompetencies,
                total_deliverables: totalDeliverables,
                unique_technologies: totalTechnologies.size,
                technologies_list: Array.from(totalTechnologies)
            }
        };
    }
}

// Crear instancia singleton del servicio
const curriculumService = new CurriculumService();

export default curriculumService;