import React from "react";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
    currentPage,
    totalPages,
    onPageChange,
}) => {
    const renderPageNumbers = () => {
        return Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
                pageNum = i + 1;
            } else if (currentPage <= 3) {
                pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
            } else {
                pageNum = currentPage - 2 + i;
            }

            return (
                <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`${
                        pageNum === currentPage ? "bg-black text-white" : ""
                    } border border-gray-200 px-[10px] text-[0.9rem] py-[1px] rounded-md`}
                >
                    {pageNum}
                </button>
            );
        });
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="border border-gray-200 hover:bg-gray-50 cursor-pointer px-[10px] text-[0.9rem] py-[5px] rounded-md"
            >
                <BsChevronLeft />
            </button>
            <div className="flex items-center gap-1">{renderPageNumbers()}</div>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="border border-gray-200 px-[10px] cursor-pointer hover:bg-gray-50 text-[0.9rem] py-[5px] rounded-md"
            >
                <BsChevronRight />
            </button>
        </div>
    );
};

export default PaginationControls;
