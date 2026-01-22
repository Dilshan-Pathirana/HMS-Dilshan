import axios from "axios";

export const deleteSuperAdminProduct = (id: string) => {
    return axios.delete(`/api/delete-product/${id}`);
};
