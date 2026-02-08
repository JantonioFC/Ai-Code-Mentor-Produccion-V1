import Head from 'next/head';
import Image from 'next/image'; // Optimización de Imágenes
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic'; // Code Splitting
import { useAuth } from '../lib/auth/useAuth';

// Carga perezosa del AuthModal (Code Splitting)
const AuthModal = dynamic(() => import('../components/auth/AuthModal'), {
  ssr: false, // El modal es interactivo puro, no necesita SSR
  loading: () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"><div className="bg-white p-4 rounded shadow">Cargando formulario...</div></div>
});

import { Analytics } from '../lib/analytics';

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' o 'signup'
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '' });
  const { signIn, signUp, isAuthenticated, loading: authLoading } = useAuth();

  const resetModal = () => {
    setAuthMode('login');
    setLoginData({ email: '', password: '' });
    setSignupData({ email: '', password: '' });
  };

  // Redireccionar si ya está autenticado
  useEffect(() => {
    // Analytics: Landing View
    if (!isAuthenticated) {
      Analytics.track('landing_viewed', {
        referrer: document.referrer,
        auth_status: 'guest'
      });
    }

    if (isAuthenticated) {
      router.push('/panel-de-control');
    }
  }, [isAuthenticated, router]);

  const handleGetStarted = () => {
    Analytics.track('cta_clicked', { button: 'get_started' });
    if (isAuthenticated) {
      setIsLoading(true);
      router.push('/panel-de-control');
    } else {
      setShowLoginModal(true);
      Analytics.track('auth_modal_opened', { mode: 'login' });
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await signIn(loginData.email, loginData.password);

      if (error) {
        alert(`Error de autenticación: ${error}`);
        Analytics.track('login_failed', { error });
      } else {
        Analytics.track('login_completed', { method: 'email' });
        Analytics.identify(data.user?.id, { email: data.user?.email });

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
        Analytics.track('signup_failed', { error });
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
            // RETRY logic...
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

      Analytics.track('signup_completed', { method: 'email' });
      Analytics.identify(data.user?.id, { email: data.user?.email });

      alert('¡Registro exitoso! Ya puedes iniciar sesión.');
      setAuthMode('login'); // Cambiar a modo login
      setSignupData({ email: '', password: '' });

    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setIsLoading(true);
    Analytics.track('demo_login_started');
    try {
      const { data, error } = await signIn('demo@aicodementor.com', 'demo123');

      if (error) {
        alert(`Error de demo: ${error}`);
        Analytics.track('demo_login_failed', { error });
      } else {
        Analytics.track('demo_login_completed');
        Analytics.identify('demo_user', { email: 'demo@aicodementor.com' });

        setShowLoginModal(false);
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
        <meta property="og:title" content="AI Code Mentor - Ecosistema 360 | Plataforma Educativa Completa" />
        <meta property="og:description" content="Metodología de Andamiaje Decreciente • Simbiosis Crítica Humano-IA • 24 meses de curriculum estructurado" />
        <meta property="og:image" content="/ai-code-mentor-preview.png" />
      </Head>

      <main className="min-h-screen bg-[#0F1115] text-[#EDEDED] font-sans selection:bg-[#3B82F6] selection:text-white">
        {/* Logo Topbar - Industrial: Border Bottom */}
        <div className="w-full bg-[#161A23] border-b border-[#2D3748] relative h-24">
          <Image
            src="/logo.jpg"
            alt="AI Code Mentor - Ecosistema 360"
            fill
            style={{ objectFit: 'contain' }}
            priority
            className="opacity-90"
          />
        </div>

        {/* Navigation Header - Industrial: Glass & Border */}
        <nav className="bg-[#161A23]/90 backdrop-blur-md border-b border-[#2D3748] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="text-xl font-mono font-bold text-[#3B82F6] tracking-tighter">
                  AI_CODE_MENTOR
                </div>
                <div className="hidden sm:block text-xs font-mono text-[#4F6180] bg-[#1F2532] px-2 py-1 rounded">
                  ECOSISTEMA_V360
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-xs font-mono text-[#94A3B8]">
                  STATUS: ONLINE
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section - Industrial: High Contrast, No Gradients */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            {/* Main Title - Mono & Sharp */}
            <h1 className="text-5xl md:text-7xl font-mono font-bold text-white mb-6 tracking-tight">
              <span className="text-[#3B82F6]">{`>`}</span> SYSTEM_LEARNING
            </h1>

            <div className="mb-10">
              <p className="text-xl md:text-2xl text-[#94A3B8] max-w-2xl mx-auto font-light leading-relaxed">
                Plataforma de andamiaje decreciente para ingeniería de software.
                <span className="block mt-2 text-[#4F6180] text-sm font-mono">
                  [ Simbiosis Crítica Humano-IA establecida ]
                </span>
              </p>
            </div>

            {/* CTA Button - Industrial: Sharp, Technical */}
            <div className="flex flex-col items-center justify-center mb-16">
              <button
                onClick={handleGetStarted}
                disabled={isLoading}
                className="group relative w-full sm:w-auto bg-[#3B82F6] text-white px-8 py-4 rounded-sm text-lg font-mono font-medium hover:bg-[#2563EB] transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-white/10 group-hover:translate-x-full transition-transform duration-300 transform -translate-x-full skew-x-12"></div>
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-pulse mr-2">█</span> INITIALIZING...
                  </span>
                ) : (
                  <span className="flex items-center">
                    INITIALIZE_PLATFORM <span className="ml-2">_</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Curriculum Phases - Industrial: Grid & Technical Panels */}
        <section className="py-16 px-4 bg-[#0F1115] border-t border-[#1F2532]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-mono font-bold text-center text-white mb-12">
              <span className="text-[#3B82F6]">./</span> CURRICULUM_ROADMAP
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { id: 0, name: 'CIMENTACION', duration: '3-4 MO', focus: 'CRITICAL_THINKING', color: 'text-gray-400' },
                { id: 1, name: 'FUNDAMENTOS', duration: '6 MO', focus: 'PYTHON_CORE', color: 'text-blue-400' },
                { id: 2, name: 'FRONTEND', duration: '5 MO', focus: 'REACT_ECOSYSTEM', color: 'text-green-400' },
                { id: 3, name: 'BACKEND', duration: '5 MO', focus: 'API_ARCHITECTURE', color: 'text-purple-400' },
                { id: 4, name: 'DEVOPS', duration: '4 MO', focus: 'CI_CD_PIPELINES', color: 'text-orange-400' },
                { id: 5, name: 'DATA_AI', duration: '2 MO', focus: 'ML_ANALYTICS', color: 'text-pink-400' },
                { id: 6, name: 'SPECIALIZATION', duration: '2 MO', focus: 'ADVANCED_TOPICS', color: 'text-cyan-400' },
                { id: 7, name: 'INTEGRATION', duration: '2 MO', focus: 'CAPSTONE_PROJECT', color: 'text-indigo-400' }
              ].map((phase) => (
                <div key={phase.id} className="bg-[#161A23] border border-[#2D3748] p-6 hover:border-[#3B82F6] transition-colors group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-mono text-xs text-[#4F6180]">F0{phase.id}</span>
                    <div className={`w-2 h-2 rounded-full ${phase.color.replace('text', 'bg')}`}></div>
                  </div>
                  <h3 className="font-mono font-bold text-white mb-2 tracking-wide">{phase.name}</h3>
                  <div className="flex flex-col space-y-1">
                    <code className="text-xs text-[#94A3B8]">{`>`} {phase.duration}</code>
                    <code className={`text-xs ${phase.color}`}>{`>`} {phase.focus}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Educational Value Proposition - Industrial: Dark & Terminal Style */}
        <section className="py-20 px-4 bg-[#0F1115] border-t border-[#1F2532]">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-mono font-bold mb-8 text-white">
              <span className="text-[#10B981]">{`>`}</span> CORE_PROTOCOL
            </h2>
            <p className="text-lg mb-10 text-[#94A3B8] font-light">
              Ecosistema 360 • Simbiosis Crítica Humano-IA • Andamiaje Decreciente
            </p>

            <div className="bg-[#161A23] border border-[#2D3748] rounded-sm p-8 max-w-2xl mx-auto text-left relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3B82F6] to-[#10B981]"></div>
              <h3 className="text-sm font-mono font-bold text-[#4F6180] mb-6 uppercase tracking-wider">
                {'// SYSTEM_CAPABILITIES'}
              </h3>
              <div className="space-y-4 font-mono text-sm text-[#EDEDED]">
                <p className="flex items-center"><span className="text-[#10B981] mr-3">✔</span> MODULES: .MD_LOADER {'->'} AI_LESSONS</p>
                <p className="flex items-center"><span className="text-[#10B981] mr-3">✔</span> TEMPLATES: DDE, PAS, HRC, IRP</p>
                <p className="flex items-center"><span className="text-[#10B981] mr-3">✔</span> PORTFOLIO: GITHUB_SYNC + PDF_EXPORT</p>
                <p className="flex items-center"><span className="text-[#10B981] mr-3">✔</span> ANALYTICS: MULTIDIMENSIONAL_TRACKING</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer - Industrial: Minimal & Clean */}
        <footer className="py-12 px-4 bg-[#0F1115] border-t border-[#1F2532] text-[#94A3B8]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div>
                <h3 className="text-lg font-mono font-bold text-white mb-4">AI_CODE_MENTOR</h3>
                <p className="text-sm font-light leading-relaxed max-w-xs">
                  Plataforma completa de aprendizaje autogestionado con metodología Ecosistema 360.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-mono font-bold text-[#4F6180] mb-4 uppercase">METHODOLOGY</h4>
                <ul className="space-y-2 text-sm">
                  <li className="hover:text-[#3B82F6] cursor-pointer transition-colors">Simbiosis Crítica</li>
                  <li className="hover:text-[#3B82F6] cursor-pointer transition-colors">Andamiaje Decreciente</li>
                  <li className="hover:text-[#3B82F6] cursor-pointer transition-colors">Portfolio Based</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-mono font-bold text-[#4F6180] mb-4 uppercase">SYSTEM</h4>
                <ul className="space-y-2 text-sm">
                  <li className="hover:text-[#3B82F6] cursor-pointer transition-colors">Module Manager</li>
                  <li className="hover:text-[#3B82F6] cursor-pointer transition-colors">Analytics Engine</li>
                  <li className="hover:text-[#3B82F6] cursor-pointer transition-colors">Documentation</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-[#1F2532] pt-8 text-center font-mono text-xs text-[#4F6180]">
              <p>
                © 2026 AI_CODE_MENTOR [SYSTEM_V3.0]
              </p>
              <p className="mt-2 text-[#3B82F6]">
                STATUS: OPTIMAL
              </p>
            </div>
          </div>
        </footer>

        {/* Modal de Autenticación - Cargado dinámicamente */}
        {showLoginModal && (
          <AuthModal
            authMode={authMode}
            setAuthMode={setAuthMode}
            loginData={loginData}
            setLoginData={setLoginData}
            signupData={signupData}
            setSignupData={setSignupData}
            handleLoginSubmit={handleLoginSubmit}
            handleSignupSubmit={handleSignupSubmit}
            handleQuickDemo={handleQuickDemo}
            onClose={() => { setShowLoginModal(false); resetModal(); }}
            isLoading={isLoading}
            authLoading={authLoading}
          />
        )}
      </main>
    </>
  );
}
