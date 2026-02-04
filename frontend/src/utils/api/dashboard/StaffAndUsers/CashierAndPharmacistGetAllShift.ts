import api from "../../axios";

export const getAllCashierShifts = (userId: string) => {
    return api.get(`/get-all-cashier-user-shifts/${userId}`);
};

export const getAllPharmacistShifts = (userId: string) => {
    return api.get(`/get-all-pharmacist-user-shifts/${userId}`);
};
