import axios from "axios";

export const addCashierLeave = async (leaveData: object) => {
    return axios.post("/api/cashier-user-add-leave", leaveData);
};
