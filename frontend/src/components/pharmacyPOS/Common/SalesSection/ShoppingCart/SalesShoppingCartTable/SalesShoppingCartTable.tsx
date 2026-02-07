import React from "react";
import {
    calculateFinalPrice,
    isReachedMaximumQuantity,
    showDiscount,
} from "../../../CommonFunctionalities.ts";
import MaximumStockReachAlert from "../../../MaximumStockReachAlert.tsx";
import { Trash2, Plus, Minus } from "lucide-react";
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
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-neutral-50 sticky top-0 z-10">
                    <tr className="border-b border-neutral-200 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Product</th>
                        <th className="py-3 px-4">Price</th>
                        <th className="py-3 px-4">Disc.</th>
                        <th className="py-3 px-4">Quantity</th>
                        <th className="py-3 px-4">Total</th>
                        <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                    {cart.map((item) => (
                        <tr key={item.id} className="group hover:bg-neutral-50/50 transition-colors">
                            <td className="py-3 px-4 font-medium text-neutral-800 text-sm">{item.item_name}</td>
                            <td className="py-3 px-4 text-neutral-600 text-sm">{item.unit_selling_price}</td>
                            <td className="py-3 px-4 text-neutral-600 text-sm">{showDiscount(item)}</td>
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() =>
                                            handleUpdateQuantity(
                                                item.id,
                                                (item.quantity || 1) - 1,
                                            )
                                        }
                                        disabled={item.quantity === 1}
                                        className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Minus className="w-3 h-3" />
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
                                        className="w-12 text-center text-sm font-medium border border-neutral-200 rounded py-1 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
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
                                        className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
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
                            <td className="py-3 px-4 font-bold text-neutral-800 text-sm">
                                {calculateFinalPrice(item).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center">
                                <button
                                    onClick={() => handleRemoveFromCart(item.id)}
                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {cart.length === 0 && (
                        <tr>
                            <td colSpan={6} className="py-12 text-center text-neutral-400 text-sm">
                                Cart is empty
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default SalesShoppingCartTable;
