import { TableProps } from "../../../../../utils/types/pos/IPurchasing.ts";
import React from "react";

const SuperAdminTable: React.FC<TableProps> = ({ data, onRowClick }) => {
    return (
        <table className="min-w-full divide-y divide-gray-200 border border-neutral-200">
            <thead className="bg-neutral-50">
                <tr>
                    {[
                        "Invoice ID",
                        "Discount Amount",
                        "Total Amount",
                        "Amount Received",
                        "Net Amount",
                        "Remaining Amount",
                    ].map((header) => (
                        <th
                            key={header}
                            className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                        >
                            {header}
                        </th>
                    ))}
                </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
                {data.length > 0 ? (
                    data.map((item) => (
                        <tr
                            key={item.bill_id}
                            className="hover:bg-neutral-50 cursor-pointer"
                            onClick={() => onRowClick(item)}
                        >
                            {[
                                item.invoice_id,
                                `LKR ${item.discount_amount}`,
                                `LKR ${item.total_amount}`,
                                `LKR ${item.amount_received}`,
                                `LKR ${item.net_total}`,
                                `LKR ${item.remain_amount}`,
                            ].map((cell, index) => (
                                <td
                                    key={index}
                                    className="px-6 py-4 text-sm text-neutral-900"
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td
                            colSpan={5}
                            className="px-6 py-4 text-center text-sm text-neutral-500"
                        >
                            No purchasing items found.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};

export default SuperAdminTable;
