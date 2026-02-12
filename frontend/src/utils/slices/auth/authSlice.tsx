import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserSignIn } from "../../api/user/UserSignIn.ts";
import { AuthState, UserPayload } from "../../types/auth";
import { UserSignOut } from "../../api/user/UserSignOut.ts";

const initialState: AuthState = {
    loading: false,
    userId: "",
    userRole: 0,
    userType: "",
    userToken: "",
    branchId: "",
    branchName: "",
    error: null,
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        clearAuth: (state) => {
            localStorage.clear();
            state.loading = false;
            state.userId = "";
            state.userRole = 0;
            state.userType = "";
            state.userToken = "";
            state.branchId = "";
            state.branchName = "";
            state.error = null;
            state.isAuthenticated = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(UserSignIn.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(
                UserSignIn.fulfilled,
                (
                    state,
                    { payload }: PayloadAction<UserPayload | undefined>,
                ) => {
                    if (payload) {
                        setPayloadValuesForStore(state, payload);
                    }
                },
            )
            .addCase(UserSignOut.fulfilled, (state) => {
                localStorage.clear();
                state.loading = false;
                state.userRole = 0;
                state.userType = "";
                state.userToken = "";
                state.branchId = "";
                state.branchName = "";
                state.isAuthenticated = false;
                state.userId = "";
                state.error = null;
            })
            .addCase(UserSignOut.rejected, (state) => {
                localStorage.clear();
                state.loading = false;
                state.userRole = 0;
                state.userType = "";
                state.userToken = "";
                state.branchId = "";
                state.branchName = "";
                state.isAuthenticated = false;
                state.userId = "";
                state.error = null;
            });
    },
});

const setPayloadValuesForStore = (state: AuthState, payload: UserPayload) => {
    if (!payload) {
        return;
    }

    // Handle both direct response and wrapped response
    const responseData = payload.data || payload;
    
    localStorage.setItem("token", responseData.token);
    
    // Save user info to localStorage
    if (responseData.user) {
        localStorage.setItem("user", JSON.stringify(responseData.user));
    }
    
    state.loading = false;

    state.userId = responseData.userId;
    state.userRole = responseData.userRole;
    state.userType = responseData.user?.user_type || "";
    state.userToken = responseData.token;
    state.branchId = responseData.user?.branch_id || "";
    state.branchName = responseData.user?.branch_name || "";
    state.isAuthenticated = !!responseData.token;
};

export const { clearAuth } = authSlice.actions;
export default authSlice.reducer;
