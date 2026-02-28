const db = require('../db');

/**
 * Repository for accessing Global Curriculum data
 * Replaces monolithic curriculum-sqlite.js functions
 */
class CurriculumRepository {

    /**
     * Get curriculum index structure
     */
    getCurriculumIndex() {
        try {
            const fases = db.query(`
                SELECT f.*, COUNT(m.id) as total_modulos, COUNT(s.id) as total_semanas
                FROM fases f
                LEFT JOIN modulos m ON f.id = m.fase_id
                LEFT JOIN semanas s ON m.id = s.modulo_id
                GROUP BY f.id
                ORDER BY f.fase
            `);

            const phaseMappings = db.query(`
                SELECT
                    f.fase, f.titulo_fase,
                    MIN(s.semana) as start_week,
                    MAX(s.semana) as end_week,
                    COUNT(s.semana) as week_count
                FROM fases f
                JOIN modulos m ON f.id = m.fase_id
                JOIN semanas s ON m.id = s.modulo_id
                GROUP BY f.fase, f.titulo_fase
                ORDER BY f.fase
            `);

            const totalWeeks = db.get('SELECT COUNT(*) as total FROM semanas').total;

            return {
                version: '9.1.0-repo',
                sourceType: 'sqlite-repo',
                dataStore: 'curriculum.db',
                totalPhases: fases.length,
                totalWeeks,
                phaseMapping: phaseMappings.map(row => ({
                    fase: row.fase,
                    titulo: row.titulo_fase,
                    startWeek: row.start_week,
                    endWeek: row.end_week,
                    weekCount: row.week_count
                })),
                fases: fases.map(fase => {
                    let duracionCalculada = fase.duracion_meses;
                    if (fase.total_semanas > 0) {
                        const mesesMin = Math.floor(fase.total_semanas / 4);
                        const mesesMax = Math.ceil(fase.total_semanas / 4);
                        if (mesesMin === mesesMax || mesesMin === 0) {
                            duracionCalculada = `${mesesMax} Mes${mesesMax !== 1 ? 'es' : ''}`;
                        } else {
                            duracionCalculada = `${mesesMin}-${mesesMax} Meses`;
                        }
                    }

                    return {
                        fase: fase.fase,
                        titulo: fase.titulo_fase,
                        duracion: duracionCalculada,
                        proposito: fase.proposito,
                        totalModulos: fase.total_modulos,
                        totalSemanas: fase.total_semanas
                    };
                }),
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('[CurriculumRepository] Error in getCurriculumIndex:', error);
            throw error;
        }
    }

    /**
     * Get basic phases only (Lazly Loading Mision 213.0)
     */
    getPhasesOnly() {
        try {
            // MISIÓN 213.1 - Corrección UI: Cálculo dinámico de meses basado en semanas reales
            const phases = db.query(`
                SELECT 
                    f.fase, 
                    f.titulo_fase, 
                    f.duracion_meses as duracion_original, 
                    f.proposito,
                    COUNT(s.id) as total_semanas
                FROM fases f
                LEFT JOIN modulos m ON f.id = m.fase_id
                LEFT JOIN semanas s ON m.id = s.modulo_id
                GROUP BY f.id
                ORDER BY f.fase
            `);

            const totals = db.get(`
                SELECT
                    COUNT(DISTINCT f.id) as total_phases,
                    COUNT(DISTINCT m.id) as total_modules,
                    COUNT(DISTINCT s.id) as total_weeks
                FROM fases f
                LEFT JOIN modulos m ON f.id = m.fase_id
                LEFT JOIN semanas s ON m.id = s.modulo_id
            `);

            return {
                version: '9.1.0-repo',
                sourceType: 'sqlite-repo',
                totalPhases: totals.total_phases,
                totalModules: totals.total_modules,
                totalWeeks: totals.total_weeks,
                curriculum: phases.map(phase => {
                    // Calculamos meses asumiendo 4 semanas por mes (~28 dias)
                    // Si tiene 10 semanas -> 2.5 meses -> "2-3 Meses"
                    // Si tiene 16 semanas -> 4 meses -> "4 Meses"
                    let duracionCalculada = phase.duracion_original;
                    if (phase.total_semanas > 0) {
                        const mesesMin = Math.floor(phase.total_semanas / 4);
                        const mesesMax = Math.ceil(phase.total_semanas / 4);
                        if (mesesMin === mesesMax || mesesMin === 0) {
                            duracionCalculada = `${mesesMax} Mes${mesesMax !== 1 ? 'es' : ''}`;
                        } else {
                            duracionCalculada = `${mesesMin}-${mesesMax} Meses`;
                        }
                    }

                    return {
                        fase: phase.fase,
                        tituloFase: phase.titulo_fase,
                        duracionMeses: duracionCalculada, // Dinámico
                        proposito: phase.proposito,
                        modulos: [] // Lazy loaded
                    };
                }),
                metadata: {
                    optimizedFor: 'lazy-loading',
                    loadingStrategy: 'phases-only-initial'
                }
            };
        } catch (error) {
            console.error('[CurriculumRepository] Error in getPhasesOnly:', error);
            throw error;
        }
    }

    /**
     * Get full summary hierarchy
     */
    getCurriculumSummary() {
        try {
            const rawData = db.query(`
            SELECT 
                f.fase, f.titulo_fase, f.duracion_meses, f.proposito,
                m.modulo, m.titulo_modulo,
                s.semana, s.titulo_semana, s.tematica
            FROM fases f
            JOIN modulos m ON f.id = m.fase_id
            JOIN semanas s ON m.id = s.modulo_id
            ORDER BY f.fase, m.modulo, s.semana
        `);

            const fasesMap = new Map();

            rawData.forEach(row => {
                if (!fasesMap.has(row.fase)) {
                    fasesMap.set(row.fase, {
                        fase: row.fase,
                        titulo_fase: row.titulo_fase,
                        duracion_meses: row.duracion_meses,
                        proposito: row.proposito,
                        modulos: new Map()
                    });
                }
                const fase = fasesMap.get(row.fase);

                if (!fase.modulos.has(row.modulo)) {
                    fase.modulos.set(row.modulo, {
                        modulo: row.modulo,
                        titulo_modulo: row.titulo_modulo,
                        semanas: []
                    });
                }

                fase.modulos.get(row.modulo).semanas.push({
                    semana: row.semana,
                    titulo_semana: row.titulo_semana,
                    tematica: row.tematica || 'Sin tema'
                });
            });

            const curriculum = Array.from(fasesMap.values()).map(f => ({
                ...f,
                modulos: Array.from(f.modulos.values())
            }));

            const totalWeeks = rawData.length > 0
                ? new Set(rawData.map(r => r.semana)).size
                : 0;

            return {
                version: '9.1.0-repo',
                sourceType: 'sqlite-repo',
                totalPhases: curriculum.length,
                totalWeeks,
                curriculum,
                metadata: { optimizedFor: 'navigation' }
            };
        } catch (error) {
            console.error('[CurriculumRepository] Error in getCurriculumSummary:', error);
            throw error;
        }
    }

    /**
     * Validate database integrity
     */
    validateDatabase() {
        try {
            const validations = {
                totalSemanas: db.get('SELECT COUNT(*) as count FROM semanas').count,
                rangoSemanas: db.get('SELECT MIN(semana) as min, MAX(semana) as max FROM semanas'),
                totalFases: db.get('SELECT COUNT(*) as count FROM fases').count,
                totalModulos: db.get('SELECT COUNT(*) as count FROM modulos').count,
                totalEsquemasDiarios: db.get('SELECT COUNT(*) as count FROM esquema_diario').count
            };

            const expectedTotalWeeks = validations.rangoSemanas.max;
            const isValid = validations.totalSemanas === expectedTotalWeeks &&
                validations.rangoSemanas.min === 1;

            return {
                isValid,
                validations,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('[CurriculumRepository] Error in validateDatabase:', error);
            throw error;
        }
    }
}

const curriculumRepository = new CurriculumRepository();
module.exports = { CurriculumRepository, curriculumRepository };
