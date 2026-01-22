import React from "react";
import { handleAddToCart } from "../CommonFunctionalities.ts";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../store.tsx";
import { ProductGridProps } from "../../../../utils/types/pos/IPurchasing.ts";

const SalesProductGrid: React.FC<ProductGridProps> = ({ filteredProducts }) => {
    const dispatch = useDispatch<AppDispatch>();

    return (
        <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-96">
            {filteredProducts.map((product) => (
                <button
                    key={product.id}
                    onClick={() => handleAddToCart(product, dispatch)}
                    className="bg-blue-500 text-white p-3 rounded-lg flex flex-col justify-center items-start h-auto hover:bg-blue-600 transition-colors text-left"
                >
                    <span className="font-bold text-md truncate">
                        {product.item_name}
                    </span>
                    <span className="text-sm text-gray-200 truncate">
                        Code: {product.item_code}
                    </span>
                    <span className="text-md">
                        LKR {product.unit_selling_price.toFixed(2)}
                    </span>
                </button>
            ))}
        </div>
    );
};

export default SalesProductGrid;
