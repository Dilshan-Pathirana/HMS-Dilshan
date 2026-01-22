import axios from "axios";

export const updateShift = (shiftData: { id: string; [key: string]: any }) => {
    return axios.put(`/api/update-shift/${shiftData.id}`, shiftData);
};
