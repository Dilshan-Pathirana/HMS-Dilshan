import { useState } from "react";
import { Search } from "lucide-react";
import { ReOrderTableProps } from "../../../../../../utils/types/pos/IProduct.ts";
import Pagination from "../../../../Common/Pagination.tsx";

export default function PharmacistUserReOrderTable({
    products,
    searchTerm,
    setSearchTerm,
}: ReOrderTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

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
                <h2 className="text-xl font-semibold">Re-Order Stock List</h2>
            </div>

            <div className="flex items-center space-x-2 mb-4">
                <div className="relative w-1/2">
                    <Search className="absolute w-5 h-5 text-neutral-500 left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by SKU or Item Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border border-neutral-300 rounded pl-10 pr-4 py-2 w-full"
                    />
                </div>
            </div>

            <table className="min-w-full divide-y divide-gray-200 border border-neutral-200">
                <thead className="bg-neutral-50">
                    <tr>
                        {[
                            "SKU",
                            "Item Name",
                            "Current Stock",
                            "Previous Stock",
                        ].map((header) => (
                            <th
                                key={header}
                                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
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
                            className="hover:bg-neutral-50 cursor-pointer"
                        >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                                {product.item_code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                {product.item_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                {product.current_stock}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                {product.previous_stock}
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
        </div>
    );
}
