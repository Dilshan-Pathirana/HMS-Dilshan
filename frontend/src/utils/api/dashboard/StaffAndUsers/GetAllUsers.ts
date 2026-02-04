import api from "../../axios";

export const getAllUsers = () => {
    return api.get('/api/v1/users')
}

export const getDoctorUsers = () => {
    return api.get('/api/v1/doctors')
}
