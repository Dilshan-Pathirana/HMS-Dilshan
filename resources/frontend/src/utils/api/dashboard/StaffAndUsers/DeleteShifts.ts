import axios from "axios";

export const deleteShifts = (shiftId: string) => {
    return axios.delete(`api/delete-shift/${shiftId}`);
};
