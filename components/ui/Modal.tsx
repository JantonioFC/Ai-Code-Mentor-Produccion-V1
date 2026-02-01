
import React, { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
// Import design tokens or use standard Tailwind classes matching "Industrial Refined"

interface ModalContextType {
    onClose: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    className?: string; // Allow custom width overrides
}

export function Modal({ isOpen, onClose, children, className = "max-w-md" }: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    // Close on ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // Close on Overlay Click
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) onClose();
    };

    if (!isOpen) return null;

    return (
        <ModalContext.Provider value={{ onClose }}>
            <div
                ref={overlayRef}
                onClick={handleOverlayClick}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
            >
                <div
                    className={`bg-white rounded-xl shadow-2xl w-full relative overflow-hidden animate-in zoom-in-95 duration-200 ${className}`}
                    role="dialog"
                    aria-modal="true"
                >
                    {children}
                </div>
            </div>
        </ModalContext.Provider>
    );
}

// Subcomponents

interface HeaderProps {
    children: ReactNode;
    showClose?: boolean;
    className?: string;
}

const Header = ({ children, showClose = true, className = "" }: HeaderProps) => {
    const context = useContext(ModalContext);
    if (!context) throw new Error("Modal.Header used outside Modal");

    return (
        <div className={`px-6 py-4 flex items-center justify-between border-b border-gray-100 ${className}`}>
            <h2 className="text-xl font-bold text-gray-900">{children}</h2>
            {showClose && (
                <button
                    onClick={context.onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                    aria-label="Close modal"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
};

const Body = ({ children, className = "" }: { children: ReactNode, className?: string }) => {
    return <div className={`p-6 ${className}`}>{children}</div>;
};

const Footer = ({ children, className = "" }: { children: ReactNode, className?: string }) => {
    return (
        <div className={`px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 ${className}`}>
            {children}
        </div>
    );
};

// Assign subcomponents
Modal.Header = Header;
Modal.Body = Body;
Modal.Footer = Footer;
