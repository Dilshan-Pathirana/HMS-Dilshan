import axios from "axios";

export const getAllPatientAppointments = () => {
    return axios.get(`api/get-all-patient-appointment`);
};
