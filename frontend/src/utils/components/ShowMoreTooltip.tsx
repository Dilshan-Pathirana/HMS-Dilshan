import React from "react";

interface ShowMoreTooltipProps {
    visibleText: string;
    hiddenItems: string[];
    hiddenCount: number;
    uniqueKey: string;
    containerClassName?: string;
    badgeClassName?: string;
    tooltipClassName?: string;
}
const ShowMoreTooltip: React.FC<ShowMoreTooltipProps> = ({
    visibleText,
    hiddenItems,
    hiddenCount,
    uniqueKey,
    containerClassName = "px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 text-xs font-semibold rounded-full shadow-sm break-words whitespace-normal max-w-full",
    badgeClassName = "",
    tooltipClassName = "absolute left-0 top-full mt-1 hidden group-hover:block bg-white border border-gray-200 rounded-md shadow-lg p-2 z-50 min-w-max",
}) => {
    if (!visibleText && hiddenCount === 0) return null;

    return (
        <div className={`${containerClassName} ${badgeClassName}`}>
            {visibleText}
            {hiddenCount > 0 && (
                <span className="relative inline-block group">
                    <span className="ml-1 text-gray-500 cursor-pointer">
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
        </div>
    );
};

export default ShowMoreTooltip;
