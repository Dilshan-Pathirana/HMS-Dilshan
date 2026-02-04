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
        'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl active:scale-[0.98]'

    const variants = {
        primary:
            'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 focus:ring-primary-500/20 border border-transparent',
        secondary:
            'bg-secondary-500 text-white hover:bg-secondary-600 shadow-lg shadow-secondary-500/30 hover:shadow-secondary-500/40 focus:ring-secondary-500/20 border border-transparent',
        outline:
            'bg-white/50 backdrop-blur-sm border border-slate-200 text-slate-700 hover:bg-white hover:border-primary-200 hover:text-primary-600 shadow-sm focus:ring-primary-500/20',
        ghost:
            'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-500/20',
        danger:
            'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/30 hover:shadow-rose-500/40 focus:ring-rose-500/20 border border-transparent',
    }

    const sizes = {
        sm: 'text-xs px-3 py-1.5 gap-1.5',
        md: 'text-sm px-4 py-2 gap-2',
        lg: 'text-base px-6 py-3 gap-2.5',
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
