import axios from "axios";

export const getAllStaffSalaryPay = () => {
    return axios.get(`api/get-all-staff-salary-pay`);
};

export const getFilteredStaffSalaryPay = (filters: {
    user_id?: string | null;
    status?: string | null;
    month?: string | null;
}) => {
    return axios.get('/api/get-all-staff-salary-pay-filter', {
        params: filters,
    });
};
