import React from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
    value: string
    label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    options: SelectOption[]
    error?: string
    helperText?: string
}

export function Select({
    label,
    options,
    error,
    helperText,
    className = '',
    ...props
}: SelectProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    className={`
            w-full appearance-none bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl 
            pl-4 pr-10 py-2.5 text-sm text-slate-900 
            focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
            hover:border-slate-300 hover:bg-white/80
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}
            ${className}
          `}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>
            {error && (
                <p className="mt-1 text-xs text-rose-500 font-medium animate-in slide-in-from-top">
                    {error}
                </p>
            )}
            {helperText && !error && (
                <p className="mt-1 text-xs text-slate-500">{helperText}</p>
            )}
        </div>
    )
}
