import {QuestionDetailCardProps} from "../../../utils/types/CreateQuestions/statusUtils.ts";

const QuestionDetailCard: React.FC<QuestionDetailCardProps> = ({
    title,
    children,
    className = "",
}) => {
    return (
        <div className={`bg-gray-50 p-4 rounded-lg ${className}`}>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                {title}
            </h3>
            <div className="mt-1">{children}</div>
        </div>
    );
};

export default QuestionDetailCard;
