import axios from "axios";
import { UserRole } from "../../types/users/UserRole.ts";

// Nurse role constant (not in UserRole enum)
const NURSE_ROLE = 7;

export const deleteUser = async (userId: string, roleAs: number) => {
    try {
        let endpoint: string;

        switch (roleAs) {
            case UserRole.Cashier:
                endpoint = `/api/delete-cashier-user/${userId}`;
                break;
            case UserRole.Pharmacist:
                endpoint = `/api/delete-pharmacist-user/${userId}`;
                break;
            case UserRole.Doctor:
                endpoint = `/api/delete-doctor-user/${userId}`;
                break;
            case UserRole.Patient:
                endpoint = `/api/delete-patient-user/${userId}`;
                break;
            case UserRole.SupplierEntity:
                endpoint = `/api/delete-supplier-entity/${userId}`;
                break;
            case NURSE_ROLE:
            case UserRole.SuperAdmin:
            case UserRole.Admin:
            default:
                // Staff users with user_type (IT Assistant, Receptionist, Nurse, etc.)
                endpoint = `/api/delete-staff/${userId}`;
                break;
        }
        const response = await axios.delete(endpoint);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(
                error.response?.data?.message || "Failed to delete user"
            );
        }
        throw error;
    }
};
