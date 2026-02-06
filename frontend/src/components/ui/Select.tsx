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
            w-full appearance-none bg-neutral-50/50 backdrop-blur-sm border border-neutral-200 rounded-xl 
            pl-4 pr-10 py-3.5 text-sm text-neutral-900 
            focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500
            hover:border-primary-200 hover:bg-white
            transition-all duration-300 ease-out
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-sm
            ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500/10' : ''}
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
            {
                error && (
                    <p className="mt-1 text-xs text-rose-500 font-medium animate-in slide-in-from-top">
                        {error}
                    </p>
                )
            }
            {
                helperText && !error && (
                    <p className="mt-1 text-xs text-slate-500">{helperText}</p>
                )
            }
        </div >
    )
}
