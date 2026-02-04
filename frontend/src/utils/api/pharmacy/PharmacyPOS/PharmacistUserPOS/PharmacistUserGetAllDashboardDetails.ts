import api from "../../../axios";

export const getAllDashboardDetails = () => {
    return api.get('api/pharmacist-user-dashboard-details')
}
