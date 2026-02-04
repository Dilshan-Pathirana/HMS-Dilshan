import api from "../../axios";

export const deleteShifts = (shiftId: string) => {
    return api.delete(`api/delete-shift/${shiftId}`);
};
