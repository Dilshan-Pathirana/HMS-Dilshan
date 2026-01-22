import axios from "axios";

export const deleteSuperAdminSupplier = (id: string) => {
    return axios.delete(`/api/delete-supplier/${id}`);
};
