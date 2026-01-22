export interface IStaffSalaryPay {
    id: string;
    user_id: string;
    user_first_name: string;
    user_last_name: string;
    branch_id: string;
    branch_center_name: string;
    paid_salary_amount: string;
    month: string;
    status: "paid" | "unpaid";
    basic_salary_amount: string;
    allocation_amount: string;
    total_hours_worked: string;
    total_ot_amount: string;
    bank_name?: string;
    branch_name?: string;
    branch_code?: string;
    account_number?: string;
    account_owner_name?: string;
}

export interface StaffSalaryTableProps {
    paginatedData: IStaffSalaryPay[];
    handleView: (salaryPay: IStaffSalaryPay) => void;
    handlePrint: (salaryPay: IStaffSalaryPay) => void;
    handleStatusUpdate: (id: string, status: string) => void;
}

export interface StaffSalaryFilterProps {
    handleFilter: (filters: {
        user_id?: string | null;
        status?: string | null;
        month?: string | null;
    }) => void;
}
