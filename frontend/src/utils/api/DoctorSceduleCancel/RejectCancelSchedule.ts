import api from "../axios";
export const rejectCancelSchedule = (id: string, rejectReason: string) => {
    return api.post(`/schedules/cancel/reject/${id}`, {
        reject_reason: rejectReason,
    });
};
