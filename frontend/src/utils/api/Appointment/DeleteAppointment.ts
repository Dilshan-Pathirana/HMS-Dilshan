import api from "../axios";

export const deleteAppointment = (Id: string) => {
    return api.delete(`api/delete-appointment/${Id}`);
};
