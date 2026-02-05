import api from "../axios";
import { IPhone } from "../../types/users/ISignUp.ts";

export const patientForgotPassword = async (phone: IPhone) => {
    return api.post("/auth/forgot-password", phone);
};
