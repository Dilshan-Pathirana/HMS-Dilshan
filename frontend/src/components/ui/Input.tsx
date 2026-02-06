import React, { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    helperText?: string
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        { className = '', label, error, helperText, leftIcon, rightIcon, ...props },
        ref,
    ) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    {leftIcon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-500 transition-colors duration-200">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`
              w-full bg-neutral-50/50 border ${error ? 'border-error-500' : 'border-neutral-200'}
              rounded-xl
              ${leftIcon ? 'pl-11' : 'pl-4'} 
              ${rightIcon ? 'pr-11' : 'pr-4'} 
              py-3.5 text-neutral-900 placeholder:text-neutral-400
              focus:outline-none focus:ring-4 ${error ? 'focus:ring-error-500/10 focus:border-error-500' : 'focus:ring-primary-500/10 focus:border-primary-500'}
              hover:border-primary-200 hover:bg-white
              transition-all duration-300 ease-out
              disabled:bg-neutral-100 disabled:cursor-not-allowed
              shadow-sm
              ${className}
            `}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <p className="mt-1.5 text-xs text-error-600 font-medium animate-slide-down">
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p className="mt-1.5 text-xs text-neutral-500">{helperText}</p>
                )}
            </div>
        )
    },
)

Input.displayName = 'Input'
