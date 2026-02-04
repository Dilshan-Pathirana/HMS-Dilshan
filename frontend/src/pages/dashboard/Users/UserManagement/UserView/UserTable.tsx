import { useState, useEffect } from "react";
import Pagination from "../../../../../components/pharmacyPOS/Common/Pagination.tsx";
import alert from "../../../../../utils/alert.ts";
import {
    getAllUsers,
    getDoctorUsers,
} from "../../../../../utils/api/dashboard/StaffAndUsers/GetAllUsers.ts";
import { getAllBranches } from "../../../../../utils/api/branch/GetAllBranches.ts";
import { IBranchData } from "../../../../../utils/types/Branch/IBranchData.ts";
import { MultiSelectOption } from "../../../../../utils/types/Appointment/IAppointment.ts";
import { IUserData } from "../../../../../utils/types/users/Iuser.ts";
import { roleOptions } from "../../../../../utils/types/users/UserRole.ts";
import UserTableStructure from "./UserTableStructure.tsx";
import UserTableFilterSection from "./UserTableFilterSection.tsx";
const UserTable = () => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [users, setUsers] = useState<IUserData[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<IUserData[]>([]);
    const [paginatedUsers, setPaginatedUsers] = useState<IUserData[]>([]);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [branch, setDoctorUsers] = useState<any[]>([]);
    const [branches, setBranches] = useState<IBranchData[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<MultiSelectOption[]>(
        [],
    );
    const [branchDropDownOptions, setBranchDropDownOptions] = useState<
        MultiSelectOption[]
    >([]);
    const [selectedRole, setSelectedRole] = useState<MultiSelectOption[]>([]);
    const [roleDropDownOptions, setRoleDropDownOptions] = useState<
        MultiSelectOption[]
    >([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const rowsPerPage = 10;

    useEffect(() => {
        fetchUsers().then();
        fetchDoctorsDetails().then();
        fetchAllBranches().then();
        initializeRoleOptions();
    }, []);

    useEffect(() => {
        setAllUsers([...users, ...branch]);
    }, [users, branch]);

    useEffect(() => {
        showAllUsersInTable();
        setCurrentPage(1);
    }, [allUsers, searchTerm, selectedRole]);

    useEffect(() => {
        setPaginationWithUsers();
    }, [filteredUsers, currentPage]);

    useEffect(() => {
        branchCreateForSelector();
    }, [branches]);

    useEffect(() => {
        if (selectedBranch.length === 0) {
            setPaginationWithUsers();
            return;
        }

        if (selectedBranch[0]) {
            const branchFilteredUsers = filteredUsers.filter(
                (user: IUserData) => {
                    return (
                        user.center_name === selectedBranch[0].label ||
                        (user.branches &&
                            user.branches.some(
                                (branch: any) =>
                                    branch.branch_center_name ===
                                    selectedBranch[0].label,
                            ))
                    );
                },
            );

            setTotalPages(Math.ceil(branchFilteredUsers.length / rowsPerPage));
            setCurrentPage(1);
            setPaginatedUsers(branchFilteredUsers.slice(0, rowsPerPage));
            return;
        }
    }, [selectedBranch, filteredUsers]);

    const setPaginationWithUsers = () => {
        if (selectedBranch.length === 0) {
            setTotalPages(Math.ceil(filteredUsers.length / rowsPerPage));
        }

        setPaginatedUsers(
            filteredUsers.slice(
                (currentPage - 1) * rowsPerPage,
                currentPage * rowsPerPage,
            ),
        );
    };

    const showAllUsersInTable = () => {
        let filteringUser: any = allUsers.filter((user) =>
            `${user.first_name} ${user.last_name}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase()),
        );

        if (selectedRole.length > 0 && selectedRole[0]) {
            filteringUser = filteringUser.filter((user: IUserData) => {
                const selectedValue = selectedRole[0].value;

                // Check if filtering by role_as (numeric values 1-8)
                if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(selectedValue)) {
                    return user.role_as?.toString() === selectedValue;
                }

                // Otherwise filter by user_type (string values like "IT Assistant", "Branch Admin", etc.)
                return user.user_type === selectedValue;
            });
        }

        setFilteredUsers(filteringUser);
    };

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const response = await getAllUsers();

            // Backend returns a direct array of users
            const usersData = Array.isArray(response) ? response : (response as any).users;

            if (usersData && Array.isArray(usersData)) {
                setUsers(usersData);
            } else {
                setUsers([]);
                alert.warn("No users found.");
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            alert.error("Error fetching users. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDoctorsDetails = async () => {
        try {
            setIsLoading(true);
            const response = await getDoctorUsers();

            // Handle array response or object response
            const doctors = Array.isArray(response) ? response : (response as any).doctors;

            if (doctors) {
                setDoctorUsers(doctors);
            } else {
                // If endpoint returns empty list, it might not be an error
                setDoctorUsers([]);
            }
        } catch (error) {
            // alert.error("Error fetching users. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAllBranches = async () => {
        try {
            const response = await getAllBranches();
            const branchesData = (response as any).branches || response; // Handle unwrapped
            if (branchesData && Array.isArray(branchesData)) {
                setBranches(branchesData);
            } else if (response && (response as any).data && Array.isArray((response as any).data.branches)) {
                // Fallback if interceptor didn't work as expected or format changed
                setBranches((response as any).data.branches);
            } else {
                setBranches([]);
            }
        } catch (error) {
            console.error("Error fetching branches:", error);
            setBranches([]);
        }
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const branchCreateForSelector = (): void => {
        if (!branches || !Array.isArray(branches)) {
            setBranchDropDownOptions([]);
            return;
        }

        const branchOptions = branches.map((branch) => ({
            label: `${branch.center_name}`,
            value: branch.id,
        }));

        setBranchDropDownOptions(branchOptions);
    };

    const initializeRoleOptions = (): void => {
        setRoleDropDownOptions(roleOptions);
    };

    const refreshUsers = () => {
        fetchUsers().then();
        fetchDoctorsDetails().then();
    };

    return (
        <div className="bg-white shadow rounded-lg p-4">
            <UserTableFilterSection
                searchTerm={searchTerm}
                branchDropDownOptions={branchDropDownOptions}
                selectedBranch={selectedBranch}
                roleDropDownOptions={roleDropDownOptions}
                selectedRole={selectedRole}
                setSearchTerm={setSearchTerm}
                setSelectedBranch={setSelectedBranch}
                setSelectedRole={setSelectedRole}
            />
            <UserTableStructure
                isLoading={isLoading}
                filteredUsers={filteredUsers}
                paginatedUsers={paginatedUsers}
                refreshUsers={refreshUsers}
            />
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages > 0 ? totalPages : 1}
                onPageChange={handlePageChange}
            />
        </div>
    );
};

export default UserTable;
