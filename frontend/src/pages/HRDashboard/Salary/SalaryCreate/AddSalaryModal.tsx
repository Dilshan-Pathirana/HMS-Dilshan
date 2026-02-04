import React, { useState, useEffect } from "react";
import { getAllUsers } from "../../../../utils/api/dashboard/StaffAndUsers/GetAllUsers.ts";
import api from "../../../../utils/api/axios";
import axios from "axios";
import alert from "../../../../utils/alert";
import { addSalary } from "../../../../utils/api/Sallary/AddSalary.ts";
import {
    AddSalaryModalProps,
    User,
} from "../../../../utils/types/Salary/ISalary.ts";
import BankDetailsForm from "./BankDetailsForm.tsx";

const AddSalaryModal: React.FC<AddSalaryModalProps> = ({
    closeModal,
    onSalaryAdded,
}) => {
    const [basicSalary, setBasicSalary] = useState<string>("");
    const [allocationAmount, setAllocationAmount] = useState<string>("");
    const [rateForHour, setRateForHour] = useState<string>("");
    const [maxHours, setMaxHours] = useState<string>("");
    const [selectedUser, setSelectedUser] = useState<string>("");
    const [selectedBranch, setSelectedBranch] = useState<string>("");
    const [branchId, setBranchId] = useState<string>("");
    const [bankName, setBankName] = useState<string>("");
    const [branchName, setBranchName] = useState<string>("");
    const [branchCode, setBranchCode] = useState<string>("");
    const [accountNumber, setAccountNumber] = useState<string>("");
    const [accountOwnerName, setAccountOwnerName] = useState<string>("");
    const [users, setUsers] = useState<User[]>([]);
    const [error, setError] = useState<string>("");
    const [showBankDetails, setShowBankDetails] = useState<boolean>(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await getAllUsers();
                if (response.status === 200) {
                    setUsers(response.data.users);
                } else {
                    alert.warn(
                        response.data.message || "Failed to fetch users.",
                    );
                }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    alert.error(
                        error.response?.data?.message ||
                            "An error occurred while fetching users.",
                    );
                } else {
                    alert.error("An unexpected error occurred.");
                }
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            const user = users.find((u) => u.id === selectedUser);
            if (user) {
                setSelectedBranch(user.center_name);
                setBranchId(user.branch_id);
            }
        }
    }, [selectedUser, users]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const isBankDetailsPartial =
            bankName || branchName || branchCode || accountNumber || accountOwnerName;

        const areAllBankDetailsProvided =
            bankName && branchName && branchCode && accountNumber && accountOwnerName;

        if (isBankDetailsPartial && !areAllBankDetailsProvided) {
            setError(
                "All bank details (Bank Name, Branch Name, Branch Code, Account Number, and Account Owner Name) must be filled if any one of them is provided."
            );
            return;
        }

        if ((rateForHour && !maxHours) || (!rateForHour && maxHours)) {
            setError("Both Rate per Hour and Maximum Hours must be filled out.");
            return;
        } else {
            setError("");
        }

        const payload = {
            user_id: selectedUser,
            branch_id: branchId,
            basic_salary_amount: basicSalary,
            allocation_amount: allocationAmount,
            rate_for_hour: rateForHour,
            maximum_hours_can_work: maxHours,
            bank_name: bankName,
            branch_name: branchName,
            branch_code: branchCode,
            account_number: accountNumber,
            account_owner_name: accountOwnerName,
        };

        try {
            const response = await addSalary(payload);
            if (response.status === 200) {
                alert.success("Staff salary added successfully!");
                onSalaryAdded();
                closeModal();
            } else {
                alert.warn("Failed to add staff salary. Please try again.");
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                alert.error(
                    error.response?.data?.message ||
                    "An error occurred while adding staff salary."
                );
            } else {
                alert.error("An unexpected error occurred.");
            }
        }
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-2/3">
                <h2 className="text-lg font-semibold mb-4">Add Salary</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* User and Branch Fields */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select User
                            </label>
                            <select
                                value={selectedUser}
                                onChange={(e) =>
                                    setSelectedUser(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select User</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {`${user.first_name} ${user.last_name}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Branch Name
                            </label>
                            <input
                                type="text"
                                value={selectedBranch}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Basic Salary
                            </label>
                            <input
                                type="number"
                                value={basicSalary}
                                onChange={(e) => setBasicSalary(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter basic salary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Allocation Amount
                            </label>
                            <input
                                type="number"
                                value={allocationAmount}
                                onChange={(e) =>
                                    setAllocationAmount(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter allocation amount"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rate per Hour
                            </label>
                            <input
                                type="number"
                                value={rateForHour}
                                onChange={(e) => setRateForHour(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter rate per hour"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Maximum Hours
                            </label>
                            <input
                                type="number"
                                value={maxHours}
                                onChange={(e) => setMaxHours(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter maximum hours"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <button
                            type="button"
                            onClick={() => setShowBankDetails(!showBankDetails)}
                            className="text-blue-600 hover:underline"
                        >
                            {showBankDetails
                                ? "Hide Bank Details"
                                : "Add Bank Details"}
                        </button>
                        {showBankDetails && (
                            <BankDetailsForm
                                bankName={bankName}
                                setBankName={setBankName}
                                branchName={branchName}
                                setBranchName={setBranchName}
                                branchCode={branchCode}
                                setBranchCode={setBranchCode}
                                accountNumber={accountNumber}
                                setAccountNumber={setAccountNumber}
                                accountOwnerName={accountOwnerName}
                                setAccountOwnerName={setAccountOwnerName}
                            />
                        )}
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm mb-4">{error}</p>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 mr-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-white"
                        >
                            Add Salary
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSalaryModal;
