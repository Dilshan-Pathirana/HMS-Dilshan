import api from "../../axios";

export const getAllDoctorUsers = () => {
    return api.get('/doctors')
}
