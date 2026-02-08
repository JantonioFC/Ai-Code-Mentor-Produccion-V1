'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Check if user has already consented
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            setShow(true);
        }
    }, []);

    const accept = () => {
        localStorage.setItem('cookie_consent', 'true');
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 shadow-2xl z-50">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-gray-300 text-sm">
                    <p>
                        🍪 Usamos cookies para mejorar tu experiencia y analizar el tráfico.
                        Al continuar navegando, aceptas nuestra{' '}
                        <Link href="/privacy-policy" className="text-blue-400 hover:text-blue-300 underline">
                            Política de Privacidad
                        </Link>.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={accept}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors"
                    >
                        Aceptar
                    </button>
                </div>
            </div>
        </div>
    );
}
