import axios from "axios";

export const UserSignUp = async (Data: object) => {
    return axios.post("/api/create-patient", Data);
};
