
import api from "../axios";
import axios from "axios";
import { UpdateUserParams } from "../../types/users/IUserEdit.ts";
import { UserRole } from "../../types/users/UserRole.ts";
import {
    mapCashierData,
    mapPharmacistData,
    mapDoctorData,
    mapStaffData
} from "../../types/users/IUserMap.ts";

export const updateUser = async ({
    userId,
    roleAs,
    userData,
}: UpdateUserParams) => {
    try {
        // Unified endpoint for all user updates
        const endpoint = `/users/${userId}`;

        const { user_id, ...restUserData } = userData;
        let mappedData;

        // Map data if needed, but primarily send generic user data for now
        // specialized fields might be ignored by backend unless extended
        if (roleAs === UserRole.Cashier) {
            mappedData = mapCashierData(userData);
        } else if (roleAs === UserRole.Pharmacist) {
            mappedData = mapPharmacistData(userData);
        }
        else if (roleAs === UserRole.Doctor) {
            mappedData = mapDoctorData(userData);
        }
        else {
            mappedData = mapStaffData(restUserData);
        }

        const response = await api.put(endpoint, mappedData);
        return response; // Interceptor unwraps data
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            throw new Error(
                error.response?.data?.message || "Failed to update user",
            );
        }
        throw error;
    }
};
