import axios from "axios";
export const rejectCancelSchedule = (id: string, rejectReason: string) => {
    return axios.post(`/api/reject-cancel-schedule/${id}`, {
        reject_reason: rejectReason,
    });
};
