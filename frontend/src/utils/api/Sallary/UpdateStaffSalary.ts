import api from "../axios";

export const updateStaffSalary = (salaryData: {
    id: string;
    [key: string]: any;
}) => {
    return api.put(`/update-staff-salary/${salaryData.id}`, salaryData);
};
