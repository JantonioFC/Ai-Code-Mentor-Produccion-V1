'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // App Router hook
import { useAuth } from './useAuth'; // Configured for singleton usage

/**
 * ProtectedRouteApp - Auth Protection for App Router
 * 
 * @description Version of ProtectedRoute adapted for Next.js App Directory (app/).
 *              Uses 'next/navigation' instead of 'next/router'.
 */
const ProtectedRouteApp = ({
    children,
    redirectTo = '/login',
    showLoadingScreen = true
}) => {
    const { authState, user } = useAuth();
    const router = useRouter();

    // Redirect logic
    useEffect(() => {
        if (authState === 'unauthenticated') {
            console.log('🔒 [PROTECTED-ROUTE-APP] User unauthenticated, redirecting to:', redirectTo);
            router.push(redirectTo);
        }
    }, [authState, redirectTo, router]);

    // Render logic based on authState
    switch (authState) {
        case 'loading':
            console.log('⏳ [PROTECTED-ROUTE-APP] Checking auth...');
            return null; // Or a loading spinner

        case 'unauthenticated':
            // Show restricted access message while redirecting
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 to-orange-900">
                    <div className="text-center">
                        <div className="text-white text-6xl mb-4">🔒</div>
                        <p className="text-white text-xl font-semibold mb-2">Acceso Restringido</p>
                        <p className="text-gray-200 text-sm">Redirigiendo a inicio de sesión...</p>
                    </div>
                </div>
            );

        case 'authenticated':
            console.log('✅ [PROTECTED-ROUTE-APP] User authenticated:', user?.email);
            return children;

        default:
            return null;
    }
};

export default ProtectedRouteApp;
