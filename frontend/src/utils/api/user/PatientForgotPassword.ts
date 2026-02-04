import api from "../axios";
import { IPhone } from "../../types/users/ISignUp.ts";

export const patientForgotPassword = async (phone: IPhone) => {
    return api.post("/api/v1/auth/forgot-password", phone);
};
