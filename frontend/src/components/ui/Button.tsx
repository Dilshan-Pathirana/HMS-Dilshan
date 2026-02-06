import React from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    isLoading?: boolean
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
}

export function Button({
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles =
        'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg active:scale-[0.98]'

    const variants = {
        primary:
            'bg-primary-500 text-white hover:bg-primary-600 hover:shadow-primary-hover shadow-primary focus:ring-primary-500/20 border border-transparent',
        secondary:
            'bg-secondary-500 text-white hover:bg-secondary-600 hover:shadow-secondary shadow-md focus:ring-secondary-500/20 border border-transparent',
        outline:
            'bg-transparent border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-primary-400 hover:text-primary-600 focus:ring-primary-500/20',
        ghost:
            'bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus:ring-neutral-500/20',
        danger:
            'bg-error-500 text-white hover:bg-error-600 shadow-md hover:shadow-lg focus:ring-error-500/20 border border-transparent',
    }

    const sizes = {
        sm: 'text-xs px-3 py-1.5 gap-1.5',
        md: 'text-sm px-6 py-2.5 gap-2',
        lg: 'text-base px-8 py-3 gap-2.5',
    }

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {!isLoading && leftIcon}
            {children}
            {!isLoading && rightIcon}
        </button>
    )
}
