import React from "react";
import { SalesBillTotalAmountDetailsProps } from "../../../../../utils/types/pos/IPurchasing.ts";
const SalesBillTotalAmountDetails: React.FC<
    SalesBillTotalAmountDetailsProps
> = ({ total, totalDiscount, netTotal }) => {
    return (
        <div>
            <table>
                <tbody>
                    <tr className="font-bold">
                        <td>Total</td>
                        <td>{total.toFixed(2)}</td>
                    </tr>
                    <tr className="font-bold text-green-500">
                        <td>Discount: </td>
                        <td>{totalDiscount.toFixed(2)}</td>
                    </tr>
                    <tr className="text-xl font-bold">
                        <td>Net Total: </td>
                        <td>{netTotal.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default SalesBillTotalAmountDetails;
