'use client';

import { AuthProvider, useAuth } from '../lib/auth/useAuth';
import { APITrackingProvider } from '../contexts/APITrackingContext';
import { LessonProvider } from '../contexts/LessonContext';
import { ProjectTrackingProvider } from '../contexts/ProjectTrackingContext';
import LoadingScreen from '../components/auth/LoadingScreen';

/**
 * AuthGate Component (App Router version)
 * Maneja el estado de carga inicial de la sesión.
 */
function AuthGate({ children }) {
    const { authState, loading } = useAuth();

    console.log('🚪 [APP-AUTH-GATE] Render - authState:', authState, 'loading:', loading);

    if (authState === 'loading' || loading) {
        return <LoadingScreen message="Sincronizando con el Mentor IA..." />;
    }

    return <>{children}</>;
}

/**
 * Global Providers for App Router
 * Envuelve los componentes hijo con todos los contextos necesarios.
 */
export function Providers({ children }) {
    return (
        <AuthProvider>
            <AuthGate>
                <APITrackingProvider>
                    <LessonProvider>
                        <ProjectTrackingProvider>
                            {children}
                        </ProjectTrackingProvider>
                    </LessonProvider>
                </APITrackingProvider>
            </AuthGate>
        </AuthProvider>
    );
}
