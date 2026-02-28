/**
 * PrivateLayoutBase - Componente Base Agnóstico para Zona Privada
 * 
 * Este componente contiene toda la lógica de UI y estado compartido,
 * pero no depende directamente de hooks de enrutamiento específicos de Next.js.
 * Recibe el router y el pathname como props desde wrappers específicos.
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useAuth } from '../../lib/auth/useAuth';
import Link from 'next/link';
import { TemplateModal } from '../ProjectTracking';
import APIUsageCounter from '../APIUsageCounter';

const STUDY_DOMAINS = [
    { value: 'programming', label: '🖥️ Programación', description: 'Código y desarrollo' },
    { value: 'logic', label: '🧠 Lógica', description: 'Lógica proposicional' },
    { value: 'databases', label: '🗄️ Bases de Datos', description: 'SQL y modelo ER' },
    { value: 'math', label: '📐 Matemáticas', description: 'Álgebra y cálculo' }
];

const PrivateLayoutBase = ({ children, title = "AI Code Mentor", description = "Ecosistema 360 - Plataforma Educativa", router, pathname }) => {
    const { signOut } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [studyDomain, setStudyDomain] = useState('programming');

    useEffect(() => {
        const savedDomain = localStorage.getItem('studyDomain');
        if (savedDomain && STUDY_DOMAINS.find(d => d.value === savedDomain)) {
            setStudyDomain(savedDomain);
        }
    }, []);

    const handleDomainChange = (e) => {
        const newDomain = e.target.value;
        setStudyDomain(newDomain);
        localStorage.setItem('studyDomain', newDomain);
        window.dispatchEvent(new CustomEvent('domainChange', { detail: { domain: newDomain } }));
    };

    const navigation = [
        { name: 'Panel de Control', href: '/panel-de-control', icon: '📊', description: 'Dashboard y métricas principales' },
        { name: 'Plantillas', href: '/plantillas', icon: '📋', description: 'DDE • PAS • HRC' },
        { name: 'Analíticas', href: '/analiticas', icon: '📈', description: 'Estadísticas detalladas' },
        { name: 'Módulos', href: '/modulos', icon: '📚', description: 'Generación de lecciones' },
        { name: 'Portfolio', href: '/portfolio', icon: '📄', description: 'Export y gestión de ciclos' },
        { name: 'Código', href: '/codigo', icon: '🔍', description: 'Análisis y mejora IA' },
        { name: 'Revisor de Código con IA', href: '/peer-review', icon: '🤖', description: 'Recibe análisis automatizado de tu código' }
    ];

    const isActive = (href) => pathname === href;

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            if (typeof window !== 'undefined') {
                window.location.href = '/';
            }
            await signOut();
        } catch (err) {
            console.error('Error inesperado durante logout:', err);
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
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="w-full bg-gray-900 relative h-24 border-b border-gray-800">
                    <Image src="/logo.png" alt="AI Code Mentor" fill className="object-cover" priority />
                </div>

                <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center space-x-4">
                                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                </button>
                                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI Code Mentor</div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button onClick={() => router.push('/')} className="text-sm text-gray-600 hover:text-gray-900">← Volver al inicio</button>
                                <button onClick={handleLogout} disabled={isLoggingOut} className="text-sm text-red-600 disabled:opacity-50">{isLoggingOut ? '⏳ Cerrando...' : '🔐 Cerrar Sesión'}</button>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex">
                    <nav className="hidden md:block w-64 bg-white border-r border-gray-200 min-h-screen p-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Navegación Principal</h3>
                        <div className="space-y-2">
                            {navigation.map((item) => (
                                <Link key={item.href} href={item.href} className={`w-full flex items-center px-4 py-3 rounded-lg text-sm transition-all ${isActive(item.href) ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                                    <span className="text-lg mr-3">{item.icon}</span>
                                    <div>
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-xs text-gray-400">{item.description}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <div className="mt-6"><APIUsageCounter position="sidebar" /></div>
                    </nav>

                    <main className="flex-1 p-6">{children}</main>
                </div>
                <TemplateModal />
            </div>
        </>
    );
};

export default PrivateLayoutBase;
