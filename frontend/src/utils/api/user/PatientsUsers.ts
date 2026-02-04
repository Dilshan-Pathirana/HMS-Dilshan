import api from "../axios";

export const getAllPatientUsers = () => {
    return api.get('/patients')
}

export const getAllPatientUsersForPharmacist = () => {
    return api.get('/patients?role=pharmacist')
}

export const getAllPatientUsersForCashier = () => {
    return api.get('/patients?role=cashier')
}
