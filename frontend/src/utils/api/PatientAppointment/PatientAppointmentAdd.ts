import api from "../axios";

export const addPatientAppointmentForAdmin = async (
    appointmentData: object,
) => {
    return api.post("/appointments", appointmentData);
};

export const addPatientAppointmentForPatient = async (
    appointmentData: object,
) => {
    return api.post("/appointments", appointmentData);
};

export const getPatientByPhone = async (phone: string) => {
    return api.get(`/patients/phone/${phone}`);
};
