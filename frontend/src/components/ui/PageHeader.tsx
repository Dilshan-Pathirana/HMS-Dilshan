import React, { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    description,
    actions,
    className = ''
}: PageHeaderProps) {
    return (
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 ${className}`}>
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{title}</h1>
                {description && (
                    <p className="text-sm text-neutral-500 mt-1">{description}</p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
}
