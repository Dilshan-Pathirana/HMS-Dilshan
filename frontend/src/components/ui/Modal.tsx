import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    footer?: React.ReactNode
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
}: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!isOpen) return null

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div
                className={`
        relative w-full ${sizes[size]} 
        bg-white/90 backdrop-blur-xl 
        border border-white/20 shadow-2xl 
        rounded-2xl flex flex-col max-h-[90vh]
        animate-in fade-in zoom-in-95 duration-200
      `}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">{children}</div>

                {footer && (
                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 rounded-b-2xl flex justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}
