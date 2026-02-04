import api from "../axios";

export const updateDoctorSchedule = (scheduleData: {
    id: string;
    [key: string]: any;
}) => {
    return api.put(`/update-doctor-schedule/${scheduleData.id}`, scheduleData);
};
