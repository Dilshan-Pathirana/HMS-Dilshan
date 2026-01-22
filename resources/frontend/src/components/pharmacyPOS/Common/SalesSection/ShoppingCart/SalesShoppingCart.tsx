import { ShoppingCartProps } from "../../../../../utils/types/pos/IPurchasing.ts";
import React from "react";
import SalesShoppingCartTable from "./SalesShoppingCartTable/SalesShoppingCartTable.tsx";
import SalesBillTotalAmountDetails from "./SalesBillTotalAmountDetails.tsx";

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
        <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">Shopping Cart</h2>
            <SalesShoppingCartTable
                cart={cart}
                handleUpdateQuantity={handleUpdateQuantity}
                isReachedMaximumStock={isReachedMaximumStock}
                maximumReachedProduct={maximumReachedProduct}
                handleInputChange={handleInputChange}
                handleRemoveFromCart={handleRemoveFromCart}
            />
            <SalesBillTotalAmountDetails
                total={total}
                totalDiscount={totalDiscount}
                netTotal={netTotal}
            />
            <div>
                <button
                    onClick={onProcessPayment}
                    disabled={cart.length === 0}
                    className={`px-4 py-2 rounded-lg text-white ${
                        cart.length === 0
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-green-500"
                    }`}
                >
                    Process Payment
                </button>
            </div>
        </div>
    );
};

export default SalesShoppingCart;
