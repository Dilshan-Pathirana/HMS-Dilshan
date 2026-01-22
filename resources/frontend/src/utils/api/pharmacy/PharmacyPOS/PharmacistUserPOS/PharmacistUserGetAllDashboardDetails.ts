import axios from 'axios'

export const getAllDashboardDetails = () => {
    return axios.get('api/pharmacist-user-dashboard-details')
}
