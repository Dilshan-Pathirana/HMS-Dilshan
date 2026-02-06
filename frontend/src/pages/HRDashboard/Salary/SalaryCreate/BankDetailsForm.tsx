import React from "react";
import { BankDetailsFormProps } from "../../../../utils/types/Salary/ISalary.ts";

const BankDetailsForm: React.FC<BankDetailsFormProps> = ({
    bankName,
    setBankName,
    branchName,
    setBranchName,
    branchCode,
    setBranchCode,
    accountNumber,
    setAccountNumber,
    accountOwnerName,
    setAccountOwnerName,
}) => {
    return (
        <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Bank Name
                </label>
                <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter bank name"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Branch Name
                </label>
                <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter branch name"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Branch Code
                </label>
                <input
                    type="text"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter branch code"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Account Number
                </label>
                <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter account number"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Account Owner Name
                </label>
                <input
                    type="text"
                    value={accountOwnerName}
                    onChange={(e) => setAccountOwnerName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter account owner name"
                />
            </div>
        </div>
    );
};

export default BankDetailsForm;
