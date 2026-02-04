import api from "../axios";

export const addSalary = async (SalaryData: object) => {
    return api.post("/hr/salary", SalaryData);
};
