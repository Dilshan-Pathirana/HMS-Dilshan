import React from "react";
import { isReachedMaximumQuantity } from "./CommonFunctionalities.ts";
import { MaximumStockReachAlertProps } from "../../../utils/types/pos/IPurchasing.ts";
const MaximumStockReachAlert: React.FC<MaximumStockReachAlertProps> = ({
    itemId,
    maximumReachedProduct,
    isReachedMaximumStock,
}) => {
    return isReachedMaximumQuantity(
        itemId,
        maximumReachedProduct,
        isReachedMaximumStock,
    ) ? (
        <p className="text-red-500">Reached stock limit</p>
    ) : (
        ""
    );
};

export default MaximumStockReachAlert;
