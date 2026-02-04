import api from "../axios";

export const UserSignUp = async (Data: object) => {
    return api.post("/api/v1/users/patients", Data);
};
