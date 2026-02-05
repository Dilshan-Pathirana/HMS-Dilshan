import React, { useEffect, useState } from "react";
import Spinner from "../../../../../assets/Common/Spinner.tsx";
import alert from "../../../../../utils/alert.ts";
import { IBranchData } from "../../../../../utils/types/Branch/IBranchData.ts";
import { updateUser } from "../../../../../utils/api/user/UpdateUser.ts";
import { getUpdateUserDetails } from "../../../../../utils/api/user/GetUpdateUserDetails.ts";
import { getAllBranches } from "../../../../../utils/api/branch/GetAllBranches.ts";
import {
    BranchOption,
    EditUserModalProps,
} from "../../../../../utils/types/users/IUserEdit.ts";
import { PatientEditForm } from "./PatientEditForm";
import { CashierEditForm } from "./CashierEditForm";
import { PharmacistEditForm } from "./PharmacistEditForm";
import { DoctorEditForm } from "./DoctorEditForm";
import { StaffEditForm } from "./StaffEditForm";
import { mapDetailsToRoleFields } from "../../../../../utils/types/users/IUserMap.ts";
import { UserRole } from "../../../../../utils/types/users/UserRole.ts";
import axios from "axios";
import { ICashierUserDetails } from "../../../../../utils/types/users/ICashierUserFormTypes.ts";
import { IPharmacistUserDetails } from "../../../../../utils/types/users/IPharmacistUserFormTypes.ts";
import { IDoctorUserDetails } from "../../../../../utils/types/users/IDoctorUserFormTypes.ts";
const EditUserModal: React.FC<EditUserModalProps> = ({
    isOpen,
    userId,
    roleAs,
    onClose,
    onSuccess,
}) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [userDetails, setUserDetails] = useState<
        ICashierUserDetails | IPharmacistUserDetails | IDoctorUserDetails | null
    >(null);
    const [branchOptions, setBranchOptions] = useState<BranchOption[]>([]);

    useEffect(() => {
        if (isOpen && userId) {
            fetchUserDetails();
            fetchBranchList();
        }
    }, [isOpen, userId]);

    const fetchUserDetails = async () => {
        try {
            setIsLoading(true);
            const response = await getUpdateUserDetails(userId);

            const user = response as any; // Interceptor unwraps response

            if (user && user.id) {
                const mappedDetails = mapDetailsToRoleFields(
                    user,
                    roleAs,
                );

                setUserDetails(mappedDetails);
            } else {
                alert.warn("Failed to fetch user details");
                onClose();
            }
        } catch (error) {
            console.error("Error fetching user details:", error);
            alert.error("Error fetching user details. Please try again later.");
            onClose();
        } finally {
            setIsLoading(false);
        }
    };
    const fetchBranchList = async () => {
        try {
            const response = await getAllBranches();
            // Response is already IBranchData[] from axios interceptor
            const options = response.map(
                (branch: IBranchData) => ({
                    value: branch.id,
                    label: branch.center_name,
                }),
            );
            setBranchOptions(options);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                alert.warn("Failed to fetch branch list: " + error.message);
            } else {
                alert.warn("Failed to fetch branch list.");
            }
        }
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setIsLoading(true);
            const submissionData = { ...userDetails } as any;
            if (roleAs === UserRole.Doctor) {
                if (submissionData.doctors_areas_of_specialization) {
                    if (
                        typeof submissionData.doctors_areas_of_specialization ===
                        "string"
                    ) {
                        submissionData.doctors_areas_of_specialization =
                            submissionData.doctors_areas_of_specialization
                                .split(",")
                                .map((s: string) => s.trim())
                                .filter((s: string) => s !== "");
                    } else if (
                        !Array.isArray(
                            submissionData.doctors_areas_of_specialization,
                        )
                    ) {
                        submissionData.doctors_areas_of_specialization = [];
                    }
                }
                if (submissionData.branch_ids) {
                    if (Array.isArray(submissionData.branch_ids)) {
                        submissionData.branch_ids = submissionData.branch_ids
                            .map((id: any) =>
                                typeof id === "object"
                                    ? id.value || id.branch_id || id
                                    : String(id),
                            )
                            .filter((id: string) => id !== "");
                    } else if (typeof submissionData.branch_ids === "string") {
                        try {
                            const parsed = JSON.parse(
                                submissionData.branch_ids,
                            );
                            submissionData.branch_ids = Array.isArray(parsed)
                                ? parsed.map(String)
                                : [String(submissionData.branch_ids)];
                        } catch {
                            submissionData.branch_ids =
                                submissionData.branch_ids
                                    .split(",")
                                    .map((id: string) => id.trim())
                                    .filter((id: string) => id !== "")
                                    .map(String);
                        }
                    } else {
                        submissionData.branch_ids = [
                            String(submissionData.branch_ids),
                        ];
                    }
                } else {
                    submissionData.branch_ids = [];
                }
            }

            const response = await updateUser({
                userId: userId,
                roleAs: roleAs,
                userData: submissionData,
            });

            if (response.status === 200) {
                alert.success("User updated successfully");
                onSuccess();
                onClose();
            } else {
                alert.warn(response.data.message || "Failed to update user");
            }
        } catch (error) {
            console.error("Update error:", error);

            if (axios.isAxiosError(error) && error.response) {
                alert.error(
                    error.response.data.message ||
                    "Error updating user. Please try again.",
                );
            } else {
                alert.error("Error updating user. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };
    const handleInputChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => {
        const { name, value } = e.target;
        setUserDetails((prevDetails: any) => ({
            ...prevDetails,
            [name]: value,
        }));
    };

    const handleBranchChange = (selectedOption: any) => {
        if (roleAs === UserRole.Doctor && selectedOption.target) {
            const { name, value } = selectedOption.target;
            setUserDetails((prevDetails: any) => ({
                ...prevDetails,
                [name]: value,
            }));
            return;
        }

        const fieldName =
            roleAs === UserRole.Cashier
                ? "cashiers_branch_id"
                : roleAs === UserRole.Pharmacist
                    ? "pharmacists_branch_id"
                    : roleAs === UserRole.SuperAdmin || roleAs === UserRole.Admin
                        ? "branch_id"
                        : "branch_id";

        setUserDetails((prevDetails: any) => ({
            ...prevDetails,
            [fieldName]: selectedOption ? selectedOption.value : "",
        }));
    };

    const renderUserForm = () => {
        if (!userDetails) return <div>No user details available</div>;

        if (roleAs === UserRole.Doctor) {
            const formProps = {
                userDetails: userDetails as IDoctorUserDetails,
                branchOptions,
                handleInputChange,
                handleBranchChange,
            };

            return <DoctorEditForm {...formProps} />;
        }

        if (roleAs === UserRole.Cashier) {
            const formProps = {
                userDetails: userDetails as ICashierUserDetails,
                branchOptions,
                handleInputChange,
                handleBranchChange,
            };
            return <CashierEditForm {...formProps} />;
        }

        if (roleAs === UserRole.Pharmacist) {
            const formProps = {
                userDetails: userDetails as IPharmacistUserDetails,
                branchOptions,
                handleInputChange,
                handleBranchChange,
            };
            return <PharmacistEditForm {...formProps} />;
        }

        if (roleAs === UserRole.Patient) {
            const formProps = {
                userDetails,
                branchOptions,
                handleInputChange,
                handleBranchChange,
            };
            return <PatientEditForm {...formProps} />;
        }

        if (roleAs === UserRole.SuperAdmin || roleAs === UserRole.Admin) {
            const formProps = {
                userDetails,
                branchOptions,
                handleInputChange,
                handleBranchChange,
            };
            return <StaffEditForm {...formProps} />;
        }

        // if (roleAs === UserRole.SupplierEntity) {
        //     const formProps = {
        //         userDetails,
        //         handleInputChange,
        //     };
        //     return <SupplierEntityEditForm {...formProps} />;
        // }

        return <div>Unknown user role</div>;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-3/4 max-w-4xl max-h-[90vh] overflow-y-auto">
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <Spinner isLoading={true} />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {renderUserForm()}
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Update User
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default EditUserModal;
