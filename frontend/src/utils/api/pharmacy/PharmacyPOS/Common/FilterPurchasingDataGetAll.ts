import api from "../../../axios";
import alert from "../../../../alert";

export const getAllFilterPurchasingData = (
    userRole: number,
    selectedMonth: string | null,
    selectedYear: string,
    selectedDate: string | null,
) => {
    let endpoint = "";

    if (userRole === 1) {
        endpoint = "api/fetch-purchasing-details";
    }

    if (userRole === 3) {
        endpoint = "api/cashier-fetch-purchasing-details";
    }

    if (userRole === 4) {
        endpoint = "api/pharmacist-user-fetch-purchasing-details";
    }

    if (selectedMonth) {
        const yearToSend = selectedYear || new Date().getFullYear();
        endpoint += `?month=${selectedMonth}&year=${yearToSend}`;
    } else if (selectedYear) {
        endpoint += `?year=${selectedYear}`;
    } else if (selectedDate) {
        endpoint += `?date=${selectedDate}`;
    }

    return api.get(endpoint).then((res: any) => {
        const list = res?.purchasing ?? res?.data?.purchasing;
        if (Array.isArray(list) && list.length === 0) {
            alert.warn("No purchasing records available/found");
        }
        return res;
    });
};
