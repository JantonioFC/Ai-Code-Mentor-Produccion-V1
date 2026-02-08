/**
 * Login Page - Punto de Entrada para Usuarios No Autenticados
 * 
 * @description Esta página actúa como el destino de redirección para ProtectedRoute.
 *              Proporciona la interfaz de autenticación (login/signup) para usuarios
 *              que intentan acceder a rutas protegidas sin estar autenticados.
 * 
 * @author Mentor Coder
 * @version 1.0.0
 * @created 2025-10-15
 * @mission 221 - Fase 4.1: Creación de Ruta de Login
 * 
 * ARQUITECTURA:
 * - Reutiliza lógica de autenticación de index.js
 * - Sin componentes adicionales (KISS principle)
 * - Integración directa con useAuth hook
 * - Redirección automática post-login a panel-de-control
 * 
 * FUNCIONALIDAD:
 * - Toggle entre modo login/signup
 * - Validación de contraseñas
 * - Integración con Supabase Auth
 * - Creación automática de perfil en signup
 * - Modo demo disponible
 */

import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth/useAuth';

export default function LoginPage() {
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

  // Si ya está autenticado, redirigir al panel
  // MISIÓN 230.1 - FASE 1: Control explícito de authLoading para prevenir race condition
  useEffect(() => {
    console.log(`🔍 [LOGIN-DEBUG] useEffect triggered - authLoading: ${authLoading}, isAuthenticated: ${isAuthenticated}`);

    // ✅ CRITICAL: Esperar a que authLoading sea false antes de redirigir
    if (!authLoading && isAuthenticated) {
      console.log('✅ [LOGIN] Usuario autenticado y authLoading completo, redirigiendo a panel de control');
      router.push('/panel-de-control');
    } else if (authLoading) {
      console.log('⏳ [LOGIN-DEBUG] authLoading=true, esperando verificación de sesión...');
    } else if (!isAuthenticated) {
      console.log('🔓 [LOGIN-DEBUG] Usuario no autenticado, mostrando formulario');
    }
  }, [isAuthenticated, authLoading, router]);

  // Handler para inicio de sesión
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('🔐 [LOGIN] Intentando iniciar sesión:', loginData.email);
      console.log('🔍 [LOGIN-DEBUG] Estado antes de signIn - authLoading:', authLoading, 'isAuthenticated:', isAuthenticated);
      const { data, error } = await signIn(loginData.email, loginData.password);
      console.log('🔍 [LOGIN-DEBUG] Respuesta de signIn - data:', !!data, 'error:', error);

      if (error) {
        console.error('❌ [LOGIN] Error de autenticación:', error);
        alert(`Error de autenticación: ${error}`);
      } else {
        console.log('✅ [LOGIN] Inicio de sesión exitoso');
        console.log('🔄 [LOGIN] Esperando actualización de AuthContext para navegación declarativa...');
        setLoginData({ email: '', password: '' });
        // NAVEGACIÓN DECLARATIVA: El useEffect reaccionará a isAuthenticated y redirigirá
        // router.push('/panel-de-control'); ← ELIMINADO: Causaba condición de carrera
      }
    } catch (err) {
      console.error('❌ [LOGIN] Error inesperado:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para registro
  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    // Validar longitud mínima de contraseña
    if (signupData.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      console.log('✨ [LOGIN] Intentando registrar usuario:', signupData.email);

      // Paso 1: Crear usuario en Supabase Auth
      const { data, error } = await signUp(signupData.email, signupData.password, {
        display_name: signupData.email.split('@')[0]
      });

      if (error) {
        console.error('❌ [LOGIN] Error de registro:', error);
        alert(`Error de registro: ${error}`);
        return;
      }

      // Paso 2: Crear perfil en nuestra base de datos
      if (data.user) {
        console.log('🔄 [LOGIN] Usuario creado en Auth, creando perfil...');

        // Esperar a que la sesión se propague
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
          const profileResponse = await fetch('/api/profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.session?.access_token}`,
            },
            body: JSON.stringify({
              display_name: signupData.email.split('@')[0],
              email: signupData.email,
            }),
          });

          const profileResult = await profileResponse.json();

          if (!profileResult.success) {
            console.warn('⚠️ [LOGIN] Warning: Usuario creado en Auth pero error en perfil:', profileResult.error);

            // Retry: Intentar una vez más tras 2 segundos
            await new Promise(resolve => setTimeout(resolve, 2000));
            const retryResponse = await fetch('/api/profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.session?.access_token}`,
              },
              body: JSON.stringify({
                display_name: signupData.email.split('@')[0],
                email: signupData.email,
              }),
            });

            const retryResult = await retryResponse.json();
            if (!retryResult.success) {
              console.warn('⚠️ [LOGIN] Warning: Retry también falló:', retryResult.error);
            } else {
              console.log('✅ [LOGIN] Perfil creado exitosamente en retry');
            }
          } else {
            console.log('✅ [LOGIN] Perfil creado exitosamente');
          }
        } catch (profileError) {
          console.warn('⚠️ [LOGIN] Warning: Usuario creado en Auth pero error creando perfil:', profileError);
        }
      }

      console.log('✅ [LOGIN] Registro exitoso');
      alert('¡Registro exitoso! Ya puedes iniciar sesión.');
      setAuthMode('login'); // Cambiar a modo login
      setSignupData({ email: '', password: '' });

    } catch (err) {
      console.error('❌ [LOGIN] Error inesperado durante registro:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para demo rápido
  const handleQuickDemo = async () => {
    setIsLoading(true);
    console.log('🔍 [LOGIN-DEBUG] === INICIO ACCESO DEMO RÁPIDO ===');
    console.log('🔍 [LOGIN-DEBUG] Estado inicial - authLoading:', authLoading, 'isAuthenticated:', isAuthenticated);

    try {
      console.log('⚡ [LOGIN] Intentando acceso demo');
      console.log('🔍 [LOGIN-DEBUG] Llamando a signIn con credenciales demo...');
      const startTime = Date.now();
      const { data, error } = await signIn('demo@aicodementor.com', 'demo123');
      const duration = Date.now() - startTime;
      console.log(`🔍 [LOGIN-DEBUG] signIn completado en ${duration}ms - data:`, !!data, 'error:', error);

      if (error) {
        console.error('❌ [LOGIN] Error de demo:', error);
        console.log('🔍 [LOGIN-DEBUG] Error details:', JSON.stringify(error));
        alert(`Error de demo: ${error}`);
      } else {
        console.log('✅ [LOGIN] Acceso demo exitoso');
        console.log('🔍 [LOGIN-DEBUG] Estado después de signIn exitoso - authLoading:', authLoading, 'isAuthenticated:', isAuthenticated);
        console.log('🔄 [LOGIN] Esperando actualización de AuthContext para navegación declarativa...');
        console.log('🔍 [LOGIN-DEBUG] useEffect monitoreará cambios en isAuthenticated y authLoading para redirigir');
        // NAVEGACIÓN DECLARATIVA: El useEffect reaccionará a isAuthenticated y redirigirá
        // router.push('/panel-de-control'); ← ELIMINADO: Causaba condición de carrera
      }
    } catch (err) {
      console.error('❌ [LOGIN] Error inesperado en demo:', err);
      console.log('🔍 [LOGIN-DEBUG] Stack trace:', err.stack);
      alert(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
      console.log('🔍 [LOGIN-DEBUG] === FIN ACCESO DEMO RÁPIDO === isLoading:', false);
      console.log('🔍 [LOGIN-DEBUG] Estado final - authLoading:', authLoading, 'isAuthenticated:', isAuthenticated);
    }
  };

  return (
    <>
      <Head>
        <title>Iniciar Sesión | AI Code Mentor</title>
        <meta name="description" content="Accede a tu cuenta de AI Code Mentor - Ecosistema 360" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              AI Code Mentor
            </div>
            <div className="text-sm text-gray-500">
              Ecosistema 360 • Plataforma de Aprendizaje
            </div>
          </div>

          {/* Auth Card */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Toggle entre Login/Signup */}
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


                <div className="pt-4 space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading || authLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-md font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Creando cuenta...' : '✨ Empezar Ahora'}
                  </button>
                </div>

                <div className="text-center text-xs text-gray-500 mt-4 space-y-1">
                  <p>🔒 Tus datos están protegidos • Sin spam</p>
                  <p className="text-gray-400">Al registrarte aceptas los Términos de Uso</p>
                </div>
              </form>
            )}
          </div>

          {/* Footer Link */}
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
    </>
  );
}
