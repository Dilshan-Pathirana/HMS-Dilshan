import api from "../axios";

export const getAllStaffSalaryPay = () => {
    return api.get(`api/get-all-staff-salary-pay`);
};

export const getFilteredStaffSalaryPay = (filters: {
    user_id?: string | null;
    status?: string | null;
    month?: string | null;
}) => {
    return api.get('/hr/salary/payments', {
        params: filters,
    });
};
