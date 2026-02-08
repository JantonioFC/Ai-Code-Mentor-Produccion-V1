'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth/useAuth';

/**
 * Login Client Component
 * Maneja la lógica de autenticación y la interfaz de usuario para /login.
 */
export default function LoginClient() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [authMode, setAuthMode] = useState('login'); // 'login' o 'signup'
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [signupData, setSignupData] = useState({ email: '', password: '' });
    const { signIn, signUp, isAuthenticated, loading: authLoading } = useAuth();

    const resetForm = () => {
        setAuthMode('login');
        setLoginData({ email: '', password: '' });
        setSignupData({ email: '', password: '' });
    };

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            router.push('/panel-de-control');
        }
    }, [isAuthenticated, authLoading, router]);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data, error } = await signIn(loginData.email, loginData.password);
            if (error) {
                alert(`Error de autenticación: ${error}`);
            } else {
                setLoginData({ email: '', password: '' });
                // Redirección manejada por el useEffect
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        if (signupData.password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setIsLoading(true);

        try {
            const { data, error } = await signUp(signupData.email, signupData.password, {
                display_name: signupData.email.split('@')[0]
            });

            if (error) {
                alert(`Error de registro: ${error}`);
                return;
            }

            alert('¡Registro exitoso! Ya puedes iniciar sesión.');
            setAuthMode('login');
            setSignupData({ email: '', password: '' });

        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickDemo = async () => {
        setIsLoading(true);
        try {
            const { error } = await signIn('demo@aicodementor.com', 'demo123');
            if (error) {
                alert(`Error de demo: ${error}`);
            }
            // Redirección manejada por el useEffect
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        AI Code Mentor
                    </div>
                    <div className="text-sm text-gray-500">
                        Ecosistema 360 • Plataforma de Aprendizaje
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                        <button
                            onClick={() => setAuthMode('login')}
                            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${authMode === 'login'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            Iniciar Sesión
                        </button>
                        <button
                            onClick={() => setAuthMode('signup')}
                            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${authMode === 'signup'
                                ? 'bg-white text-purple-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            Registrarse
                        </button>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                        {authMode === 'login' ? '🔐 Bienvenido de Vuelta' : '✨ Empieza Gratis'}
                    </h2>
                    <p className="text-sm text-gray-500 text-center mb-6">
                        {authMode === 'login'
                            ? 'Continúa tu aprendizaje donde lo dejaste'
                            : 'Crea tu cuenta en 30 segundos • Sin tarjeta de crédito'}
                    </p>

                    {authMode === 'login' ? (
                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={loginData.email}
                                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="tu@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                                <input
                                    type="password"
                                    required
                                    value={loginData.password}
                                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Tu contraseña"
                                />
                            </div>
                            <div className="space-y-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading || authLoading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-md font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? 'Iniciando sesión...' : '🔓 Iniciar Sesión'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleQuickDemo}
                                    disabled={isLoading || authLoading}
                                    className="w-full bg-green-600 text-white py-3 rounded-md font-semibold hover:bg-green-700 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? 'Cargando...' : '⚡ Acceso Demo Rápido'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleSignupSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={signupData.email}
                                    onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="tu@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                                <input
                                    type="password"
                                    required
                                    value={signupData.password}
                                    onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Mínimo 6 caracteres"
                                    minLength="6"
                                />
                            </div>
                            <div className="pt-4 space-y-3">
                                <button
                                    type="submit"
                                    disabled={isLoading || authLoading}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-md font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? 'Creando cuenta...' : '✨ Empezar Ahora'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="text-center mt-6">
                    <button
                        onClick={() => router.push('/')}
                        className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        ← Volver al inicio
                    </button>
                </div>
            </div>
        </div>
    );
}
