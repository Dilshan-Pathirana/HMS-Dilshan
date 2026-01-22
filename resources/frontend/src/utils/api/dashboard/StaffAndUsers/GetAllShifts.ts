import axios from "axios";

export const getAllShifts = () => {
    return axios.get("api/get-all-shifts");
};
