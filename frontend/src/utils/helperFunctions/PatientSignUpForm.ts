import { ISignUpFormFields } from "../types/users/ISignUp.ts";

export const checkIsFiledEmpty = (signupInfo: ISignUpFormFields) => {
    const requiredFields = [
        "first_name",
        "last_name",
        "phone",
        "NIC",
        "password",
    ] as const;

    // Check all required fields are filled
    const anyEmpty = requiredFields.some((field) => signupInfo[field] === "");
    // Check at least one branch selected
    const noBranch = !signupInfo.branch_ids || signupInfo.branch_ids.length === 0;
    return anyEmpty || noBranch;
};
