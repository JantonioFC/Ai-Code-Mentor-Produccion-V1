import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth/useAuth';

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' o 'signup'
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', confirmPassword: '' });
  const { signIn, signUp, isAuthenticated, loading: authLoading } = useAuth();

  const resetModal = () => {
    setAuthMode('login');
    setLoginData({ email: '', password: '' });
    setSignupData({ email: '', password: '', confirmPassword: '' });
  };

  // Redireccionar si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/panel-de-control');
    }
  }, [isAuthenticated, router]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setIsLoading(true);
      router.push('/panel-de-control');
    } else {
      setShowLoginModal(true);
    }
  };

  // CÓDIGO CORRECTO - Ejecuta lógica de autenticación
  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await signIn(loginData.email, loginData.password);

      if (error) {
        alert(`Error de autenticación: ${error}`);
      } else {
        setShowLoginModal(false);
        setLoginData({ email: '', password: '' });
        router.push('/panel-de-control');
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    // Validar contraseñas coincidan
    if (signupData.password !== signupData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    // Validar longitud mínima contraseña
    if (signupData.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      // Paso 1: Crear usuario en Supabase Auth
      const { data, error } = await signUp(signupData.email, signupData.password, {
        display_name: signupData.email.split('@')[0]
      });

      if (error) {
        alert(`Error de registro: ${error}`);
        return;
      }

      // Paso 2: CRÍTICO - Crear perfil en nuestra base de datos
      if (data.user) {
        // CORRECCIÓN: Esperar a que la sesión se propague
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
          const profileResponse = await fetch('/api/profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // CRÍTICO: Incluir token de autorización
              'Authorization': `Bearer ${data.session?.access_token}`,
            },
            body: JSON.stringify({
              display_name: signupData.email.split('@')[0],
              email: signupData.email,
            }),
          });

          const profileResult = await profileResponse.json();

          if (!profileResult.success) {
            console.warn('Warning: Usuario creado en Auth pero error en perfil:', profileResult.error);
            // RETRY: Intentar una vez más tras 2 segundos
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
              console.warn('Warning: Retry también falló:', retryResult.error);
            }
          }
        } catch (profileError) {
          console.warn('Warning: Usuario creado en Auth pero error creando perfil:', profileError);
        }
      }

      alert('¡Registro exitoso! Ya puedes iniciar sesión.');
      setAuthMode('login'); // Cambiar a modo login
      setSignupData({ email: '', password: '', confirmPassword: '' });

    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setIsLoading(true);
    try {
      // Credenciales de demo para testing rápido
      const { data, error } = await signIn('demo@aicodementor.com', 'demo123');

      if (error) {
        alert(`Error de demo: ${error}`);
      } else {
        setShowLoginModal(false);
        // CORRECCIÓN: Redirección directa a panel de control
        router.push('/panel-de-control');
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>AI Code Mentor - Ecosistema 360 | Plataforma de Aprendizaje Completa</title>
        <meta name="description" content="Plataforma completa de aprendizaje autogestionado basada en metodología Ecosistema 360. Simbiosis Crítica Humano-IA para desarrollo full stack." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="AI Code Mentor - Ecosistema 360 | Plataforma Educativa Completa" />
        <meta property="og:description" content="Metodología de Andamiaje Decreciente • Simbiosis Crítica Humano-IA • 24 meses de curriculum estructurado" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/ai-code-mentor-preview.png" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI Code Mentor - Ecosistema 360" />
        <meta name="twitter:description" content="Plataforma de aprendizaje completa con metodología educativa universitaria" />

        {/* Fonts optimizados via next/font/google en _app.js */}
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Logo Topbar */}
        <div className="w-full bg-gray-900">
          <img
            src="/logo.jpg"
            alt="AI Code Mentor - Ecosistema 360"
            className="w-full h-auto max-h-24 object-contain"
          />
        </div>

        {/* Navigation Header */}
        <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Code Mentor
                </div>
                <div className="hidden sm:block text-sm text-gray-500">
                  • Ecosistema 360
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Zona Pública
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            {/* Main Title */}
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Code Mentor
              </span>
            </h1>

            <div className="mb-8">
              <p className="text-2xl md:text-3xl text-gray-600 mb-4 font-medium">
                Plataforma de Aprendizaje Completa
              </p>
            </div>

            {/* CTA Button - ÚNICO PUNTO DE ACCESO */}
            <div className="flex flex-col items-center justify-center mb-12">
              <button
                onClick={handleGetStarted}
                disabled={isLoading}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:transform-none"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Accediendo a la plataforma...
                  </span>
                ) : (
                  '🚀 Acceder a la Plataforma'
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Curriculum Phases */}
        <section className="py-16 px-4 bg-white/50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
              📚 Curriculum de 24 Meses (8 Fases)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { id: 0, name: 'Cimentación', duration: '3-4 meses', focus: 'IA Crítica + CS50', color: 'from-gray-500 to-slate-600', months: '0' },
                { id: 1, name: 'Fundamentos', duration: '6 meses', focus: 'Python + Metodología', color: 'from-blue-500 to-cyan-500', months: '1-6' },
                { id: 2, name: 'Frontend', duration: '5 meses', focus: 'HTML/CSS/JS/React', color: 'from-green-500 to-emerald-500', months: '7-11' },
                { id: 3, name: 'Backend', duration: '5 meses', focus: 'APIs + Databases', color: 'from-purple-500 to-violet-500', months: '12-16' },
                { id: 4, name: 'DevOps', duration: '4 meses', focus: 'Containers + CI/CD', color: 'from-orange-500 to-red-500', months: '17-20' },
                { id: 5, name: 'IA/Data', duration: '2 meses', focus: 'ML + Analytics', color: 'from-pink-500 to-rose-500', months: '21-22' },
                { id: 6, name: 'Especialización', duration: '2 meses', focus: 'Advanced Topics', color: 'from-teal-500 to-cyan-600', months: '23' },
                { id: 7, name: 'Integración', duration: '2 meses', focus: 'Capstone + Portfolio', color: 'from-indigo-500 to-blue-600', months: '24' }
              ].map((phase) => (
                <div key={phase.id} className="bg-white rounded-lg p-6 border border-gray-200 text-center hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r ${phase.color} flex items-center justify-center text-white font-bold`}>
                    F{phase.id}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">{phase.name}</h3>
                  <p className="text-sm text-gray-600 mb-1">{phase.duration}</p>
                  <p className="text-sm text-blue-600 font-medium">{phase.focus}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Educational Value Proposition - SIN REDUNDANCIA */}
        <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              Metodología Educativa Profesional
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Ecosistema 360 • Simbiosis Crítica Humano-IA • Andamiaje Decreciente
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold mb-4">🎆 Sistema Completo Operativo
              </h3>
              <div className="text-sm text-blue-100 space-y-2">
                <p>✅ <strong>Módulos:</strong> Carga .md → Lecciones IA + Base de datos</p>
                <p>✅ <strong>Plantillas:</strong> DDE, PAS, HRC, IRP + Referencias cruzadas</p>
                <p>✅ <strong>Portfolio:</strong> Export PDF/GitHub + Reset System + Archival</p>
                <p>✅ <strong>Analytics:</strong> Progreso multidimensional + Visualización</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-bold mb-4">AI Code Mentor</h3>
                <p className="text-gray-400 text-sm">
                  Plataforma completa de aprendizaje autogestionado con metodología Ecosistema 360
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Metodología</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>• Simbiosis Crítica Humano-IA</li>
                  <li>• Andamiaje Decreciente</li>
                  <li>• Portfolio Basado en Evidencias</li>
                  <li>• 6 Fases Curriculares</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Sistema Completo</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>• Gestión de Módulos</li>
                  <li>• Plantillas Educativas</li>
                  <li>• Portfolio Management</li>
                  <li>• Analytics y Progreso</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-8 text-center">
              <p className="text-sm text-gray-400">
                © 2025 AI Code Mentor - Herramienta Personal de Aprendizaje Autogestionado
              </p>
              <p className="text-sm text-blue-400 mt-2">
                🎯 <strong>ECOSISTEMA 360 COMPLETE:</strong> Metodología educativa • Portfolio profesional • Gestión de ciclos • 24 meses curriculum
              </p>
            </div>
          </div>
        </footer>

        {/* Modal de Autenticación - CON REGISTRO COMPLETO */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-md w-full relative">
              <button
                onClick={() => { setShowLoginModal(false); resetModal(); }}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>

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

              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                {authMode === 'login' ? '🚀 Acceder a AI Code Mentor' : '✨ Crear Nueva Cuenta'}
              </h2>

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
            </div>
          </div>
        )}
      </main>
    </>
  );
}
