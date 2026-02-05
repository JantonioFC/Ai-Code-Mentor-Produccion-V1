import React, { useState, useEffect } from 'react';
import { useAPITracking } from '../../contexts/APITrackingContext';

export default function ModelSettings() {
    const [isOpen, setIsOpen] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [provider, setProvider] = useState('gemini'); // 'gemini' or 'openrouter'
    const [model, setModel] = useState('anthropic/claude-3.5-sonnet');
    const [saved, setSaved] = useState(false);

    // Load settings from localStorage on mount
    useEffect(() => {
        const storedKey = localStorage.getItem('openrouter_key');
        const storedProvider = localStorage.getItem('ai_provider');
        const storedModel = localStorage.getItem('openrouter_model');

        if (storedKey) setApiKey(storedKey);
        if (storedProvider) setProvider(storedProvider);
        if (storedModel) setModel(storedModel);
    }, []);

    const handleSave = () => {
        if (provider === 'openrouter' && !apiKey.startsWith('sk-or-')) {
            alert('Por favor ingresa una API Key válida de OpenRouter (empieza con sk-or-)');
            return;
        }

        localStorage.setItem('openrouter_key', apiKey);
        localStorage.setItem('ai_provider', provider);
        localStorage.setItem('openrouter_model', model);

        // Trigger explicit event for Router usage (if needed, though localStorage is sync)
        window.dispatchEvent(new Event('ai-settings-changed'));

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        setIsOpen(false);
    };

    const clearSettings = () => {
        localStorage.removeItem('openrouter_key');
        localStorage.removeItem('ai_provider');
        localStorage.removeItem('openrouter_model');
        setApiKey('');
        setProvider('gemini');
        setModel('anthropic/claude-3.5-sonnet');
        window.dispatchEvent(new Event('ai-settings-changed'));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="text-xs text-gray-500 hover:text-blue-600 transition-smooth-ui flex items-center gap-1"
                title="Configurar Modelo AI"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Ajustes AI</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-xl">⚙️</span> Configuración de IA
                    </h3>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* Provider Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Proveedor de Inteligencia</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setProvider('gemini')}
                                className={`p-3 rounded-lg border-2 text-left transition-smooth-ui ${provider === 'gemini'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="font-bold text-sm">Gemini Free</div>
                                <div className="text-xs opacity-75">Gestionado por plataforma</div>
                            </button>

                            <button
                                onClick={() => setProvider('openrouter')}
                                className={`p-3 rounded-lg border-2 text-left transition-smooth-ui ${provider === 'openrouter'
                                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="font-bold text-sm">OpenRouter</div>
                                <div className="text-xs opacity-75">Bring Your Own Key</div>
                            </button>
                        </div>
                    </div>

                    {/* OpenRouter Config */}
                    {provider === 'openrouter' && (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    OpenRouter API Key
                                </label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="sk-or-v1-..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-smooth-ui"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Se guarda localmente en tu navegador. Nunca se envía a nuestros servidores.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Modelo
                                </label>
                                <select
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                                >
                                    <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                                    <option value="openai/gpt-4o">GPT-4o</option>
                                    <option value="meta-llama/llama-3-70b-instruct">Llama 3 70B</option>
                                    <option value="deepseek/deepseek-coder">DeepSeek Coder</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Gemini Info */}
                    {provider === 'gemini' && (
                        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 animate-in slide-in-from-top-2">
                            <p>Estás utilizando el <strong>Nivel Gratuito Optimizado</strong>.</p>
                            <p className="mt-1 opacity-80">El sistema selecciona automáticamente el mejor modelo Gemini disponible (actualmente Gemini 2.5 Flash).</p>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                    <button
                        onClick={clearSettings}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline"
                    >
                        Resetear configuración
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className={`px-6 py-2 rounded-lg font-bold text-white shadow-md transition-transform active:scale-95 ${provider === 'openrouter' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {saved ? '¡Guardado!' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
