import api from "../axios";

export const deleteOTRecord = (OTId: string) => {
    return api.delete(`api/delete-employee-ot/${OTId}`);
};
