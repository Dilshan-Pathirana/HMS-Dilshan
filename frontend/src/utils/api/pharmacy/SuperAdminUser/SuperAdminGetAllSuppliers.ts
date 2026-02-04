import api from "../../axios";

export const getAllSuperAdminSuppliers = () => {
    return api.get('api/get-suppliers')
}
