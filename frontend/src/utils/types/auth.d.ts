export interface AuthError {
    message: string;
    errors?: Record<string, string>;
}

export interface UserPayload {
    data?: {
        token: string;
        userId: string;
        userRole: number;
        user?: {
            user_type?: string;
            branch_id?: string;
            branch_name?: string;
        };
    };
    token: string;
    userId: string;
    userRole: number;
    user?: {
        user_type?: string;
        branch_id?: string;
        branch_name?: string;
    };
}

export interface AuthState {
    loading: boolean;
    userId: string;
    userRole: number;
    userType: string;
    userToken: string;
    branchId: string;
    branchName: string;
    error: AuthError | null;
    isAuthenticated: boolean;
}
