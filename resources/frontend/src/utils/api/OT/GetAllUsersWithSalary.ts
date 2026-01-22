import axios from 'axios'

export const getAllUsersWithSalary = () => {
    return axios.get('api/get-all-users-with-salary')
}
