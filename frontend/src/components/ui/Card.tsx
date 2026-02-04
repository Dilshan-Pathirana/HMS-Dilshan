import React from 'react'

interface CardProps {
    children: React.ReactNode
    className?: string
    title?: string
    subtitle?: string
    action?: React.ReactNode
    footer?: React.ReactNode
    noPadding?: boolean
}

export function Card({
    children,
    className = '',
    title,
    subtitle,
    action,
    footer,
    noPadding = false,
}: CardProps) {
    return (
        <div
            className={`bg-white/80 backdrop-blur-xl border border-white/20 shadow-glass rounded-2xl overflow-hidden flex flex-col transition-smooth hover:shadow-glass-lg ${className}`}
        >
            {(title || action) && (
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/40">
                    <div>
                        {title && (
                            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                        )}
                        {subtitle && (
                            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
                        )}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}

            <div className={`flex-1 ${noPadding ? '' : 'p-6'}`}>{children}</div>

            {footer && (
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                    {footer}
                </div>
            )}
        </div>
    )
}
