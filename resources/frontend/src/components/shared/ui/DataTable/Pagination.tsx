import React from "react";
import ResultsInfo from "./ResultsInfo";
import PageSizeSelector from "./PageSizeSelector";
import PaginationControls from "./PaginationControls";
import { PaginationProps } from "../../../../utils/types/common/IDataTable";

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    pageSize,
    totalResults,
    onPageChange,
    onPageSizeChange,
}) => {
    return (
        <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-[5px]">
                <ResultsInfo
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalResults={totalResults}
                />

                <PageSizeSelector
                    pageSize={pageSize}
                    onPageSizeChange={onPageSizeChange}
                />
            </div>

            <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
            />
        </div>
    );
};

export default Pagination;
