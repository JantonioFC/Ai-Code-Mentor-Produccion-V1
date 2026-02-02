/**
 * OnboardingChecklist - Guía de Onboarding paso a paso
 * 
 * Skill: onboarding-cro
 * Objetivo: Llevar al usuario a su "aha moment" rápidamente
 * 
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';

const ONBOARDING_STEPS = [
    {
        id: 'profile',
        title: 'Completa tu perfil',
        description: 'Añade tu nombre y nivel de experiencia',
        icon: '👤',
        href: '/perfil',
        checkKey: 'profileCompleted'
    },
    {
        id: 'first-lesson',
        title: 'Genera tu primera lección',
        description: 'Prueba la IA con un tema que te interese',
        icon: '📚',
        href: '/panel-de-control',
        checkKey: 'firstLessonGenerated'
    },
    {
        id: 'explore-templates',
        title: 'Explora las plantillas',
        description: 'Descubre herramientas para tu aprendizaje',
        icon: '📋',
        href: '/plantillas',
        checkKey: 'templatesExplored'
    },
    {
        id: 'set-goals',
        title: 'Define tus metas',
        description: 'Establece objetivos semanales',
        icon: '🎯',
        href: '/metas',
        checkKey: 'goalsSet'
    }
];

export function OnboardingChecklist({ userId, onComplete, initialProgress = {} }) {
    const [progress, setProgress] = useState(initialProgress);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isVisible, setIsVisible] = useState(true);

    const completedCount = Object.values(progress).filter(Boolean).length;
    const totalSteps = ONBOARDING_STEPS.length;
    const isComplete = completedCount === totalSteps;
    const progressPercent = Math.round((completedCount / totalSteps) * 100);

    // Cargar progreso desde localStorage
    useEffect(() => {
        const stored = localStorage.getItem(`onboarding_${userId}`);
        if (stored) {
            const parsed = JSON.parse(stored);
            setProgress(parsed);
            // Ocultar si ya completó todo
            if (Object.values(parsed).filter(Boolean).length === totalSteps) {
                setIsVisible(false);
            }
        }
    }, [userId, totalSteps]);

    // Guardar progreso
    const markComplete = (stepId) => {
        const step = ONBOARDING_STEPS.find(s => s.id === stepId);
        if (!step) return;

        const newProgress = { ...progress, [step.checkKey]: true };
        setProgress(newProgress);
        localStorage.setItem(`onboarding_${userId}`, JSON.stringify(newProgress));

        // Callback cuando termina todo
        if (Object.values(newProgress).filter(Boolean).length === totalSteps) {
            onComplete?.();
        }
    };

    // Dismiss permanente
    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem(`onboarding_dismissed_${userId}`, 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-xl p-4 mb-6 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🚀</span>
                    <h3 className="font-semibold text-gray-800">Primeros Pasos</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {completedCount}/{totalSteps}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                        {isExpanded ? 'Minimizar' : 'Expandir'}
                    </button>
                    {isComplete && (
                        <button
                            onClick={handleDismiss}
                            className="text-gray-400 hover:text-gray-600 text-sm"
                            title="Cerrar"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* Steps */}
            {isExpanded && (
                <div className="space-y-2">
                    {ONBOARDING_STEPS.map((step, index) => {
                        const isStepComplete = progress[step.checkKey];
                        return (
                            <a
                                key={step.id}
                                href={step.href}
                                onClick={() => markComplete(step.id)}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${isStepComplete
                                        ? 'bg-green-50 border border-green-100'
                                        : 'bg-white border border-gray-100 hover:border-blue-200 hover:shadow-sm'
                                    }`}
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <span className="text-xl">{isStepComplete ? '✅' : step.icon}</span>
                                <div className="flex-1">
                                    <div className={`font-medium ${isStepComplete ? 'text-green-700 line-through' : 'text-gray-800'}`}>
                                        {step.title}
                                    </div>
                                    <div className="text-sm text-gray-500">{step.description}</div>
                                </div>
                                {!isStepComplete && (
                                    <span className="text-blue-500 text-sm">→</span>
                                )}
                            </a>
                        );
                    })}
                </div>
            )}

            {/* Completion Message */}
            {isComplete && (
                <div className="mt-4 p-3 bg-green-100 rounded-lg text-center">
                    <span className="text-green-700 font-medium">
                        🎉 ¡Felicidades! Ya estás listo para aprovechar al máximo AI Code Mentor
                    </span>
                </div>
            )}
        </div>
    );
}

export default OnboardingChecklist;
