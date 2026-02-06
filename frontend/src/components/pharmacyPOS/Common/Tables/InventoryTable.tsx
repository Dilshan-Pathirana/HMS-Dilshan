import { useState } from "react";
import { Search } from "lucide-react";
import Pagination from "../Pagination.tsx";
import { InventoryTableProps } from "../../../../utils/types/pos/IProduct.ts";
import { showDiscount } from "../CommonFunctionalities.ts";

const InventoryTable = ({
    products,
    searchTerm,
    setSearchTerm,
    onRowClick,
}: InventoryTableProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const filteredInventory = products.filter(
        (item) =>
            item.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.barcode &&
                item.barcode.toLowerCase().includes(searchTerm.toLowerCase())),
    );

    const totalPages = Math.ceil(filteredInventory.length / rowsPerPage);

    const paginatedInventory = filteredInventory.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage,
    );

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    return (
        <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Inventory Items</h2>
            </div>
            <div className="flex items-center space-x-2 mb-4">
                <div className="relative w-1/2">
                    <Search className="absolute w-5 h-5 text-neutral-500 left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by SKU / Name / Barcode"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border border-neutral-300 rounded ml-2 pl-10 pr-4 py-2 w-2/4"
                    />
                </div>
                <span className="bg-red-300 w-4 h-4"></span>
                <span>Re-order</span>
            </div>

            <table className="min-w-full divide-y divide-gray-200 border border-neutral-200">
                <thead className="bg-neutral-50">
                    <tr>
                        {[
                            "SKU",
                            "Name",
                            "Barcode",
                            "Price",
                            "Discount",
                            "Stock",
                            "Reorder Level",
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
                    {paginatedInventory.map((item) => (
                        <tr
                            key={item.id}
                            className={
                                item.current_stock < item.reorder_level
                                    ? "cursor-pointer bg-red-300"
                                    : "hover:bg-neutral-50 cursor-pointer"
                            }
                            onClick={() => onRowClick(item)}
                        >
                            {[
                                {
                                    content: item.item_code,
                                    key: `${item.item_code}-code`,
                                },
                                {
                                    content: item.item_name,
                                    key: `${item.item_code}-name`,
                                },
                                {
                                    content: item.barcode,
                                    key: `${item.barcode}-barcode`,
                                },
                                {
                                    content: `LKR ${item.unit_selling_price.toFixed(2)}`,
                                    key: `${item.item_code}-price`,
                                },
                                {
                                    content: showDiscount(item),
                                    key: `${item.discount_amount ? item.discount_amount : item.discount_percentage}-price`,
                                },
                                {
                                    content: item.current_stock,
                                    key: `${item.item_code}-stock`,
                                },
                                {
                                    content: item.reorder_level,
                                    key: `${item.item_code}-reorder`,
                                },
                            ].map((cell) => (
                                <td
                                    key={cell.key}
                                    className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900"
                                >
                                    {cell.content}
                                </td>
                            ))}
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
};

export default InventoryTable;
