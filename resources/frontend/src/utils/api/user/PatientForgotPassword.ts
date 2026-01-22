import axios from "axios";
import { IPhone } from "../../types/users/ISignUp.ts";

export const patientForgotPassword = async (phone: IPhone) => {
    return axios.post("/api/forgot-password", phone);
};
