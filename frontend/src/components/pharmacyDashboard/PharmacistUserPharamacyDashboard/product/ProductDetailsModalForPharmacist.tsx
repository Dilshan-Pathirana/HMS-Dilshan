import React from "react";
import { FaTimes } from "react-icons/fa";
import { ProductDetailsModalProps } from "../../../../utils/types/pharmacy/Product/IPharmacyProduct.ts";

const ProductDetailsModalForPharmacist: React.FC<ProductDetailsModalProps> = ({
    isOpen,
    product,
    onClose,
}) => {
    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 bg-neutral-800 bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-3xl relative p-6">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-neutral-600 hover:text-neutral-800"
                >
                    <FaTimes size={20} />
                </button>

                <h2 className="text-xl font-semibold mb-4">{`Details for ${product.item_name}`}</h2>

                <div className="grid grid-cols-2 gap-4">
                    <p>
                        <strong>Brand Name:</strong> {product.brand_name}
                    </p>
                    <p>
                        <strong>Category:</strong> {product.category}
                    </p>
                    <p>
                        <strong>Generic Name:</strong> {product.generic_name}
                    </p>
                    <p>
                        <strong>Item Code:</strong> {product.item_code}
                    </p>
                    <p>
                        <strong>Item Name:</strong> {product.item_name}
                    </p>
                    <p>
                        <strong>Current Stock:</strong> {product.current_stock}
                    </p>
                    <p>
                        <strong>Damaged Unit:</strong> {product.damaged_unit}
                    </p>
                    <p>
                        <strong>Minimum Stock:</strong> {product.min_stock}
                    </p>
                    <p>
                        <strong>Reorder Level:</strong> {product.reorder_level}
                    </p>
                    <p>
                        <strong>Reorder Quantity:</strong>{" "}
                        {product.reorder_quantity}
                    </p>
                    <p>
                        <strong>Unit:</strong> {product.unit}
                    </p>
                    <p>
                        <strong>Unit Cost:</strong> {product.unit_cost}
                    </p>
                    <p>
                        <strong>Unit Selling Price:</strong>{" "}
                        {product.unit_selling_price}
                    </p>
                    <p>
                        <strong>Expiry Date:</strong> {product.expiry_date}
                    </p>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-500"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailsModalForPharmacist;
