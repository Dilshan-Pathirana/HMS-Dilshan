import React from "react";

export interface User {
    id: string;
    first_name: string;
    last_name: string;
    branch_id: string;
    center_name: string;
}

export interface AddSalaryModalProps {
    onSalaryAdded: () => void;
    closeModal: () => void;
}

export interface StaffSalaryViewModalProps {
    isOpen: boolean;
    salary: {
        user_first_name: string;
        user_last_name: string;
        branch_center_name: string;
        basic_salary_amount: string | null;
        allocation_amount: string | null;
        rate_for_hour: string | null;
        maximum_hours_can_work: string | null;
        bank_name?: string;
        branch_name?: string;
        branch_code?: string;
        account_number?: string;
        account_owner_name?: string;
    } | null;
    onClose: () => void;
}

export interface EditStaffSalaryModalProps {
    isOpen: boolean;
    salary: {
        id: string;
        user_id: string;
        user_first_name: string;
        user_last_name: string;
        branch_id: string;
        branch_center_name: string;
        basic_salary_amount: string;
        allocation_amount: string | null;
        rate_for_hour: string | null;
        maximum_hours_can_work: string | null;
        bank_name?: string;
        branch_name?: string;
        branch_code?: string;
        account_number?: string;
        account_owner_name?: string;
    } | null;
    onClose: () => void;
    onSalaryUpdated: () => void;
}


export interface IStaffSalary {
    id: string;
    user_id: string;
    user_first_name: string;
    user_last_name: string;
    branch_id: string;
    branch_center_name: string;
    basic_salary_amount: string;
    allocation_amount: string | null;
    rate_for_hour: string | null;
    maximum_hours_can_work: string | null;
}


export interface BankDetailsFormProps {
    bankName: string;
    setBankName: React.Dispatch<React.SetStateAction<string>>;
    branchName: string;
    setBranchName: React.Dispatch<React.SetStateAction<string>>;
    branchCode: string;
    setBranchCode: React.Dispatch<React.SetStateAction<string>>;
    accountNumber: string;
    setAccountNumber: React.Dispatch<React.SetStateAction<string>>;
    accountOwnerName: string;
    setAccountOwnerName: React.Dispatch<React.SetStateAction<string>>;
}
