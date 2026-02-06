import React, { useState } from "react";
import { FaEye, FaEdit, FaTrash, FaSearch } from "react-icons/fa";

interface TableColumn {
    header: string;
    accessor: string;
}

interface TableProps {
    columns: TableColumn[];
    data: any[];
    rowsPerPage: number;
    onView: (item: any) => void;
    onEdit: (item: any) => void;
    onDelete: (item: any) => void;
}

const Table: React.FC<TableProps> = ({
    columns,
    data,
    rowsPerPage,
    onView,
    onEdit,
    onDelete,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");

    const totalPages = Math.ceil(data.length / rowsPerPage);

    const filteredData = data.filter((item) =>
        columns.some((column) =>
            String(item[column.accessor])
                .toLowerCase()
                .includes(searchTerm.toLowerCase()),
        ),
    );

    const currentData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage,
    );

    const handlePrevious = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    return (
        <div className="max-w-4xl border p-4 shadow rounded">
            <div className="flex justify-end mb-4">
                <div className="relative w-1/3">
                    {" "}
                    {/* Reduced width */}
                    <FaSearch
                        className="absolute left-3 top-2.5 text-neutral-400"
                        size={20}
                    />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2 border rounded w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <table className="min-w-full table-auto bg-white border border-neutral-200">
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.accessor}
                                className="px-4 py-2 text-left text-sm font-semibold bg-neutral-100"
                            >
                                {column.header}
                            </th>
                        ))}
                        <th className="px-4 py-2 text-left text-sm font-semibold bg-neutral-100">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {currentData.map((item, index) => (
                        <tr key={index} className="border-b">
                            {columns.map((column) => (
                                <td
                                    key={column.accessor}
                                    className="px-4 py-2 text-sm"
                                >
                                    {item[column.accessor]}
                                </td>
                            ))}
                            <td className="px-4 py-2 text-sm">
                                <button
                                    onClick={() => onView(item)}
                                    className="text-primary-500 mr-2"
                                >
                                    <FaEye />
                                </button>
                                <button
                                    onClick={() => onEdit(item)}
                                    className="text-yellow-500 mr-2"
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    onClick={() => onDelete(item)}
                                    className="text-error-500"
                                >
                                    <FaTrash />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-between items-center mt-4">
                <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm bg-neutral-200 rounded disabled:opacity-50"
                >
                    Previous
                </button>
                <span className="text-sm">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm bg-neutral-200 rounded disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default Table;
