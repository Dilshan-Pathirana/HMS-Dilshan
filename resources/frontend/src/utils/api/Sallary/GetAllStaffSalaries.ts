import axios from "axios";

export const getAllStaffSalaries = () => {
    return axios.get(`api/get-all-staff-salary`);
};
