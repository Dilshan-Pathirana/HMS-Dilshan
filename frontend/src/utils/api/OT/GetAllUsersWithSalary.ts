import api from "../axios";

export const getAllUsersWithSalary = () => {
    return api.get('api/get-all-users-with-salary')
}
