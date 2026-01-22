import axios from "axios";
import { UpdateUserParams } from "../../types/users/IUserEdit.ts";
import { UserRole } from "../../types/users/UserRole.ts";
import {
    mapCashierData,
    mapPharmacistData,
    mapDoctorData
} from "../../types/users/IUserMap.ts";

export const updateUser = async ({
    userId,
    roleAs,
    userData,
}: UpdateUserParams) => {
    try {
        let endpoint;

        if (roleAs === UserRole.Cashier) {
            endpoint = `/api/update-cashier-user/${userId}`;
        } else if (roleAs === UserRole.Pharmacist) {
            endpoint = `/api/update-pharmacist-user/${userId}`;
        } else if (roleAs === UserRole.Patient) {
            endpoint = `/api/update-patient-user/${userId}`;
        } else if (roleAs === UserRole.Doctor) {
            endpoint = `/api/update-doctor-user/${userId}`;
        } else if (roleAs === UserRole.SupplierEntity) {
            endpoint = `/api/update-supplier-entity/${userId}`;
        } else if (roleAs === UserRole.SuperAdmin || roleAs === UserRole.Admin) {
            // Staff users with user_type (IT Assistant, Receptionist, etc.)
            endpoint = `/api/update-staff/${userId}`;
        } else {
            console.error(`Invalid user role for update: ${roleAs}`);
            return;
        }

        const { user_id, ...restUserData } = userData;
        let mappedData;

        if (roleAs === UserRole.Cashier) {
            mappedData = mapCashierData(userData);
        } else if (roleAs === UserRole.Pharmacist) {
            mappedData = mapPharmacistData(userData);
        }
        else if(roleAs === UserRole.Doctor){
            mappedData = mapDoctorData(userData);
        }
        else {
            mappedData = restUserData;
        }

        const response = await axios.put(endpoint, mappedData);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(
                error.response?.data?.message || "Failed to update user",
            );
        }
        throw error;
    }
};
