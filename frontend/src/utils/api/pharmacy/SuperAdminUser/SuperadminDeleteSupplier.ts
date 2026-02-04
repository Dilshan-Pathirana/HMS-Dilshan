import api from "../../axios";

export const deleteSuperAdminSupplier = (id: string) => {
    return api.delete(`/delete-supplier/${id}`);
};
