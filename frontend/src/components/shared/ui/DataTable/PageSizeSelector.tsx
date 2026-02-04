import React, { useState, useRef, useEffect } from "react";
import { IoIosArrowDown } from "react-icons/io";
import { PageSizeSelectorProps } from "../../../../utils/types/common/IDataTable";

const PageSizeSelector: React.FC<PageSizeSelectorProps> = ({
    pageSize,
    onPageSizeChange,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement | null>(null);

    const handleToggle = () => setIsOpen((prev) => !prev);

    const handleOutsideClick = (event: MouseEvent) => {
        if (
            selectRef.current &&
            !selectRef.current.contains(event.target as Node)
        ) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleOutsideClick);
        return () =>
            document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const handlePageSizeChange = (size: number) => {
        onPageSizeChange(size);
        setIsOpen(false);
    };

    return (
        <div ref={selectRef} className="relative w-44">
            <button
                onClick={handleToggle}
                className="w-max px-2 py-0.5 text-left bg-white border border-gray-300 rounded shadow-sm flex items-center justify-between gap-[10px] hover:border-gray-400 focus:outline-none"
            >
                {pageSize}
                <IoIosArrowDown
                    className={`${isOpen ? "rotate-[180deg]" : "rotate-0"} transition-all duration-200`}
                />
            </button>
            {isOpen && (
                <div className="absolute w-max mt-1 bg-white border border-gray-300 rounded shadow-lg">
                    {[5, 10, 20, 50].map((size) => (
                        <div
                            key={size}
                            className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => handlePageSizeChange(size)}
                        >
                            {size}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PageSizeSelector;
