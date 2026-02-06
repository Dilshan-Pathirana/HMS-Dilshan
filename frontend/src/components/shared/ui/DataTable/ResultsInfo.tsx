import React from "react";
import { ResultsInfoProps } from "../../../../utils/types/common/IDataTable";

const ResultsInfo: React.FC<ResultsInfoProps> = ({
    currentPage,
    pageSize,
    totalResults,
}) => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalResults);

    return (
        <div className="text-sm text-neutral-500">
            Showing {start} to {end} of {totalResults} results
        </div>
    );
};

export default ResultsInfo;
