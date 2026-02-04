import {
    getStatusConfig,
    StatusBadgeProps,
} from "../../../utils/types/CreateQuestions/statusUtils.ts";

const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    className = "",
}) => {
    const { className: badgeClassName, displayText } = getStatusConfig(status);

    return (
        <span
            className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${badgeClassName} ${className}`}
        >
            {displayText}
        </span>
    );
};

export default StatusBadge;
