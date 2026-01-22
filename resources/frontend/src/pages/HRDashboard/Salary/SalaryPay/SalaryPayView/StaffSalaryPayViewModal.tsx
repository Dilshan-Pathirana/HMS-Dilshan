import React from "react";
import { IStaffSalaryPay } from "../../../../../utils/types/Salary/IStaffSalaryPay.ts";

interface StaffSalaryPayViewModalProps {
    isOpen: boolean;
    salaryPay: IStaffSalaryPay | null;
    onClose: () => void;
}

const StaffSalaryPayViewModal: React.FC<StaffSalaryPayViewModalProps> = ({
    isOpen,
    salaryPay,
    onClose,
}) => {
    if (!isOpen || !salaryPay) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
                <h2 className="text-xl font-semibold mb-4 text-center">
                    Salary Payment Details
                </h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <strong>Name:</strong>
                            <p>
                                {salaryPay.user_first_name}{" "}
                                {salaryPay.user_last_name}
                            </p>
                        </div>
                        <div>
                            <strong>Branch:</strong>
                            <p>{salaryPay.branch_center_name}</p>
                        </div>
                        <div>
                            <strong>Month:</strong>
                            <p>{salaryPay.month}</p>
                        </div>
                        <div>
                            <strong>Basic Salary:</strong>
                            <p>{salaryPay.basic_salary_amount || "N/A"}</p>
                        </div>
                        <div>
                            <strong>Allocation Amount:</strong>
                            <p>{salaryPay.allocation_amount || "N/A"}</p>
                        </div>
                        <div>
                            <strong>Total Hours Worked:</strong>
                            <p>{salaryPay.total_hours_worked || "N/A"}</p>
                        </div>
                        <div>
                            <strong>Total OT Amount:</strong>
                            <p>{salaryPay.total_ot_amount || "N/A"}</p>
                        </div>
                        <div>
                            <strong>Status:</strong>
                            <p>{salaryPay.status || "N/A"}</p>
                        </div>
                        <div>
                            <strong>Paid Salary:</strong>
                            <p>{salaryPay.paid_salary_amount || "N/A"}</p>
                        </div>
                    </div>
                </div>

                <h3 className="text-xl font-semibold mb-4 text-center">
                    Bank Details
                </h3>

                <div className="overflow-x-auto">
                    <table className="table-auto w-full border-collapse border border-gray-300">
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 px-4 py-2">
                                    Bank Name
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                    {salaryPay.bank_name || "N/A"}
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 px-4 py-2">
                                    Branch Name
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                    {salaryPay.branch_name || "N/A"}
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 px-4 py-2">
                                    Branch Code
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                    {salaryPay.branch_code || "N/A"}
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 px-4 py-2">
                                    Account Number
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                    {salaryPay.account_number || "N/A"}
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 px-4 py-2">
                                    Account Name
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                    {salaryPay.account_owner_name || "N/A"}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default StaffSalaryPayViewModal;
