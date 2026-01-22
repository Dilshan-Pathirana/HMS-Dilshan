import axios, { AxiosResponse } from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";

interface SignInPayload {
    loginInfo: object;
    setErrorCallback: (error: any) => void;
    setSignInError: (error: string) => void;
}

export const UserSignIn = createAsyncThunk<
    AxiosResponse<any> | undefined,
    SignInPayload
>("auth/login", async ({ loginInfo, setErrorCallback, setSignInError }) => {
    try {
        const response = await axios.post("/api/sign-in", loginInfo);
        if (response.data.status === 401) {
            setSignInError(response.data.message);
            return undefined;
        }
        return response;
    } catch (error: any) {
        if (error.response?.data) {
            setErrorCallback(error.response.data);
        } else {
            setSignInError("An error occurred during login. Please try again.");
        }
        return undefined;
    }
});
