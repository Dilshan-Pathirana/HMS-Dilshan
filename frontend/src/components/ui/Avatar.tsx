import React from 'react'

interface AvatarProps {
    src?: string
    alt?: string
    initials?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    status?: 'online' | 'offline' | 'busy' | 'away'
    className?: string
}

export function Avatar({
    src,
    alt = 'User',
    initials,
    size = 'md',
    status,
    className = '',
}: AvatarProps) {
    const sizes = {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-lg',
    }

    const statusColors = {
        online: 'bg-emerald-500',
        offline: 'bg-slate-400',
        busy: 'bg-rose-500',
        away: 'bg-amber-500',
    }

    const statusSizes = {
        xs: 'w-1.5 h-1.5',
        sm: 'w-2 h-2',
        md: 'w-2.5 h-2.5',
        lg: 'w-3 h-3',
        xl: 'w-4 h-4',
    }

    return (
        <div className={`relative inline-block ${className}`}>
            <div
                className={`
        ${sizes[size]} 
        rounded-full overflow-hidden 
        bg-primary-100 text-primary-700 
        flex items-center justify-center font-semibold
        border-2 border-white shadow-sm
      `}
            >
                {src ? (
                    <img src={src} alt={alt} className="w-full h-full object-cover" />
                ) : (
                    <span>{initials || alt.charAt(0).toUpperCase()}</span>
                )}
            </div>

            {status && (
                <span
                    className={`
          absolute bottom-0 right-0 
          block rounded-full ring-2 ring-white 
          ${statusColors[status]} 
          ${statusSizes[size]}
        `}
                />
            )}
        </div>
    )
}
