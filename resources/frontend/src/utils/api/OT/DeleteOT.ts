import axios from "axios";

export const deleteOTRecord = (OTId: string) => {
    return axios.delete(`api/delete-employee-ot/${OTId}`);
};
