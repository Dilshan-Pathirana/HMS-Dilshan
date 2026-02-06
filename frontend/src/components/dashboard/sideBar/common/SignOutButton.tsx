import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import { UserSignOut } from "../../../../utils/api/user/UserSignOut.ts";
import { useAccessToken, useUserRole } from "../../../../utils/state/checkAuthenticatedUserStates.ts";
import React from "react";
import { AppDispatch } from "../../../../store.tsx";

const SignOutButton = () => {
    const accessToken = useAccessToken();
    const userRole = useUserRole();
    const navigate = useNavigate();
    const useAppDispatch = () => useDispatch<AppDispatch>();
    const dispatch = useAppDispatch();

    const signOutHandle = async (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        event.preventDefault();

        await dispatch(UserSignOut({ accessToken, userRole }));
        localStorage.clear()
        navigate("/login");
        window.location.reload();
    };

    return (
        <button
            type="button"
            onClick={signOutHandle}
            className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
        >
            <FaSignOutAlt className="text-error-500 mr-2" />
            Sign out
        </button>
    );
};

export default SignOutButton;
