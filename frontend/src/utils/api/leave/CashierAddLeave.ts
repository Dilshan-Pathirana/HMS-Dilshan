import api from "../axios";

export const addCashierLeave = async (leaveData: object) => {
    return api.post("/hr/leave", leaveData);
};
