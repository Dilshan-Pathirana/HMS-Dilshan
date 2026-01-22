import axios from "axios";

export const deleteStaffSalary = (salaryId: string) => {
    return axios.delete(`api/delete-staff-salary/${salaryId}`);
};
