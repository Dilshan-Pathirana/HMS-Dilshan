import React from "react";

interface ShowMoreInlineProps {
    visibleText: string;
    hiddenItems: string[];
    hiddenCount: number;
    uniqueKey: string;
    containerClassName?: string;
    tooltipClassName?: string;
}
const ShowMoreInline: React.FC<ShowMoreInlineProps> = ({
    visibleText,
    hiddenItems,
    hiddenCount,
    uniqueKey,
    containerClassName = "truncate",
    tooltipClassName = "absolute left-0 top-full mt-1 hidden group-hover:block bg-white border border-gray-200 rounded-md shadow-lg p-2 z-50 min-w-max",
}) => {
    if (!visibleText && hiddenCount === 0) return null;

    return (
        <span className={containerClassName}>
            {visibleText}
            {hiddenCount > 0 && (
                <span className="relative inline-block group ml-1">
                    <span className="text-gray-500 cursor-pointer">
                        +{hiddenCount} more
                    </span>
                    <div className={tooltipClassName}>
                        <div className="text-xs text-gray-700 space-y-1">
                            {hiddenItems.map((item, index) => (
                                <div key={`${uniqueKey}-${index}`}>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </span>
            )}
        </span>
    );
};

export default ShowMoreInline;
