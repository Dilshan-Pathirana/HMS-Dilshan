import api from "../../axios";

export const deleteSuperAdminProduct = (id: string) => {
    return api.delete(`/delete-product/${id}`);
};
