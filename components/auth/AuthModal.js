import React from 'react';
import { Modal } from '../ui/Modal';

export default function AuthModal({
    authMode,
    setAuthMode,
    loginData,
    setLoginData,
    signupData,
    setSignupData,
    handleLoginSubmit,
    handleSignupSubmit,
    handleQuickDemo,
    onClose,
    isLoading,
    authLoading
}) {
    // Simplified using Compound Component Pattern
    // Note: Modal isOpen is handled by parent conditional rendering, so we pass true or logic if needed. 
    // Usually AuthModal is only rendered when open.
    return (
        <Modal isOpen={true} onClose={onClose}>
            <Modal.Header showClose={true}>
                {authMode === 'login' ? '🚀 Acceder a AI Code Mentor' : '✨ Crear Nueva Cuenta'}
            </Modal.Header>

            <Modal.Body className="space-y-6">
                {/* Toggle entre Login/Signup */}
                <div className="flex bg-gray-100 rounded-lg p-1">
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

                {/* FORMULARIO DE LOGIN */}
                {authMode === 'login' && (
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contraseña
                            </label>
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

                        <div className="text-center text-sm text-gray-600 mt-4">
                            <p>🎯 <strong>Demo:</strong> demo@aicodementor.com / demo123</p>
                        </div>
                    </form>
                )}

                {/* FORMULARIO DE REGISTRO */}
                {authMode === 'signup' && (
                    <form onSubmit={handleSignupSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contraseña
                            </label>
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirmar Contraseña
                            </label>
                            <input
                                type="password"
                                required
                                value={signupData.confirmPassword}
                                onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Repite tu contraseña"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading || authLoading}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-md font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                            >
                                {isLoading ? 'Creando cuenta...' : '✨ Crear Cuenta'}
                            </button>
                        </div>

                        <div className="text-center text-sm text-gray-600 mt-4">
                            <p>✅ Registro completo • ✅ Perfil automático • ✅ Acceso inmediato</p>
                        </div>
                    </form>
                )}
            </Modal.Body>
        </Modal>
    );
}
