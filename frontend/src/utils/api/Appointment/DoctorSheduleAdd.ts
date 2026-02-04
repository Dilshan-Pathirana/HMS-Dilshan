import api from "../axios";

export const addDoctorSchedule = async (scheduleData: object) => {
    return api.post("/schedules", scheduleData);
};
