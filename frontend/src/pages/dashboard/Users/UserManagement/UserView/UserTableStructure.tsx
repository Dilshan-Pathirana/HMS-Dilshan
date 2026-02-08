import React, { useState } from "react";
import Spinner from "../../../../../assets/Common/Spinner.tsx";
import { UserTableHeader } from "../../../../../utils/staticData/table/TableHeaders.ts";
import {
    IUserData,
    UserTableStructureProps,
} from "../../../../../utils/types/users/Iuser.ts";
import { roleMap } from "../../../../../utils/staticData/mapper/UserRolesMapper.ts";
import { FiEdit, FiTrash, FiUserX } from "react-icons/fi";
import EditUserModal from "../UserUpdate/EditUserModal.tsx";
import UserDeleteViewModal from "./UserDeleteViewModal.tsx";
import ResignationModal from "./ResignationModal.tsx";
import Toast from "./Toast.tsx";

const UserTableStructure: React.FC<UserTableStructureProps> = ({
    isLoading,
    filteredUsers,
    paginatedUsers,
    refreshUsers,
    readOnly = false
}) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [openResignationModal, setOpenResignationModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
    const [selectedUser, setSelectedUser] = useState<{
        id: string;
        roleAs: number;
        name: string;
    }>({ id: "", roleAs: 0, name: "" });

    const showUsersBranch = (userDetails: any): string => {
        // Doctor is role_as=3 in this frontend codebase
        if (userDetails.role_as !== 3) {
            return userDetails.center_name || "N/A";
        }

        // For doctors, check if branches exist
        if (!userDetails.branches || !Array.isArray(userDetails.branches) || userDetails.branches.length === 0) {
            return userDetails.center_name || "N/A";
        }

        const doctorUserBranchNames = userDetails.branches.map(
            (branch: { branch_center_name: string }) => {
                return branch.branch_center_name;
            },
        );

        return doctorUserBranchNames.join(", ");
    };

    const handleEdit = (user: IUserData) => {
        const idToUse =
            user.role_as === 3 && (user as any).user_id
                ? (user as any).user_id
                : user.id;

        setSelectedUser({ id: idToUse, roleAs: user.role_as, name: `${user.first_name} ${user.last_name}` });
        setIsEditModalOpen(true);
    };

    const handleDelete = (user: IUserData) => {
        const idToUse = user.role_as === 3 && (user as any).user_id
            ? (user as any).user_id
            : user.id;

        setSelectedUser({ id: idToUse, roleAs: user.role_as, name: `${user.first_name} ${user.last_name}` });
        setOpenDeleteModal(true);
    };

    const handleResignation = (user: IUserData) => {
        const idToUse = user.role_as === 3 && (user as any).user_id
            ? (user as any).user_id
            : user.id;

        setSelectedUser({ id: idToUse, roleAs: user.role_as, name: `${user.first_name} ${user.last_name}` });
        setOpenResignationModal(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedUser({ id: "", roleAs: 0, name: "" });
    };

    const handleUpdateSuccess = () => {
        if (refreshUsers) {
            refreshUsers();
        }
    };
    const DeleteCloseModal = () => {
        setOpenDeleteModal(false);
    };

    const handleDeleteSuccess = () => {
        if (refreshUsers) {
            refreshUsers();
        }
        setToast({ message: 'User deleted successfully', type: 'success' });
    };

    const handleResignationSuccess = () => {
        if (refreshUsers) {
            refreshUsers();
        }
        setOpenResignationModal(false);
        setToast({ message: 'Resignation recorded successfully', type: 'success' });
    };


    return (
        <>
            {isLoading ? (
                <div className="py-4">
                    <Spinner isLoading={true} />
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center py-4">No users found.</div>
            ) : (
                <table className="min-w-full divide-y divide-gray-200 border border-neutral-200">
                    <thead className="bg-neutral-50">
                        <tr>
                            {UserTableHeader && Array.isArray(UserTableHeader) ? UserTableHeader.map((header) => (
                                <th
                                    key={header}
                                    className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                                >
                                    {header}
                                </th>
                            )) : null}
                            {!readOnly && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Action
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedUsers && paginatedUsers.length > 0 ? paginatedUsers.map((user: IUserData, index: number) => (
                            <tr key={`${user.id}-${user.role_as}-${index}`} className="hover:bg-neutral-50">
                                <td className="px-6 py-4 text-sm">
                                    {user.first_name}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {user.last_name}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {user.user_type || roleMap[user.role_as] || "Unknown"}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {showUsersBranch(user) || "N/A"}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {user.contact_number_mobile || "N/A"}
                                </td>
                                {!readOnly && (
                                    <td className="flex m-auto p-4 items-center space-x-2">
                                        <FiEdit
                                            className="text-yellow-500 cursor-pointer hover:text-yellow-700"
                                            onClick={() => handleEdit(user)}
                                            title="Edit User"
                                        />
                                        <FiUserX
                                            className="text-orange-500 cursor-pointer hover:text-orange-700"
                                            onClick={() => handleResignation(user)}
                                            title="Record Resignation"
                                        />
                                        <FiTrash
                                            className="text-error-500 cursor-pointer hover:text-red-700"
                                            onClick={() => handleDelete(user)}
                                            title="Delete User"
                                        />
                                    </td>
                                )}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={UserTableHeader.length + (readOnly ? 0 : 1)} className="px-6 py-4 text-center text-sm text-neutral-500">
                                    No users found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            {selectedUser && (
                <EditUserModal
                    isOpen={isEditModalOpen}
                    userId={selectedUser.id}
                    roleAs={selectedUser.roleAs}
                    onClose={closeEditModal}
                    onSuccess={handleUpdateSuccess}
                />
            )}
            {openDeleteModal && (
                <UserDeleteViewModal onClose={DeleteCloseModal}
                    userId={selectedUser.id}
                    roleAs={selectedUser.roleAs}
                    onSuccess={handleDeleteSuccess}
                />
            )}
            {openResignationModal && (
                <ResignationModal
                    isOpen={openResignationModal}
                    userId={selectedUser.id}
                    userName={selectedUser.name}
                    onClose={() => setOpenResignationModal(false)}
                    onSuccess={handleResignationSuccess}
                />
            )}
        </>
    );
};

export default UserTableStructure;
