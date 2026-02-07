import { ShoppingCartProps } from "../../../../../utils/types/pos/IPurchasing.ts";
import React from "react";
import SalesShoppingCartTable from "./SalesShoppingCartTable/SalesShoppingCartTable.tsx";
import SalesBillTotalAmountDetails from "./SalesBillTotalAmountDetails.tsx";
import { CreditCard, ArrowRight } from "lucide-react";

const SalesShoppingCart: React.FC<ShoppingCartProps> = ({
    cart,
    total,
    totalDiscount,
    netTotal,
    isReachedMaximumStock,
    maximumReachedProduct,
    handleUpdateQuantity,
    handleRemoveFromCart,
    onProcessPayment,
}) => {
    const handleInputChange = (id: string, value: string) => {
        const newQuantity = parseInt(value);
        if (!isNaN(newQuantity) && newQuantity > 0) {
            handleUpdateQuantity(id, newQuantity);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 flex flex-col h-[calc(100vh-140px)] sticky top-24">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50 rounded-t-2xl">
                <h2 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                    <span className="w-2 h-6 bg-primary-500 rounded-full"></span>
                    Current Order
                </h2>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-bold rounded-full">
                    {cart.length} Items
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <SalesShoppingCartTable
                    cart={cart}
                    handleUpdateQuantity={handleUpdateQuantity}
                    isReachedMaximumStock={isReachedMaximumStock}
                    maximumReachedProduct={maximumReachedProduct}
                    handleInputChange={handleInputChange}
                    handleRemoveFromCart={handleRemoveFromCart}
                />
            </div>

            <div className="p-5 bg-neutral-50 border-t border-neutral-200 rounded-b-2xl space-y-4">
                <SalesBillTotalAmountDetails
                    total={total}
                    totalDiscount={totalDiscount}
                    netTotal={netTotal}
                />

                <button
                    onClick={onProcessPayment}
                    disabled={cart.length === 0}
                    className={`
                        w-full py-4 rounded-xl flex items-center justify-between px-6 font-bold text-lg shadow-lg transition-all transform active:scale-95
                        ${cart.length === 0
                            ? "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
                            : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-500/30"
                        }
                    `}
                >
                    <span className="flex items-center gap-2">
                        <CreditCard className="w-6 h-6" />
                        Process Payment
                    </span>
                    {cart.length > 0 && (
                        <ArrowRight className="w-5 h-5 animate-pulse" />
                    )}
                </button>
            </div>
        </div>
    );
};

export default SalesShoppingCart;
