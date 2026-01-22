import axios from 'axios'

export const getAllUsers = () => {
    return axios.get('api/get-all-users')
}

export const getDoctorUsers = () => {
    return axios.get('api/get-doctors')
}
