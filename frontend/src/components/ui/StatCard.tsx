import React from 'react'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
    label: string
    value: string | number
    trend?: {
        value: number
        isPositive: boolean
    }
    icon: LucideIcon
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
    className?: string
}

export function StatCard({
    label,
    value,
    trend,
    icon: Icon,
    color = 'primary',
    className = '',
}: StatCardProps) {
    const colorClasses = {
        primary: {
            bg: 'bg-primary-50',
            text: 'text-primary-600',
            iconBg: 'bg-primary-100',
        },
        secondary: {
            bg: 'bg-secondary-50',
            text: 'text-secondary-600',
            iconBg: 'bg-secondary-100',
        },
        success: {
            bg: 'bg-emerald-50',
            text: 'text-emerald-600',
            iconBg: 'bg-emerald-100',
        },
        warning: {
            bg: 'bg-amber-50',
            text: 'text-amber-600',
            iconBg: 'bg-amber-100',
        },
        error: {
            bg: 'bg-rose-50',
            text: 'text-rose-600',
            iconBg: 'bg-rose-100',
        },
    }

    const colors = colorClasses[color]

    return (
        <div
            className={`
      bg-white/80 backdrop-blur-xl border border-white/20 shadow-glass 
      rounded-2xl p-6 transition-smooth hover:shadow-glass-lg
      ${className}
    `}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 mb-1">{label}</p>
                    <p className="text-3xl font-bold text-slate-900 mb-2">{value}</p>

                    {trend && (
                        <div
                            className={`inline-flex items-center gap-1 text-xs font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                        >
                            {trend.isPositive ? (
                                <TrendingUp className="w-3.5 h-3.5" />
                            ) : (
                                <TrendingDown className="w-3.5 h-3.5" />
                            )}
                            <span>{Math.abs(trend.value)}%</span>
                        </div>
                    )}
                </div>

                <div
                    className={`
          w-12 h-12 rounded-xl flex items-center justify-center
          ${colors.iconBg} ${colors.text}
        `}
                >
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    )
}
