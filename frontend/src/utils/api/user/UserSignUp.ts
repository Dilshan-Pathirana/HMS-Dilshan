import api from "../axios";

export const UserSignUp = async (Data: object) => {
    return api.post("/users/patients", Data);
};
