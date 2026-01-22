import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../../../store.tsx";
import { LoginOut } from "../../types/login";

export const UserSignOut = createAsyncThunk<
    any,
    LoginOut,
    { state: RootState }
>("auth/logout", async ({ accessToken, userRole }, { rejectWithValue }) => {
    let url = "";

    switch (userRole) {
        case 1:
            url = "/api/sign-out-admin";
            break;
        case 2:
            url = "/api/sign-out-admin"; // Branch admin uses same endpoint as admin
            break;
        case 3:
            url = "/api/sign-out-cashier";
            break;
        case 4:
            url = "/api/sign-out-pharmacist";
            break;
        case 5:
            url = "/api/sign-out-admin"; // Doctor
            break;
        case 6:
            url = "/api/sign-out-patient";
            break;
        case 7:
            url = "/api/sign-out-admin"; // Nurse
            break;
        case 8:
            url = "/api/sign-out-admin"; // IT Support
            break;
        case 9:
            url = "/api/sign-out-admin"; // Center Aid
            break;
        case 10:
            url = "/api/sign-out-admin"; // Auditor
            break;
        default:
            // Still clear local state even if role is unknown
            return { success: true };
    }

    try {
        await axios.get("/sanctum/csrf-cookie");
        const response = await axios.post(
            url,
            {},
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        );
        return response.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data || error.message);
    }
});
