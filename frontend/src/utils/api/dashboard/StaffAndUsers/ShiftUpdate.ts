import api from "../../axios";

export const updateShift = (shiftData: { id: string; [key: string]: any }) => {
    return api.put(`/update-shift/${shiftData.id}`, shiftData);
};
