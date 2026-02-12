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

/**
 * Field-level validation – returns an errors object keyed by field name.
 * Returns an empty object when everything is valid.
 */
export const validateSignupFields = (
    info: ISignUpFormFields,
): Record<string, string> => {
    const errs: Record<string, string> = {};

    if (!info.first_name.trim()) errs.first_name = "First name is required";
    if (!info.last_name.trim()) errs.last_name = "Last name is required";
    if (!info.phone.trim()) errs.phone = "Phone number is required";
    else if (!/^\+?\d{9,15}$/.test(info.phone.replace(/\s/g, "")))
        errs.phone = "Enter a valid phone number";

    if (!info.NIC.trim()) errs.NIC = "NIC is required";

    if (!info.email.trim()) {
        // email is optional – skip
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email))
        errs.email = "Enter a valid email address";

    if (!info.password) errs.password = "Password is required";
    else if (info.password.length < 6)
        errs.password = "Password must be at least 6 characters";

    if (!info.confirm_password)
        errs.confirm_password = "Please confirm your password";
    else if (info.password !== info.confirm_password)
        errs.confirm_password = "Passwords do not match";

    if (!info.branch_ids || info.branch_ids.length === 0)
        errs.branch_ids = "Please select at least one branch";

    return errs;
};
