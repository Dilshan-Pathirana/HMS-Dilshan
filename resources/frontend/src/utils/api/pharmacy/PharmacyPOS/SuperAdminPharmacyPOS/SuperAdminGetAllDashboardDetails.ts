import axios from 'axios'

export const getAllDashboardDetails = () => {
    return axios.get('api/dashboard-details')
}
