import { Search } from "lucide-react";
import {
    FilterControlsProps,
    fliterningYears,
} from "../../../../../utils/types/pos/IPurchasing.ts";
import React from "react";

const PurchasingTableFilterControls: React.FC<FilterControlsProps> = ({
    searchTerm,
    setSearchTerm,
    selectedDate,
    setSelectedDate,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    setCurrentPage,
    exportSelectedRows,
}) => {
    const resetFilters = () => {
        setSearchTerm("");
        setSelectedDate("");
        setSelectedMonth("");
        setSelectedYear("");
        setCurrentPage(1);
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mb-4">
            <div className="relative">
                <Search className="absolute w-5 h-5 text-neutral-500 left-3 top-1/2 transform -translate-y-1/2" />
                <input
                    type="text"
                    placeholder="Invoice ID"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="border border-neutral-300 rounded pl-10 pr-4 py-2 w-full"
                />
            </div>

            <input
                type="date"
                placeholder="Filter by Date"
                value={selectedDate}
                onChange={(event) => {
                    setSelectedDate(event.target.value);
                    setSelectedMonth("");
                    setSelectedYear("");
                }}
                className="border border-neutral-300 rounded pl-4 pr-4 py-2 w-full"
            />

            <select
                className="border border-neutral-300 rounded pl-4 pr-4 py-2 w-full"
                value={selectedMonth}
                onChange={(event) => {
                    setSelectedMonth(Number(event.target.value).toString());
                    setSelectedDate("");
                }}
            >
                <option value="">Filter by Month</option>
                {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString("default", {
                            month: "long",
                        })}
                    </option>
                ))}
            </select>

            <select
                className="border border-neutral-300 rounded pl-4 pr-4 py-2 w-full"
                value={selectedYear}
                onChange={(event) => {
                    setSelectedYear(event.target.value);
                    setSelectedDate("");
                }}
            >
                <option value="">Filter by Year</option>
                {fliterningYears.map((year) => (
                    <option key={year} value={year}>
                        {year}
                    </option>
                ))}
            </select>

            <button
                onClick={exportSelectedRows}
                className="bg-primary-600 text-white rounded px-4 py-2 w-full hover:bg-blue-800 transition duration-200"
            >
                Get Report
            </button>

            <button
                onClick={resetFilters}
                className="bg-error-500 text-white rounded px-4 py-2 w-full hover:bg-red-600 transition duration-200"
            >
                Reset Filters
            </button>
        </div>
    );
};

export default PurchasingTableFilterControls;
