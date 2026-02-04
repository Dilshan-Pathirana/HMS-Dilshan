export interface ILoginProps {
    email: string;
    password: string;
}
export interface LoginError {
    field_error_list: object;
    sign_in_error: string;
}

interface LoginOut {
    accessToken: string;
    userRole: number;
}
