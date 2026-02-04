import api from "../axios";

export const getAllStaffSalaries = () => {
    return api.get(`api/get-all-staff-salary`);
};
