import { useState } from "react";
import { Search } from "lucide-react";
import { TransferStockTableProps } from "../../../../../../utils/types/pos/IProduct.ts";
import CashierUserTransferReasonModal from "./CashierUserTransferReasonModal.tsx";
import Pagination from "../../../../Common/Pagination.tsx";

export default function CashierUserTransferStockTable({
    products,
    searchTerm,
    setSearchTerm,
}: TransferStockTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
    const [modalContent, setModalContent] = useState<string | null>(null);

    const openModal = (reason: string) => setModalContent(reason);
    const closeModal = () => setModalContent(null);

    const filteredProducts = products.filter(
        (product) =>
            product.item_code
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            product.item_name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);

    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage,
    );

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    return (
        <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Transfer Stock List</h2>
            </div>

            <div className="flex items-center space-x-2 mb-4">
                <div className="relative w-1/2">
                    <Search className="absolute w-5 h-5 text-gray-500 left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by SKU or Item Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border border-gray-300 rounded pl-10 pr-4 py-2 w-full"
                    />
                </div>
            </div>

            <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {[
                            "SKU",
                            "Item Name",
                            "Current Stock",
                            "Previous Stock",
                            "Stock Change",
                            "Remark",
                        ].map((header) => (
                            <th
                                key={header}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedProducts.map((product) => (
                        <tr
                            key={product.id}
                            className="hover:bg-gray-50 cursor-pointer"
                        >
                            {[
                                product.item_code,
                                product.item_name,
                                product.current_stock,
                                product.previous_stock,
                                product.stock_related_to_event,
                            ].map((value, index) => (
                                <td
                                    key={index}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                >
                                    {" "}
                                    {value}{" "}
                                </td>
                            ))}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <button
                                    onClick={() =>
                                        openModal(product.event_reason)
                                    }
                                    className="text-white  bg-blue-400 px-2 py-1 rounded-md"
                                >
                                    View
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
            <CashierUserTransferReasonModal
                modalContent={modalContent}
                closeModal={closeModal}
            />
        </div>
    );
}
