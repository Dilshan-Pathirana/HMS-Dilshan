import api from "../axios";
import { IPhone } from "../../types/users/ISignUp.ts";

export const patientForgotPassword = async (phone: IPhone) => {
    return api.post("/auth/forgot-password", phone);
};

export const verifyForgotPasswordOtp = async (payload: { otp_token: string; otp: string }) => {
    return api.post("/auth/forgot-password/verify-otp", payload);
};

export const resetPassword = async (payload: { token: string; new_password: string }) => {
    return api.post("/auth/reset-password", payload);
};
