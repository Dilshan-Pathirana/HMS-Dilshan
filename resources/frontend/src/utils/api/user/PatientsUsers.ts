import axios from "axios";

export const getAllPatientUsers = () => {
    return axios.get('api/get-patients-details')
}

export const getAllPatientUsersForPharmacist = () => {
    return axios.get('api/get-pharmacist-patients-details')
}

export const getAllPatientUsersForCashier = () => {
    return axios.get('api/get-cashier-patients-details')
}
