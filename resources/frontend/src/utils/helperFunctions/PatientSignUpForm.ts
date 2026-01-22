import { ISignUpFormFields } from "../types/users/ISignUp.ts";

export const checkIsFiledEmpty = (signupInfo: ISignUpFormFields) => {
    const requiredFields = [
        "first_name",
        "last_name",
        "phone",
        "NIC",
        "branch_id",
    ] as const;

    return requiredFields.some((field) => signupInfo[field] === "");
};
