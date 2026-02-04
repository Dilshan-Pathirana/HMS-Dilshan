import api from "../../axios";

export const getAllDoctorUsers = () => {
    return api.get('/api/v1/doctors')
}
