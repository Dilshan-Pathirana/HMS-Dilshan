import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        label: string;
        isPositive: boolean;
    };
    description?: string;
    className?: string;
}

export function StatCard({
    title,
    value,
    icon: Icon,
    trend,
    description,
    className = ''
}: StatCardProps) {
    return (
        <div className={`group bg-white rounded-xl border border-neutral-200 p-6 transition-all duration-200 hover:shadow-md hover:border-primary-100 ${className}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-neutral-900 tracking-tight">{value}</h3>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg group-hover:bg-primary-50 transition-colors">
                    <Icon className="w-5 h-5 text-neutral-500 group-hover:text-primary-600 transition-colors" />
                </div>
            </div>

            {(trend || description) && (
                <div className="mt-4 flex items-center gap-2">
                    {trend && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend.isPositive
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-700'
                            }`}>
                            {trend.isPositive ? '+' : ''}{trend.value}%
                        </span>
                    )}
                    {(trend || description) && (
                        <p className="text-xs text-neutral-500 font-medium">
                            {trend ? trend.label : description}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
