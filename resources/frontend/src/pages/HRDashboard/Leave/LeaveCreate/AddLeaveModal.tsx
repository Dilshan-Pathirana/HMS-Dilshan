import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import alert from "../../../../utils/alert";
import { addCashierLeave } from "../../../../utils/api/leave/CashierAddLeave";
import { AddLeaveModalProps, User } from "../../../../utils/types/leave/Ileave";
import { AxiosError } from "axios";
import { addPharmacistLeave } from "../../../../utils/api/leave/PhaemacistAddLeave.ts";
import axios from "axios";
import { getAllCashierUser } from "../../../../utils/api/leave/CashierGetAllUser.ts";
import { getPharmacistUser } from "../../../../utils/api/leave/PharmacistGetAllUsers.ts";

const AddLeaveModal: React.FC<AddLeaveModalProps> = ({
    closeModal,
    onLeaveAdded,
}) => {
    const userId = useSelector(
        (state: { auth: { userId: string } }) => state.auth.userId,
    );
    const userRole = useSelector(
        (state: { auth: { userRole: number } }) => state.auth.userRole,
    );

    const [leavesStartDate, setLeavesStartDate] = useState("");
    const [leavesEndDate, setLeavesEndDate] = useState("");
    const [reason, setReason] = useState("");
    const [assigner, setAssigner] = useState("");
    const [assignerList, setAssignerList] = useState<User[]>([]);

    useEffect(() => {
        const fetchAssigners = async () => {
            try {
                const response =
                    userRole === 6
                        ? await getAllCashierUser()
                        : await getPharmacistUser();

                if (response.status === 200) {
                    const allUsers = response.data.users || [];
                    const filteredUsers = allUsers.filter(
                        (user: User) => user.id !== userId,
                    );
                    setAssignerList(filteredUsers);
                } else {
                    alert.warn(
                        response.data.message || "Failed to fetch assigners.",
                    );
                }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    alert.error(
                        error.response?.data?.message ||
                            "An error occurred while fetching assigners.",
                    );
                } else {
                    alert.error("An unexpected error occurred.");
                }
            }
        };

        fetchAssigners();
    }, [userRole, userId]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        const leaveData = {
            user_id: userId,
            leaves_start_date: leavesStartDate,
            leaves_end_date: leavesEndDate,
            reason,
            assigner,
        };

        try {
            let response;
            if (userRole === 6) {
                response = await addCashierLeave(leaveData);
            } else {
                response = await addPharmacistLeave(leaveData);
            }

            if (response.status === 200) {
                alert.success("Leave added successfully!");
                closeModal();
                onLeaveAdded();
            }
        } catch (error) {
            if (error instanceof AxiosError && error.response) {
                alert.error(
                    error.response.data?.message ||
                        "Failed to add leave. Please try again.",
                );
            } else {
                alert.error("An unexpected error occurred.");
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-2/3">
                <h2 className="text-lg font-semibold mb-4">Add Leave</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={leavesStartDate}
                                onChange={(e) =>
                                    setLeavesStartDate(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={leavesEndDate}
                                onChange={(e) =>
                                    setLeavesEndDate(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={4}
                            placeholder="Enter reason"
                        ></textarea>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assigner
                        </label>
                        <select
                            value={assigner}
                            onChange={(e) => setAssigner(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Assigner</option>
                            {assignerList.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {`${user.first_name} ${user.last_name} (${user.email})`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 mr-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-white"
                        >
                            Add Leave
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddLeaveModal;
