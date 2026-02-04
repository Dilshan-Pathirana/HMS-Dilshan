import api from "../../axios";

export const getAllShifts = () => {
    return api.get("api/get-all-shifts");
};
