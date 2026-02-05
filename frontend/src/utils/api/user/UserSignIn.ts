
import api from "../axios";
import { createAsyncThunk } from "@reduxjs/toolkit";

interface SignInPayload {
    loginInfo: object;
    setErrorCallback: (error: any) => void;
    setSignInError: (error: string) => void;
}

export const UserSignIn = createAsyncThunk<
    any | undefined,
    SignInPayload
>("auth/login", async ({ loginInfo, setErrorCallback, setSignInError }) => {
    try {
        // Step 1: Get Access Token
        const formData = new URLSearchParams();
        // Map email to username for OAuth2
        formData.append("username", (loginInfo as any).email);
        formData.append("password", (loginInfo as any).password);


        const tokenData: any = await api.post("/auth/login/access-token", formData, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        const access_token = tokenData.access_token;
        if (!access_token) throw new Error("No access token returned from API");

        // Store token for subsequent requests
        localStorage.setItem('token', access_token);

        // Step 2: Get User Profile (with token)
        const user: any = await api.get("/users/me");

        // Construct the payload expected by authSlice
        return {
            data: {
                token: access_token,
                user: {
                    ...user,
                    user_type: user.role_as === 1 ? 'Super Admin' : 'User',
                    branch_name: 'Main Branch'
                },
                userRole: user.role_as,
                userId: user.id
            }
        } as any;

    } catch (error: any) {
        if (error.response?.data) {
            setErrorCallback(error.response.data);
        } else {
            console.error("Login error:", error);
            setSignInError("Invalid credentials or server error.");
        }
        return undefined;
    }
});
