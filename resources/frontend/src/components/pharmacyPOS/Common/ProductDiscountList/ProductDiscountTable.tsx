import React, { useState } from "react";
import { IProductDiscountTableProps } from "../../../../utils/types/pos/IProduct.ts";
import { Search } from "lucide-react";
import Pagination from "../Pagination.tsx";
import { removeProductDiscount } from "../../../../utils/api/pharmacy/PharmacyPOS/SuperAdminPharmacyPOS/SuperAdminProductDiscount.ts";
import alert from "../../../../utils/alert.ts";
import { useSelector } from "react-redux";
import { AuthState } from "../../../../utils/types/auth";
import { ConfirmAlert } from "../../../../assets/Common/Alert/ConfirmAlert.tsx";

const ProductDiscountTable: React.FC<IProductDiscountTableProps> = ({
    products,
    searchTerm,
    setSearchTerm,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
    const userRole = useSelector(
        (state: { auth: AuthState }) => state.auth.userRole,
    );

    const filteredProducts = products.filter(
        (item) =>
            item.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.barcode &&
                item.barcode.toLowerCase().includes(searchTerm.toLowerCase())),
    );

    const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);

    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage,
    );

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handleProductDiscountRemove = async (productDiscountId: string) => {
        const isConfirmed = await ConfirmAlert(
            "Do you want remove discount?",
            "Do you really want to remove discount?",
        );

        if (isConfirmed) {
            const response = await removeProductDiscount(productDiscountId);
            if (response.data.status === 200) {
                alert.success(
                    response.data.message || "Product discount removed!",
                );
                window.location.reload();
            } else {
                alert.error(
                    "Failed to remove product discount. Please try again.",
                );
            }
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Product Discount List</h2>
            </div>
            <div className="flex items-center space-x-2 mb-4">
                <div className="relative w-1/2">
                    <Search className="absolute w-5 h-5 text-gray-500 left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by SKU / Name / Barcode"
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
                            "Barcode",
                            "Discount Type",
                            "Discount Amount",
                            "Action",
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
                                product.barcode,
                                product.discount_type,
                                product.discount_amount
                                    ? product.discount_amount
                                    : `${product.discount_percentage}%`,
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
                                    type="button"
                                    disabled={userRole === 6 || userRole === 7}
                                    onClick={() =>
                                        handleProductDiscountRemove(product.id)
                                    }
                                    className={
                                        userRole === 6 || userRole === 7
                                            ? "text-white bg-red-300 px-2 py-1 rounded-md cursor-not-allowed"
                                            : "text-white bg-red-600 px-2 py-1 rounded-md"
                                    }
                                >
                                    Remove Discount
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
        </div>
    );
};

export default ProductDiscountTable;
