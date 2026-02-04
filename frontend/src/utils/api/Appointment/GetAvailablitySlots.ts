import api from "../axios";

export const CheckDoctorAvailability = (data: {
    doctor_id: string;
    appointment_date?: string;
    schedule_day: string;
    branch_id: string;
}) => {
    return api.post("/schedules/check-availability", data);
};
