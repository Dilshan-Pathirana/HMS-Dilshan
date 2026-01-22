import axios from "axios";

export const addPatientAppointmentForAdmin = async (
    appointmentData: object,
) => {
    return axios.post("/api/admin-create-patient-appointment", appointmentData);
};

export const addPatientAppointmentForPatient = async (
    appointmentData: object,
) => {
    return axios.post("/api/create-patient-appointment", appointmentData);
};

export const getPatientByPhone = async (phone: string) => {
    return axios.get(`/api/get-patient-by-phone/${phone}`);
};
