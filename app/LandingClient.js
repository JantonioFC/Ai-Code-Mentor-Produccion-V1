'use client';

import { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '../lib/auth/useAuth';
import { Analytics } from '../lib/analytics';

// Carga perezosa del AuthModal
const AuthModal = dynamic(() => import('../components/auth/AuthModal'), {
    ssr: false,
    loading: () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="bg-white p-4 rounded shadow">Cargando formulario...</div>
        </div>
    )
});

/**
 * Landing Page Client Component
 * Contiene toda la lógica interactiva de la página de aterrizaje.
 */
export default function LandingClient() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [signupData, setSignupData] = useState({ email: '', password: '', confirmPassword: '' });
    const { signIn, signUp, isAuthenticated, loading: authLoading } = useAuth();

    const resetModal = () => {
        setAuthMode('login');
        setLoginData({ email: '', password: '' });
        setSignupData({ email: '', password: '', confirmPassword: '' });
    };

    useEffect(() => {
        if (!isAuthenticated) {
            Analytics.track('landing_viewed', {
                referrer: typeof document !== 'undefined' ? document.referrer : '',
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
                Analytics.track('signup_failed', { error });
                return;
            }

            Analytics.track('signup_completed', { method: 'email' });
            Analytics.identify(data.user?.id, { email: data.user?.email });

            alert('¡Registro exitoso! Ya puedes iniciar sesión.');
            setAuthMode('login');
            setSignupData({ email: '', password: '', confirmPassword: '' });
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
        <main className="min-h-screen bg-[#0F1115] text-[#EDEDED] font-sans selection:bg-[#3B82F6] selection:text-white">
            {/* Logo Topbar */}
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

            {/* Navigation Header */}
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
                            <div className="text-xs font-mono text-[#94A3B8]">STATUS: ONLINE</div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-5xl md:text-7xl font-mono font-bold text-white mb-6 tracking-tight">
                        <span className="text-[#3B82F6]">{`>`}</span> SYSTEM_LEARNING
                    </h1>
                    <div className="mb-10">
                        <p className="text-xl md:text-2xl text-[#94A3B8] max-w-2xl mx-auto font-light leading-relaxed">
                            Plataforma de andamiaje decreciente para ingeniería de software.
                            <span className="block mt-2 text-[#4F6180] text-sm font-mono">[ Simbiosis Crítica Humano-IA establecida ]</span>
                        </p>
                    </div>
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

            {/* Curriculum Phases */}
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

            {/* Core Protocol */}
            <section className="py-20 px-4 bg-[#0F1115] border-t border-[#1F2532]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-mono font-bold mb-8 text-white">
                        <span className="text-[#10B981]">{`>`}</span> CORE_PROTOCOL
                    </h2>
                    <div className="bg-[#161A23] border border-[#2D3748] rounded-sm p-8 max-w-2xl mx-auto text-left relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3B82F6] to-[#10B981]"></div>
                        <h3 className="text-sm font-mono font-bold text-[#4F6180] mb-6 uppercase tracking-wider">{'// SYSTEM_CAPABILITIES'}</h3>
                        <div className="space-y-4 font-mono text-sm text-[#EDEDED]">
                            <p className="flex items-center"><span className="text-[#10B981] mr-3">✔</span> MODULES: .MD_LOADER {'->'} AI_LESSONS</p>
                            <p className="flex items-center"><span className="text-[#10B981] mr-3">✔</span> TEMPLATES: DDE, PAS, HRC, IRP</p>
                            <p className="flex items-center"><span className="text-[#10B981] mr-3">✔</span> PORTFOLIO: GITHUB_SYNC + PDF_EXPORT</p>
                            <p className="flex items-center"><span className="text-[#10B981] mr-3">✔</span> ANALYTICS: MULTIDIMENSIONAL_TRACKING</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 bg-[#0F1115] border-t border-[#1F2532] text-[#94A3B8]">
                <div className="max-w-7xl mx-auto text-center font-mono text-xs text-[#4F6180]">
                    <p>© 2026 AI_CODE_MENTOR [SYSTEM_V3.0]</p>
                    <p className="mt-2 text-[#3B82F6]">STATUS: OPTIMAL</p>
                </div>
            </footer>

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
    );
}
