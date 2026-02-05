import api from "../../axios";

export const getAllUsers = () => {
    return api.get('/users')
}

export const getDoctorUsers = () => {
    return api.get('/doctors')
}
