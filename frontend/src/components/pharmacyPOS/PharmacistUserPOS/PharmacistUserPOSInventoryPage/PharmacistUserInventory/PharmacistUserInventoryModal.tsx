import { InventoryModalProps } from "../../../../../utils/types/pharmacy/Product/IPharmacyProduct.ts";

export default function PharmacistUserInventoryModal({
    product,
    onClose,
}: InventoryModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-md relative">
                <h3 className="text-xl font-semibold mb-4">Product Details</h3>
                <ul>
                    {[
                        { label: "SKU", value: product.item_code },
                        { label: "Name", value: product.item_name },
                        { label: "Brand", value: product.brand_name },
                        { label: "Category", value: product.category },
                        {
                            label: "Price",
                            value: `LKR ${product.unit_selling_price.toFixed(2)}`,
                        },
                        { label: "Stock", value: product.current_stock },
                        { label: "Damaged Units", value: product.damaged_unit },
                        { label: "Expiry Date", value: product.expiry_date },
                        { label: "Generic Name", value: product.generic_name },
                        { label: "Min Stock", value: product.min_stock },
                        {
                            label: "Reorder Level",
                            value: product.reorder_level,
                        },
                        {
                            label: "Reorder Quantity",
                            value: product.reorder_quantity,
                        },
                        { label: "Unit", value: product.unit },
                        {
                            label: "Unit Cost",
                            value: `LKR ${product.unit_cost.toFixed(2)}`,
                        },
                    ].map((detail, index) => (
                        <li key={index}>
                            <strong>{detail.label}:</strong> {detail.value}
                        </li>
                    ))}
                </ul>

                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 absolute bottom-4 right-4"
                >
                    Close
                </button>
            </div>
        </div>
    );
}
