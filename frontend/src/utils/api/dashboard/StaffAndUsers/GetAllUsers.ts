import api from "../../axios";

export const getAllUsers = () => {
    // Use trailing slash to avoid FastAPI redirect that can drop auth headers in some browser/XHR flows
    return api.get('/users/')
}

export const getDoctorUsers = () => {
    return api.get('/doctors/')
}
