import api from "../../../axios";

export const getAllDashboardDetails = () => {
    return api.get('api/cashier-dashboard-details')
}
