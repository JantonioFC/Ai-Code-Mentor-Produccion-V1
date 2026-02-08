/**
 * Admin Analytics Dashboard
 * Muestra métricas y estadísticas del sistema con integración de Feedback Loop.
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';

// --- Componentes auxiliares ---

function StatCard({ title, value, subtitle, icon, color }) {
    const cardColors = {
        blue: 'from-blue-600 to-blue-800',
        green: 'from-green-600 to-green-800',
        yellow: 'from-yellow-600 to-yellow-800',
        purple: 'from-purple-600 to-purple-800'
    };

    return (
        <div className={`bg-gradient-to-br ${cardColors[color] || cardColors.blue} rounded-lg p-6 shadow-lg`}>
            <div className="flex items-center justify-between">
                <span className="text-3xl">{icon}</span>
                <span className="text-3xl font-bold">{value}</span>
            </div>
            <h3 className="mt-4 font-medium">{title}</h3>
            <p className="text-sm opacity-75">{subtitle}</p>
        </div>
    );
}

function MetricBar({ label, value }) {
    const getBarColor = (val) => {
        if (val >= 80) return 'bg-green-500';
        if (val >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span>{label}</span>
                <span>{value}%</span>
            </div>
            <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                    className={`h-2 rounded-full ${getBarColor(value)} transition-all duration-500`}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}

function formatMetricLabel(key) {
    const labels = {
        faithfulness: 'Fidelidad',
        relevance: 'Relevancia',
        length: 'Longitud',
        structure: 'Estructura',
        noHallucination: 'Sin Alucinación'
    };
    return labels[key] || key;
}

function getGradeColor(grade) {
    if (!grade) return 'bg-gray-500';
    if (grade.startsWith('A')) return 'bg-green-500';
    if (grade.startsWith('B')) return 'bg-blue-500';
    if (grade.startsWith('C')) return 'bg-yellow-500';
    if (grade.startsWith('D')) return 'bg-orange-500';
    return 'bg-red-500';
}

// --- Componente Principal ---

export default function AnalyticsDashboard() {
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState(null);
    const [lessonStats, setLessonStats] = useState(null);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);

            const [overviewRes, lessonsRes, feedbackRes] = await Promise.all([
                fetch('/api/v1/analytics/overview'),
                fetch('/api/v1/analytics/lessons?days=30'),
                fetch('/api/v1/analytics/feedback')
            ]);

            if (!overviewRes.ok || !lessonsRes.ok || !feedbackRes.ok) {
                throw new Error('Error al cargar analíticas');
            }

            const oData = await overviewRes.json();
            const lData = await lessonsRes.json();
            const fData = await feedbackRes.json();

            setOverview(oData.data);
            setLessonStats(lData.data);
            setFeedback(fData.data);
        } catch (err) {
            console.error('❌ [ANALYTICS] Fetch Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="text-blue-400 text-5xl mb-4">📊</div>
                    <div className="text-white text-xl font-medium">Analizando datos del mentor...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8 text-center">
                <div>
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-white mb-2">Error Crítico</h2>
                    <p className="text-red-400 max-w-md mx-auto">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Analytics Dashboard | AI Code Mentor</title>
            </Head>

            <div className="min-h-screen bg-gray-900 text-white p-8">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold">📊 Dashboard de Analíticas</h1>
                        <p className="text-gray-400 mt-2">Métricas de rendimiento de IA y satisfacción de alumnos</p>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                        Última actualización: {new Date().toLocaleTimeString()}
                    </div>
                </header>

                {/* Resumen General (Cards) */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Lecciones Generadas"
                        value={overview?.overview?.lessons?.total || 0}
                        subtitle={`Promedio: ${overview?.overview?.lessons?.avgScore || 0}/100`}
                        icon="📚"
                        color="blue"
                    />
                    <StatCard
                        title="Sesiones Activas"
                        value={overview?.overview?.sessions?.active || 0}
                        subtitle={`${overview?.overview?.sessions?.totalUsers || 0} usuarios totales`}
                        icon="👥"
                        color="green"
                    />
                    <StatCard
                        title="Rating Promedio"
                        value={feedback?.summary?.avgRating?.toFixed(1) || '0.0'}
                        subtitle={`${feedback?.summary?.total || 0} valoraciones recibidas`}
                        icon="⭐"
                        color="yellow"
                    />
                    <StatCard
                        title="Tasa de Aprobación"
                        value={`${overview?.evaluationMetrics?.totals?.passRate || 0}%`}
                        subtitle={`${overview?.evaluationMetrics?.totals?.evaluations || 0} auditorías`}
                        icon="✅"
                        color="purple"
                    />
                </section>

                {/* Métricas de Evaluación de IA */}
                <section className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700">
                    <h2 className="text-xl font-semibold mb-6 flex items-center">
                        <span className="mr-2">📈</span> Calidad de Respuesta de IA
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
                        {overview?.evaluationMetrics?.components && Object.entries(overview.evaluationMetrics.components).map(([key, value]) => (
                            <MetricBar
                                key={key}
                                label={formatMetricLabel(key)}
                                value={value}
                            />
                        ))}
                    </div>
                </section>

                {/* Feedback & Satisfaction (Dos Columnas) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Distribución de Dificultad */}
                    <section className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                        <h2 className="text-xl font-semibold mb-6 flex items-center">
                            <span className="mr-2">🧠</span> Percepción de Dificultad
                        </h2>
                        <div className="space-y-6">
                            {['TOO_EASY', 'JUST_RIGHT', 'TOO_HARD'].map(diff => {
                                const item = feedback?.difficulty?.find(d => d.difficulty === diff);
                                const count = item ? item.count : 0;
                                const total = feedback?.summary?.total || 1;
                                const percentage = Math.round((count / total) * 100);

                                const labels = { TOO_EASY: 'Muy Fácil', JUST_RIGHT: 'Adecuada', TOO_HARD: 'Muy Difícil' };
                                const colors = { TOO_EASY: 'bg-blue-400', JUST_RIGHT: 'bg-green-400', TOO_HARD: 'bg-red-400' };

                                return (
                                    <div key={diff}>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="font-medium">{labels[diff]}</span>
                                            <span className="text-gray-400">{count} alumnos ({percentage}%)</span>
                                        </div>
                                        <div className="bg-gray-700 rounded-full h-4">
                                            <div
                                                className={`h-4 rounded-full ${colors[diff]} transition-all duration-700`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Comentarios Recientes */}
                    <section className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                        <h2 className="text-xl font-semibold mb-6 flex items-center">
                            <span className="mr-2">💬</span> Voces de los Estudiantes
                        </h2>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {feedback?.recentComments?.map((c, i) => (
                                <div key={i} className="bg-gray-900/40 p-4 rounded-lg border border-gray-700 hover:border-blue-500/50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs text-blue-400 font-mono font-semibold">{c.user_email}</span>
                                        <span className="text-xs text-yellow-400 drop-shadow-sm">{'★'.repeat(c.rating)}{'☆'.repeat(5 - c.rating)}</span>
                                    </div>
                                    <p className="text-sm italic text-gray-300">&quot;{c.comment}&quot;</p>
                                    <div className="text-[10px] text-gray-500 mt-3 text-right">
                                        {new Date(c.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                            {(!feedback?.recentComments || feedback.recentComments.length === 0) && (
                                <div className="text-gray-500 text-center py-12 italic">
                                    No hay comentarios registrados por el momento.
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Distribución de Scores & Actividad */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Distribución por Grados */}
                    <section className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                        <h2 className="text-xl font-semibold mb-6 flex items-center">
                            <span className="mr-2">📊</span> Distribución de Calificaciones
                        </h2>
                        <div className="space-y-4">
                            {lessonStats?.scoreDistribution?.map((item) => (
                                <div key={item.grade} className="flex items-center gap-4">
                                    <span className="w-12 text-sm font-bold text-gray-400">{item.grade}</span>
                                    <div className="flex-1 bg-gray-700 rounded-full h-8 overflow-hidden">
                                        <div
                                            className={`h-full ${getGradeColor(item.grade)} transition-all duration-1000`}
                                            style={{ width: `${Math.min(100, item.count * 10)}%` }}
                                        />
                                    </div>
                                    <span className="w-8 text-right font-mono text-xs">{item.count}</span>
                                </div>
                            ))}
                            {(!lessonStats?.scoreDistribution || lessonStats.scoreDistribution.length === 0) && (
                                <p className="text-gray-500 italic py-4">Sin datos de distribución.</p>
                            )}
                        </div>
                    </section>

                    {/* Actividad Semanal */}
                    <section className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                        <h2 className="text-xl font-semibold mb-6 flex items-center">
                            <span className="mr-2">📅</span> Actividad del Currículum
                        </h2>
                        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                            {lessonStats?.activityByWeek?.map((item) => (
                                <div
                                    key={item.semana}
                                    className="flex flex-col items-center bg-blue-600/20 border border-blue-500/30 rounded-lg p-3 hover:bg-blue-600/40 transition-all cursor-default"
                                    title={`${item.interactions} interacciones`}
                                >
                                    <span className="text-[10px] text-blue-300 font-bold uppercase mb-1">Sem {item.semana}</span>
                                    <span className="text-lg font-bold">{item.interactions}</span>
                                </div>
                            ))}
                            {(!lessonStats?.activityByWeek || lessonStats.activityByWeek.length === 0) && (
                                <p className="text-gray-500 col-span-full py-4 italic">No hay actividad registrada.</p>
                            )}
                        </div>
                    </section>
                </div>

                {/* Acciones de Control */}
                <div className="mt-12 pt-8 border-t border-gray-800 text-center">
                    <button
                        onClick={fetchAnalytics}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95 flex items-center mx-auto"
                    >
                        <span className="mr-2">🔄</span> Sincronizar Datos en Vivo
                    </button>
                    <p className="mt-4 text-xs text-gray-500">
                        Los datos se extraen directamente del motor local de auditoría.
                    </p>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #374151;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #4b5563;
                }
            `}</style>
        </>
    );
}
