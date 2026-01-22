import { useSelector } from "react-redux";
import { RootState } from "../../store.tsx";

export const CheckAuthenticated = () => {
    return useSelector((state: RootState) => state.auth.isAuthenticated);
};
export const useAccessToken = () => {
    return useSelector((state: RootState) => state.auth.userToken);
};

export const useUserRole = () => {
    return useSelector((state: RootState) => state.auth.userRole);
};

export const useUserBranchId = () => {
    return useSelector((state: RootState) => state.auth.branchId);
};

export const useUserBranchName = () => {
    return useSelector((state: RootState) => state.auth.branchName);
};

export const useUserBranch = () => {
    const branchId = useSelector((state: RootState) => state.auth.branchId);
    const branchName = useSelector((state: RootState) => state.auth.branchName);
    return { branchId, branchName };
};
