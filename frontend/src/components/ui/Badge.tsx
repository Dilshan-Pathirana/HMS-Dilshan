import React from 'react'

interface BadgeProps {
    children: React.ReactNode
    variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'neutral'
    size?: 'sm' | 'md'
    className?: string
}

export function Badge({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
}: BadgeProps) {
    const variants = {
        primary: 'bg-primary-50 text-primary-700 border-primary-200',
        secondary: 'bg-secondary-50 text-secondary-700 border-secondary-200',
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        error: 'bg-rose-50 text-rose-700 border-rose-200',
        neutral: 'bg-slate-50 text-slate-700 border-slate-200',
    }

    const sizes = {
        sm: 'text-[10px] px-2 py-0.5',
        md: 'text-xs px-2.5 py-1',
    }

    return (
        <span
            className={`
      inline-flex items-center justify-center font-medium rounded-full border
      ${variants[variant]} 
      ${sizes[size]} 
      ${className}
    `}
        >
            {children}
        </span>
    )
}
