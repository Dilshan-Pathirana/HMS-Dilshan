import axios from "axios";

export const addShift = (shiftData: {
    user_id: string;
    branch_id: string;
    days_of_week: string;
    shift_type: string;
    start_time: string;
    end_time: string;
    notes: string;
}) => {
    return axios.post("/api/create-shift", shiftData);
};
