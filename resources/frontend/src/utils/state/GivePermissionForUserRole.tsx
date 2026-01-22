export const accessForAdmin = (userAccessRole: number) => {
    return userAccessRole === 1;
};

export const accessForBranchAdmin = (userAccessRole: number) => {
    return userAccessRole === 2;
};

// Role mappings based on useAuth.ts:
// 1: Super Admin, 2: Branch Admin, 3: Doctor, 4: Nurse, 5: Patient, 6: Cashier, 7: Pharmacist
export const accessForCashierUser = (userAccessRole: number) => {
    return userAccessRole === 6; // Cashier is role 6
};

export const accessForPharmacyUser = (userAccessRole: number) => {
    return userAccessRole === 7; // Pharmacist is role 7
};

export const accessForDoctorUser = (userAccessRole: number) => {
    return userAccessRole === 3; // Doctor is role 3
};

export const accessForNurseUser = (userAccessRole: number) => {
    return userAccessRole === 4; // Nurse is role 4
};

export const accessForPatientUser = (userAccessRole: number) => {
    return userAccessRole === 5; // Patient is role 5
};

export const accessForSupplierEntity = (userAccessRole: number) => {
    return userAccessRole === 8;
};

export const accessForAdminAndPharmacyUser = (userAccessRole: number) => {
    return userAccessRole === 1 || userAccessRole === 7;
};

export const accessForAdminOrBranchAdmin = (userAccessRole: number) => {
    return userAccessRole === 1 || userAccessRole === 2;
};
