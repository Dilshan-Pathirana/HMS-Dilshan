import axios from 'axios'

export const getAllDoctorUsers = () => {
    return axios.get('api/get-doctors')
}
