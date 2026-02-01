
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
    children,
    className = '',
    variant = 'primary',
    disabled,
    ...props
}, ref) => {
    // UI/UX Pro Max: Touch Target (min-h-[44px]), Focus Visible
    const baseStyles = "px-4 py-2 min-h-[44px] min-w-[44px] rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";

    const variants = {
        primary: "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 focus:ring-purple-500",
        secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
        danger: "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 focus:ring-red-500",
        success: "bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 focus:ring-green-500"
    };

    return (
        <button
            ref={ref}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
});

Button.displayName = 'Button';
