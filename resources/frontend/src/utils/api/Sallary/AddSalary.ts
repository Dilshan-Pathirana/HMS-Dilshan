import axios from "axios";

export const addSalary = async (SalaryData: object) => {
    return axios.post("/api/create-staff-salary", SalaryData);
};
