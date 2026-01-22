import axios from "axios";

export const getAllCashierShifts = (userId: string) => {
    return axios.get(`/api/get-all-cashier-user-shifts/${userId}`);
};

export const getAllPharmacistShifts = (userId: string) => {
    return axios.get(`/api/get-all-pharmacist-user-shifts/${userId}`);
};
