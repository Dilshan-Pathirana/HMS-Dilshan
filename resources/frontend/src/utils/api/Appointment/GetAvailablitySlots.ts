import axios from "axios";

export const CheckDoctorAvailability = (data: {
    doctor_id: string;
    appointment_date?: string;
    schedule_day: string;
    branch_id: string;
}) => {
    return axios.post("/api/check-doctor-availability-user", data);
};
