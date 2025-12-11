/**
 * Private Layout Component - Zona Privada Navigation
 * Layout container for all authenticated user views
 * Part of UI Re-Architecture - Ecosistema 360 Integration
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../../lib/auth/useAuth';
import { TemplateModal } from '../ProjectTracking';
import APIUsageCounter from '../APIUsageCounter';

// Dominios disponibles para el selector
const STUDY_DOMAINS = [
  { value: 'programming', label: '🖥️ Programación', description: 'Código y desarrollo' },
  { value: 'logic', label: '🧠 Lógica', description: 'Lógica proposicional' },
  { value: 'databases', label: '🗄️ Bases de Datos', description: 'SQL y modelo ER' },
  { value: 'math', label: '📐 Matemáticas', description: 'Álgebra y cálculo' }
];

const PrivateLayout = ({ children, title = "AI Code Mentor", description = "Ecosistema 360 - Plataforma Educativa" }) => {
  const router = useRouter();
  const { signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [studyDomain, setStudyDomain] = useState('programming');

  // Cargar dominio guardado al montar
  useEffect(() => {
    const savedDomain = localStorage.getItem('studyDomain');
    if (savedDomain && STUDY_DOMAINS.find(d => d.value === savedDomain)) {
      setStudyDomain(savedDomain);
    }
  }, []);

  // Manejador de cambio de dominio con persistencia
  const handleDomainChange = (e) => {
    const newDomain = e.target.value;
    setStudyDomain(newDomain);
    localStorage.setItem('studyDomain', newDomain);
    // Emitir evento para que otros componentes reaccionen
    window.dispatchEvent(new CustomEvent('domainChange', { detail: { domain: newDomain } }));
  };

  const navigation = [
    {
      name: 'Panel de Control',
      href: '/panel-de-control',
      icon: '📊',
      description: 'Dashboard y métricas principales',
      badge: null
    },
    {
      name: 'Plantillas',
      href: '/plantillas',
      icon: '📋',
      description: 'DDE • PAS • HRC',
      badge: null
    },
    {
      name: 'Analíticas',
      href: '/analiticas',
      icon: '📈',
      description: 'Estadísticas detalladas',
      badge: null
    },
    {
      name: 'Módulos',
      href: '/modulos',
      icon: '📚',
      description: 'Generación de lecciones',
      badge: null
    },
    {
      name: 'Portfolio',
      href: '/portfolio',
      icon: '📄',
      description: 'Export y gestión de ciclos',
      badge: null
    },
    {
      name: 'Código',
      href: '/codigo',
      icon: '🔍',
      description: 'Análisis y mejora IA',
      badge: null
    },
    {
      name: 'Revisor de Código con IA',
      href: '/peer-review',
      icon: '🤖',
      description: 'Recibe análisis automatizado de tu código',
      badge: null
    }
  ];

  const isActive = (href) => {
    return router.pathname === href;
  };

  const handleNavigation = (href) => {
    router.push(href);
    setIsSidebarOpen(false); // Close mobile sidebar after navigation
  };

  // MISIÓN 182.4: Función controladora de logout CON TRANSICIÓN MEJORADA
  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // MEJORA: Forzar redirección PRIMERO para evitar 401s durante la transición
      // Las llamadas a APIs protegidas se cancelarán antes de ejecutarse
      await router.push('/');

      // Luego cerrar la sesión de Supabase (las cookies se limpian)
      const { error } = await signOut();

      if (error) {
        console.error('Error durante el logout:', error);
        // No alertar, la redirección ya ocurrió
      }

    } catch (err) {
      console.error('Error inesperado durante logout:', err);
      // Forzar navegación en caso de error
      window.location.href = '/';
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />

        {/* Fonts optimizados via next/font/google en _app.js */}
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Logo Topbar */}
        <div className="w-full bg-gray-900">
          <img
            src="/logo.jpg"
            alt="AI Code Mentor - Ecosistema 360"
            className="w-full h-auto max-h-24 object-contain"
          />
        </div>

        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo and Title */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                <div className="flex items-center space-x-3">
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    AI Code Mentor
                  </div>
                  <div className="hidden sm:block text-sm text-gray-500">
                    • Ecosistema 360
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-4">

                <button
                  onClick={() => router.push('/')}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  ← Volver al inicio
                </button>

                {/* MISIÓN 182.4: Botón de Cerrar Sesión */}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-sm text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Cerrar sesión y regresar al inicio"
                >
                  {isLoggingOut ? '⏳ Cerrando...' : '🔐 Cerrar Sesión'}
                </button>

                <div className="hidden sm:block text-sm text-gray-500">
                  Zona Privada
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar Navigation - Desktop */}
          <nav className="hidden md:block w-64 bg-white border-r border-gray-200 min-h-screen">
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Navegación Principal
                </h3>
              </div>

              <div className="space-y-2">
                {navigation.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => handleNavigation(item.href)}
                    className={`w-full text-left flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-premium relative group ${isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-500/10 to-purple-600/10 text-blue-700 shadow-sm sidebar-active-indicator border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover-lift'
                      }`}
                  >
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                        {item.badge}
                      </span>
                    )}

                    <span className={`text-lg mr-3 transition-transform duration-300 ${isActive(item.href) ? 'scale-110 drop-shadow-md' : 'group-hover:scale-110 text-gray-400 group-hover:text-blue-500'}`}>{item.icon}</span>
                    <div className="flex-1">
                      <div className={`font-medium ${isActive(item.href) ? 'font-bold' : ''}`}>{item.name}</div>
                      <div className={`text-xs mt-0.5 transition-colors ${isActive(item.href) ? 'text-blue-600/80' : 'text-gray-400 group-hover:text-gray-500'
                        }`}>
                        {item.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* API Usage Counter - En sidebar */}
              <div className="mt-6">
                <APIUsageCounter position="sidebar" />
              </div>

              {/* Educational Context */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  🎯 Zona Privada
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Interfaz unificada con vistas especializadas para maximizar tu productividad educativa
                </p>
                <div className="mt-2 text-xs text-blue-600">
                  Metodología Ecosistema 360
                </div>
              </div>
            </div>
          </nav>

          {/* Mobile Sidebar Overlay */}
          {isSidebarOpen && (
            <div className="md:hidden fixed inset-0 z-50 flex">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsSidebarOpen(false)}></div>

              <nav className="relative w-64 bg-white border-r border-gray-200 h-full overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                      Navegación
                    </h3>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {navigation.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => handleNavigation(item.href)}
                        className={`w-full text-left flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive(item.href)
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                      >
                        <span className="text-lg mr-3">{item.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className={`text-xs mt-0.5 ${isActive(item.href) ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                            {item.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </nav>
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>

        {/* Global Components - Available in all private views */}
        <TemplateModal />
      </div>
    </>
  );
};

export default PrivateLayout;
