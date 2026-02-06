import React from "react";
import { FiPrinter, FiEye, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { StaffSalaryTableProps } from "../../../../../utils/types/Salary/IStaffSalaryPay.ts";

const StaffSalaryTable: React.FC<StaffSalaryTableProps> = ({
    paginatedData,
    handleView,
    handlePrint,
    handleStatusUpdate,
}) => {
    return (
        <table className="min-w-full divide-y divide-gray-200 border border-neutral-200">
            <thead className="bg-neutral-50">
                <tr>
                    {[
                        "First Name",
                        "Last Name",
                        "Branch",
                        "Month",
                        "Paid Salary",
                        "Status",
                        "Actions",
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
                {paginatedData.map((salaryPay) => (
                    <tr
                        key={salaryPay.id}
                        className="hover:bg-neutral-50 cursor-pointer"
                    >
                        <td className="px-6 py-4 text-sm">
                            {salaryPay.user_first_name}
                        </td>
                        <td className="px-6 py-4 text-sm">
                            {salaryPay.user_last_name}
                        </td>
                        <td className="px-6 py-4 text-sm">
                            {salaryPay.branch_center_name}
                        </td>
                        <td className="px-6 py-4 text-sm">{salaryPay.month}</td>
                        <td className="px-6 py-4 text-sm">
                            {salaryPay.paid_salary_amount}
                        </td>
                        <td
                            className={`px-6 py-4 text-sm font-semibold ${
                                salaryPay.status === "paid"
                                    ? "text-green-600"
                                    : "text-error-600"
                            }`}
                        >
                            {salaryPay.status}
                        </td>
                        <td className="px-6 py-4 text-sm">
                            <div className="flex space-x-2">
                                <FiEye
                                    className="text-primary-500 cursor-pointer"
                                    onClick={() => handleView(salaryPay)}
                                />
                                {salaryPay.status === "unpaid" ? (
                                    <FiCheckCircle
                                        className="text-green-500 cursor-pointer"
                                        title="Mark as Paid"
                                        size={20}
                                        onClick={() =>
                                            handleStatusUpdate(
                                                salaryPay.id,
                                                "paid",
                                            )
                                        }
                                    />
                                ) : (
                                    <>
                                        <FiPrinter
                                            className="text-neutral-500 cursor-pointer"
                                            title="Print Salary Slip"
                                            size={20}
                                            onClick={() =>
                                                handlePrint(salaryPay)
                                            }
                                        />
                                        <FiXCircle
                                            className="text-error-500 cursor-pointer"
                                            title="Mark as Unpaid"
                                            size={20}
                                            onClick={() =>
                                                handleStatusUpdate(
                                                    salaryPay.id,
                                                    "unpaid",
                                                )
                                            }
                                        />
                                    </>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default StaffSalaryTable;
