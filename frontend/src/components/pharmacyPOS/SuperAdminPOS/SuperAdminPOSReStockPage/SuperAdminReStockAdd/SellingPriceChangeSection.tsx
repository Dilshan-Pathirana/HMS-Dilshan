import React from "react";
import { IProductRestock } from "../../../../../utils/types/pos/IProductRestock";

interface ISellingPriceChangeSectionProps {
    newProductStockDetails: IProductRestock;
    handleProductStockChange: (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => void;
}

const SellingPriceChangeSection: React.FC<ISellingPriceChangeSectionProps> = ({
    newProductStockDetails,
    handleProductStockChange,
}) => {
    return (
        <>
            <div className="mb-4">
                <label
                    htmlFor="new_selling_unit_price"
                    className="block text-sm font-medium text-neutral-700 mb-1"
                >
                    New unit selling price
                </label>
                <input
                    type="number"
                    id="new_selling_unit_price"
                    name="new_selling_unit_price"
                    className="w-full border border-neutral-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-300"
                    value={newProductStockDetails.new_selling_unit_price}
                    onChange={handleProductStockChange}
                    min="0"
                    placeholder="Enter unit selling price"
                />
            </div>

            <div className="mb-4">
                <label
                    htmlFor="new_entry_date"
                    className="block text-sm font-medium text-neutral-700 mb-1"
                >
                    New Entry date
                </label>
                <input
                    type="date"
                    id="new_entry_date"
                    name="new_entry_date"
                    className="w-full border border-neutral-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-300"
                     value={newProductStockDetails.new_entry_date}
                    onChange={handleProductStockChange}
                    min="0"
                    placeholder="Enter unit selling price"
                />
            </div>

            <div className="mb-4">
                <label
                    htmlFor="new_expiry_date"
                    className="block text-sm font-medium text-neutral-700 mb-1"
                >
                    New Expiry date
                </label>
                <input
                    type="date"
                    id="new_expiry_date"
                    name="new_expiry_date"
                    className="w-full border border-neutral-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-300"
                     value={newProductStockDetails.new_expiry_date}
                     onChange={handleProductStockChange}
                    min="0"
                    placeholder="Enter unit selling price"
                />
            </div>
        </>
    );
};

export default SellingPriceChangeSection;
