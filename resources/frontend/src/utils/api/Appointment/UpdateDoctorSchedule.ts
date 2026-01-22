import axios from "axios";

export const updateDoctorSchedule = (scheduleData: {
    id: string;
    [key: string]: any;
}) => {
    return axios.put(`/api/update-doctor-schedule/${scheduleData.id}`, scheduleData);
};
