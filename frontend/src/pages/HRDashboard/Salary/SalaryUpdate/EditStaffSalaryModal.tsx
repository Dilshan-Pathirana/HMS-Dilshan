import React, { useState, useEffect } from "react";
import { IUser } from "../../../../utils/types/users/Iuser";
import alert from "../../../../utils/alert";
import { getAllUsers } from "../../../../utils/api/dashboard/StaffAndUsers/GetAllUsers.ts";
import { EditStaffSalaryModalProps } from "../../../../utils/types/Salary/ISalary.ts";
import { updateStaffSalary } from "../../../../utils/api/Sallary/UpdateStaffSalary.ts";
import BankDetailsForm from "../SalaryCreate/BankDetailsForm.tsx";

const EditStaffSalaryModal: React.FC<EditStaffSalaryModalProps> = ({
    isOpen,
    salary,
    onClose,
    onSalaryUpdated,
}) => {
    const [users, setUsers] = useState<IUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const [basicSalary, setBasicSalary] = useState<string>("");
    const [allocationAmount, setAllocationAmount] = useState<string>("");
    const [rateForHour, setRateForHour] = useState<string>("");
    const [maxHours, setMaxHours] = useState<string>("");
    const [bankName, setBankName] = useState<string>("");
    const [branchName, setBranchName] = useState<string>("");
    const [branchCode, setBranchCode] = useState<string>("");
    const [accountNumber, setAccountNumber] = useState<string>("");
    const [accountOwnerName, setAccountOwnerName] = useState<string>("");
    const [showBankDetails, setShowBankDetails] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        if (!salary) return;

        setBasicSalary(salary.basic_salary_amount);
        setAllocationAmount(salary.allocation_amount || "");
        setRateForHour(salary.rate_for_hour || "");
        setMaxHours(salary.maximum_hours_can_work || "");
        setBankName(salary.bank_name || "");
        setBranchName(salary.branch_name || "");
        setBranchCode(salary.branch_code || "");
        setAccountNumber(salary.account_number || "");
        setAccountOwnerName(salary.account_owner_name || "");

        const fetchUsers = async () => {
            try {
                const response = await getAllUsers();
                const usersList: IUser[] = response.data.users;
                setUsers(usersList);

                const user = usersList.find(
                    (user) => user.id === salary.user_id,
                );
                setSelectedUser(user || null);
            } catch {
                alert.warn("Error fetching users. Please try again later.");
            }
        };

        fetchUsers();
    }, [salary]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!salary) return;

        const isBankDetailsPartial =
            bankName ||
            branchName ||
            branchCode ||
            accountNumber ||
            accountOwnerName;
        const areAllBankDetailsProvided =
            bankName &&
            branchName &&
            branchCode &&
            accountNumber &&
            accountOwnerName;

        if (isBankDetailsPartial && !areAllBankDetailsProvided) {
            setError(
                "All bank details (Bank Name, Branch Name, Branch Code, Account Number, and Account Owner Name) must be filled if any one of them is provided.",
            );
            return;
        }

        if ((rateForHour && !maxHours) || (!rateForHour && maxHours)) {
            setError(
                "Both Rate per Hour and Maximum Hours must be filled out.",
            );
            return;
        } else {
            setError("");
        }

        const updatedSalary = {
            id: salary.id,
            user_id: selectedUser?.id || "",
            branch_id: selectedUser?.branch_id || salary.branch_id,
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
            const response = await updateStaffSalary(updatedSalary);
            if (response.status === 200) {
                alert.success("Salary updated successfully!");
                onClose();
                onSalaryUpdated();
            } else {
                alert.error("Failed to update salary. Please try again.");
            }
        } catch {
            alert.error("An unexpected error occurred.");
        }
    };

    if (!isOpen || !salary) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-2/3">
                <h2 className="text-lg font-semibold mb-4">
                    Edit Staff Salary
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Select User
                            </label>
                            <select
                                value={selectedUser?.id || ""}
                                onChange={(e) => {
                                    const user = users.find(
                                        (user: IUser) =>
                                            user.id === e.target.value,
                                    );
                                    setSelectedUser(user || null);
                                }}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Branch
                            </label>
                            <input
                                type="text"
                                value={
                                    selectedUser?.center_name ||
                                    salary.branch_center_name
                                }
                                readOnly
                                className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-100 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Basic Salary
                            </label>
                            <input
                                type="number"
                                value={basicSalary}
                                onChange={(e) => setBasicSalary(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Allocation Amount
                            </label>
                            <input
                                type="number"
                                value={allocationAmount}
                                onChange={(e) =>
                                    setAllocationAmount(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Rate per Hour
                            </label>
                            <input
                                type="number"
                                value={rateForHour}
                                onChange={(e) => setRateForHour(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Maximum Hours
                            </label>
                            <input
                                type="number"
                                value={maxHours}
                                onChange={(e) => setMaxHours(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <button
                            type="button"
                            onClick={() => setShowBankDetails(!showBankDetails)}
                            className="text-primary-500 hover:underline"
                        >
                            {showBankDetails
                                ? "Hide Bank Details"
                                : "Add/Edit Bank Details"}
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
                        <p className="text-error-500 text-sm mb-4">{error}</p>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-neutral-300 text-neutral-700 rounded-md hover:bg-gray-400 mr-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary-500 rounded-lg hover:bg-primary-600 text-white"
                        >
                            Update Salary
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditStaffSalaryModal;
