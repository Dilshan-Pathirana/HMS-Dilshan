import api from "../axios";

export const deleteStaffSalary = (salaryId: string) => {
    return api.delete(`api/delete-staff-salary/${salaryId}`);
};
