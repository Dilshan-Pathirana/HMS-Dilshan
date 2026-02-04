import api from "../axios";

export const getAllPatientAppointments = () => {
    return api.get(`api/get-all-patient-appointment`);
};
