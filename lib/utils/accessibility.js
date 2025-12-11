/**
 * Utilidades de Accesibilidad (a11y) para AI Code Mentor
 * Helpers para mejorar la experiencia de usuarios con discapacidades
 * 
 * @module lib/utils/accessibility
 */

/**
 * Generar ID único para elementos accesibles
 * @param {string} prefix - Prefijo del ID
 * @returns {string}
 */
export function generateA11yId(prefix = 'a11y') {
    return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Anunciar mensaje para lectores de pantalla
 * Crea un elemento aria-live temporal
 * 
 * @param {string} message - Mensaje a anunciar
 * @param {string} priority - 'polite' | 'assertive'
 */
export function announceToScreenReader(message, priority = 'polite') {
    if (typeof window === 'undefined') return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('class', 'sr-only');
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remover después de que se anuncie
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

/**
 * Verificar si el usuario prefiere movimiento reducido
 * @returns {boolean}
 */
export function prefersReducedMotion() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Verificar si el usuario prefiere alto contraste
 * @returns {boolean}
 */
export function prefersHighContrast() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-contrast: more)').matches;
}

/**
 * Manejar navegación por teclado en listas/menús
 * @param {KeyboardEvent} event - Evento de teclado
 * @param {Array} items - Lista de elementos navegables
 * @param {number} currentIndex - Índice actual
 * @param {Function} setIndex - Función para actualizar índice
 */
export function handleKeyboardNavigation(event, items, currentIndex, setIndex) {
    switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
            event.preventDefault();
            setIndex((currentIndex + 1) % items.length);
            break;
        case 'ArrowUp':
        case 'ArrowLeft':
            event.preventDefault();
            setIndex((currentIndex - 1 + items.length) % items.length);
            break;
        case 'Home':
            event.preventDefault();
            setIndex(0);
            break;
        case 'End':
            event.preventDefault();
            setIndex(items.length - 1);
            break;
    }
}

/**
 * Focus trap para modales y diálogos
 * @param {HTMLElement} container - Contenedor del modal
 * @returns {Object} - Funciones para activar/desactivar trap
 */
export function createFocusTrap(container) {
    const focusableSelectors = [
        'button',
        '[href]',
        'input',
        'select',
        'textarea',
        '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    let firstFocusable = null;
    let lastFocusable = null;

    const getFocusableElements = () => {
        const elements = container.querySelectorAll(focusableSelectors);
        return Array.from(elements).filter(el => !el.disabled);
    };

    const handleKeydown = (event) => {
        if (event.key !== 'Tab') return;

        const focusableElements = getFocusableElements();
        firstFocusable = focusableElements[0];
        lastFocusable = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
            if (document.activeElement === firstFocusable) {
                event.preventDefault();
                lastFocusable?.focus();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                event.preventDefault();
                firstFocusable?.focus();
            }
        }
    };

    return {
        activate: () => {
            container.addEventListener('keydown', handleKeydown);
            const focusableElements = getFocusableElements();
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        },
        deactivate: () => {
            container.removeEventListener('keydown', handleKeydown);
        }
    };
}

/**
 * Generar descripción de progreso accesible
 * @param {number} current - Valor actual
 * @param {number} max - Valor máximo
 * @returns {string}
 */
export function getProgressDescription(current, max) {
    const percentage = Math.round((current / max) * 100);
    return `${percentage}% completado, ${current} de ${max}`;
}

/**
 * Clase CSS para elementos solo visibles por screen readers
 */
export const srOnlyClass = 'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0';

/**
 * Props comunes de accesibilidad para botones
 */
export const buttonA11yProps = {
    role: 'button',
    tabIndex: 0
};

/**
 * Props comunes para enlaces que abren en nueva pestaña
 */
export const externalLinkProps = {
    target: '_blank',
    rel: 'noopener noreferrer'
};

/**
 * Hook para skip to main content
 */
export function useSkipToMain() {
    const skipToMain = () => {
        const main = document.querySelector('main') || document.querySelector('[role="main"]');
        if (main) {
            main.setAttribute('tabindex', '-1');
            main.focus();
        }
    };

    return skipToMain;
}
