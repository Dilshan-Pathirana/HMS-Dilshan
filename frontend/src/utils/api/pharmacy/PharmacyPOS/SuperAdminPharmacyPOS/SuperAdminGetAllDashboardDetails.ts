import api from "../../../axios";

export const getAllDashboardDetails = () => {
    return api.get('api/dashboard-details')
}
