import React from 'react';

/**
 * Loading fallback component for React.Suspense
 * Displays a centered spinner while route components are being loaded
 */
export const PageLoadingFallback: React.FC = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading...</p>
            </div>
        </div>
    );
};

/**
 * Minimal loading fallback for nested suspense boundaries
 */
export const ComponentLoadingFallback: React.FC = () => {
    return (
        <div className="flex items-center justify-center p-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );
};

export default PageLoadingFallback;
