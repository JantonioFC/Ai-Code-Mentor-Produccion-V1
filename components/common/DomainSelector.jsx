/**
 * Componente Selector de Dominio de Estudio
 * Permite cambiar entre Programación, Lógica, Bases de Datos, Matemáticas
 * 
 * @component DomainSelector
 */

import { useState, useEffect } from 'react';

/**
 * Dominios disponibles
 */
const DOMAINS = [
    { id: 'programming', name: 'Programación', icon: '🖥️' },
    { id: 'logic', name: 'Lógica', icon: '🧠' },
    { id: 'databases', name: 'Bases de Datos', icon: '🗄️' },
    { id: 'math', name: 'Matemáticas', icon: '📐' }
];

const STORAGE_KEY = 'studyDomain';

/**
 * Selector de dominio de estudio
 * @param {Object} props
 * @param {Function} props.onChange - Callback cuando cambia el dominio
 * @param {string} props.className - Clases CSS adicionales
 */
export default function DomainSelector({ onChange, className = '' }) {
    const [selectedDomain, setSelectedDomain] = useState('programming');

    // Cargar dominio guardado al montar
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved && DOMAINS.find(d => d.id === saved)) {
                setSelectedDomain(saved);
                onChange?.(saved);
            }
        }
    }, []);

    // Manejar cambio de dominio
    const handleChange = (event) => {
        const newDomain = event.target.value;
        setSelectedDomain(newDomain);

        // Persistir en localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, newDomain);
        }

        // Notificar al padre
        onChange?.(newDomain);
    };

    const currentDomain = DOMAINS.find(d => d.id === selectedDomain);

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <span className="text-sm text-gray-600">Modo:</span>
            <select
                value={selectedDomain}
                onChange={handleChange}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                aria-label="Seleccionar dominio de estudio"
            >
                {DOMAINS.map(domain => (
                    <option key={domain.id} value={domain.id}>
                        {domain.icon} {domain.name}
                    </option>
                ))}
            </select>
        </div>
    );
}

/**
 * Hook para obtener el dominio actual
 * @returns {Object} - { domain, setDomain, domainInfo }
 */
export function useDomain() {
    const [domain, setDomainState] = useState('programming');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setDomainState(saved);
        }
    }, []);

    const setDomain = (newDomain) => {
        setDomainState(newDomain);
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, newDomain);
        }
    };

    const domainInfo = DOMAINS.find(d => d.id === domain) || DOMAINS[0];

    return { domain, setDomain, domainInfo, availableDomains: DOMAINS };
}
