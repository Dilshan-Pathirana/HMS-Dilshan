import axios from "axios";

export const deleteAppointment = (Id: string) => {
    return axios.delete(`api/delete-appointment/${Id}`);
};
