import React from "react";
import {
    calculateFinalPrice,
    isReachedMaximumQuantity,
    showDiscount,
} from "../../../CommonFunctionalities.ts";
import MaximumStockReachAlert from "../../../MaximumStockReachAlert.tsx";
import { Trash2 } from "lucide-react";
import { ShoppingCartTableProps } from "../../../../../../utils/types/pos/IPurchasing.ts";
import SalesShoppingCartTableHeader from "./SalesShoppingCartTableHeader.tsx";

const SalesShoppingCartTable: React.FC<ShoppingCartTableProps> = ({
    cart,
    handleUpdateQuantity,
    handleInputChange,
    isReachedMaximumStock,
    maximumReachedProduct,
    handleRemoveFromCart,
}) => {
    return (
        <table className="w-full text-left">
            <SalesShoppingCartTableHeader />
            <tbody>
                {cart.map((item) => (
                    <tr key={item.id} className="border-b">
                        <td className="py-2">{item.item_name}</td>
                        <td className="py-2">{item.unit_selling_price}</td>
                        <td className="py-2">{showDiscount(item)}</td>
                        <td className="py-2">
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() =>
                                        handleUpdateQuantity(
                                            item.id,
                                            (item.quantity || 1) - 1,
                                        )
                                    }
                                    disabled={item.quantity === 1}
                                    className="px-2 bg-gray-200 rounded disabled:cursor-not-allowed"
                                >
                                    -
                                </button>
                                <input
                                    type="text"
                                    value={item.quantity || 0}
                                    onChange={(e) =>
                                        handleInputChange(
                                            item.id,
                                            e.target.value,
                                        )
                                    }
                                    className="w-12 text-center border rounded appearance-none"
                                    disabled={isReachedMaximumQuantity(
                                        item.id,
                                        maximumReachedProduct,
                                        isReachedMaximumStock,
                                    )}
                                />
                                <button
                                    onClick={() =>
                                        handleUpdateQuantity(
                                            item.id,
                                            (item.quantity || 1) + 1,
                                        )
                                    }
                                    disabled={isReachedMaximumQuantity(
                                        item.id,
                                        maximumReachedProduct,
                                        isReachedMaximumStock,
                                    )}
                                    className="px-2 bg-gray-200 rounded disabled:cursor-not-allowed"
                                >
                                    +
                                </button>
                                <MaximumStockReachAlert
                                    itemId={item.id}
                                    maximumReachedProduct={
                                        maximumReachedProduct
                                    }
                                    isReachedMaximumStock={
                                        isReachedMaximumStock
                                    }
                                />
                            </div>
                        </td>
                        <td className="py-2">
                            {calculateFinalPrice(item).toFixed(2)}
                        </td>
                        <td className="py-2">
                            <button
                                onClick={() => handleRemoveFromCart(item.id)}
                            >
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default SalesShoppingCartTable;
