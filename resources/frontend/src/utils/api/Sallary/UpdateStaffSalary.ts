import axios from "axios";

export const updateStaffSalary = (salaryData: {
    id: string;
    [key: string]: any;
}) => {
    return axios.put(`/api/update-staff-salary/${salaryData.id}`, salaryData);
};
