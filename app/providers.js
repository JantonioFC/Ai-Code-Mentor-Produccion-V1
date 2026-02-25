'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '../lib/auth/useAuth';
import { APITrackingProvider } from '../contexts/APITrackingContext';
import { LessonProvider } from '../contexts/LessonContext';
import { ProjectTrackingProvider } from '../contexts/ProjectTrackingContext';
import { PixelLoader } from '../components/analytics/PixelLoader';
import CookieBanner from '../components/compliance/CookieBanner';
import LoadingScreen from '../components/auth/LoadingScreen';

const PUBLIC_PATH_PREFIXES = ['/login', '/register'];

/**
 * AuthGate Component (App Router version)
 * Maneja el estado de carga inicial de la sesión.
 */
function AuthGate({ children }) {
    const { authState, loading } = useAuth();
    const pathname = usePathname();

    const isPublicPath = pathname === '/' ||
        PUBLIC_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix));

    // No bloquear rutas públicas
    if (isPublicPath) {
        return <>{children}</>;
    }

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
        <>
            <PixelLoader />
            <CookieBanner />
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
        </>
    );
}
