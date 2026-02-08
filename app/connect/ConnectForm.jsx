'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ConnectForm({ user }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialCode = searchParams.get('code') || '';

    const [code, setCode] = useState(initialCode);
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const res = await fetch('/api/auth/device/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_code: code })
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage('¡Conectado! Ya puedes cerrar esta ventana y volver a VS Code.');
            } else {
                setStatus('error');
                setMessage(data.message || 'Error al conectar dispositivo');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Error de red. Intenta nuevamente.');
        }
    };

    return (
        <div className="w-full max-w-md p-8 space-y-6 bg-slate-800/50 rounded-xl border border-slate-700 backdrop-blur-sm shadow-2xl">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-white">Conectar VS Code</h1>
                <p className="text-slate-400">
                    Ingresa el código que aparece en tu editor para autorizar el acceso.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 py-1 px-3 rounded-full w-fit mx-auto border border-emerald-500/20">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Conectando como {user.email}
                </div>
            </div>

            {status === 'success' ? (
                <div className="text-center space-y-4 py-6">
                    <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-medium text-white">¡Autorizado!</h3>
                    <p className="text-slate-300">
                        Tu extensión de VS Code ha sido vinculada exitosamente.
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="code" className="text-sm font-medium text-slate-300">
                            Código de Dispositivo
                        </label>
                        <input
                            id="code"
                            name="code"
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="Ej: A1B2C3D4"
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-mono uppercase placeholder:text-slate-600 text-white transition-all"
                            maxLength={8}
                            required
                            autoFocus={!initialCode}
                            disabled={status === 'loading'}
                        />
                    </div>

                    {message && status === 'error' && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={status === 'loading' || code.length < 8}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 flex justify-center items-center gap-2"
                    >
                        {status === 'loading' ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Verificando...
                            </>
                        ) : (
                            'Autorizar Dispositivo'
                        )}
                    </button>
                </form>
            )}
        </div>
    );
}
