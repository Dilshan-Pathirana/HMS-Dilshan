
import api from "../axios";
import axios from "axios";
import { UserRole } from "../../types/users/UserRole.ts";

// Nurse role constant (not in UserRole enum)
const NURSE_ROLE = 7;

export const deleteUser = async (userId: string, roleAs: number) => {
    try {
        // Unified endpoint for all user deletions
        const endpoint = `/api/v1/users/${userId}`;

        const response = await api.delete(endpoint);
        return response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            throw new Error(
                error.response?.data?.message || "Failed to delete user"
            );
        }
        throw error;
    }
};
