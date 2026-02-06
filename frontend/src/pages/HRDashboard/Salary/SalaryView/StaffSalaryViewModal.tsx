import React from "react";
import { StaffSalaryViewModalProps } from "../../../../utils/types/Salary/ISalary.ts";

const StaffSalaryViewModal: React.FC<StaffSalaryViewModalProps> = ({
    isOpen,
    salary,
    onClose,
}) => {
    if (!isOpen || !salary) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
                <h2 className="text-xl font-semibold mb-4 text-center">
                    Staff Salary Details
                </h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <strong>Name:</strong>
                            <p>
                                {salary.user_first_name} {salary.user_last_name}
                            </p>
                        </div>
                        <div>
                            <strong>Branch:</strong>
                            <p>{salary.branch_center_name}</p>
                        </div>
                        <div>
                            <strong>Basic Salary:</strong>
                            <p>{salary.basic_salary_amount || "N/A"}</p>
                        </div>
                        <div>
                            <strong>Allocation Amount:</strong>
                            <p>{salary.allocation_amount || "N/A"}</p>
                        </div>
                        <div>
                            <strong>Rate per Hour:</strong>
                            <p>{salary.rate_for_hour || "N/A"}</p>
                        </div>
                        <div>
                            <strong>Maximum Hours:</strong>
                            <p>{salary.maximum_hours_can_work || "N/A"}</p>
                        </div>
                    </div>

                    <h3 className="text-xl font-semibold mb-4 text-center">
                        Bank Details
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="table-auto w-full border-collapse border border-neutral-300">
                            <tbody>
                                <tr>
                                    <td className="border border-neutral-300 px-4 py-2">
                                        Bank Name
                                    </td>
                                    <td className="border border-neutral-300 px-4 py-2">
                                        {salary.bank_name || "N/A"}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-neutral-300 px-4 py-2">
                                        Branch Name
                                    </td>
                                    <td className="border border-neutral-300 px-4 py-2">
                                        {salary.branch_name || "N/A"}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-neutral-300 px-4 py-2">
                                        Branch Code
                                    </td>
                                    <td className="border border-neutral-300 px-4 py-2">
                                        {salary.branch_code || "N/A"}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-neutral-300 px-4 py-2">
                                        Account Number
                                    </td>
                                    <td className="border border-neutral-300 px-4 py-2">
                                        {salary.account_number || "N/A"}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-neutral-300 px-4 py-2">
                                        Account Name
                                    </td>
                                    <td className="border border-neutral-300 px-4 py-2">
                                        {salary.account_owner_name || "N/A"}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 bg-neutral-300 text-neutral-700 rounded-md hover:bg-gray-400"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default StaffSalaryViewModal;
