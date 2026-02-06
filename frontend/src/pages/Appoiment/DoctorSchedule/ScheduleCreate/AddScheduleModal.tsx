import React, { useState, useEffect } from "react";
import api from "../../../../utils/api/axios";
import axios from "axios";
import alert from "../../../../utils/alert";
import {
    AddDoctorScheduleModalProps,
    User,
    Branch,
} from "../../../../utils/types/Appointment/IDoctorSchedule.ts";
import { addDoctorSchedule } from "../../../../utils/api/Appointment/DoctorSheduleAdd.ts";
import { getAllDoctorUsers } from "../../../../utils/api/dashboard/StaffAndUsers/GetAllDoctorUsers.ts";

const AddDoctorScheduleModal: React.FC<AddDoctorScheduleModalProps> = ({
    closeModal,
    onScheduleAdded,
}) => {
    const [selectedDoctor, setSelectedDoctor] = useState<string>("");
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>("");
    const [scheduleDay, setScheduleDay] = useState<string>("");
    const [startTime, setStartTime] = useState<string>("");
    const [maxPatients, setMaxPatients] = useState<string>("");
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await getAllDoctorUsers();
                if (response.status === 200) {
                    setUsers(response.data.doctors);
                } else {
                    alert.warn(
                        response.data.message || "Failed to fetch doctors.",
                    );
                }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    alert.error(
                        error.response?.data?.message ||
                            "An error occurred while fetching doctors.",
                    );
                } else {
                    alert.error("An unexpected error occurred.");
                }
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        if (selectedDoctor) {
            const selectedUser = users.find(
                (user) => user.user_id === selectedDoctor,
            );
            if (selectedUser) {
                setBranches(selectedUser.branches || []);
                setSelectedBranch("");
            }
        } else {
            setBranches([]);
            setSelectedBranch("");
        }
    }, [selectedDoctor, users]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (
            !selectedDoctor ||
            !selectedBranch ||
            !scheduleDay ||
            !startTime ||
            !maxPatients
        ) {
            alert.warn("All fields are required.");
            return;
        }

        const payload = {
            doctor_id: selectedDoctor,
            branch_id: selectedBranch,
            schedule_day: scheduleDay,
            start_time: startTime,
            max_patients: maxPatients,
        };

        try {
            const response = await addDoctorSchedule(payload);
            if (response.status === 200) {
                alert.success("Doctor schedule added successfully!");
                onScheduleAdded();
                closeModal();
            } else {
                alert.warn("Failed to add doctor schedule. Please try again.");
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                alert.error(
                    error.response?.data?.message ||
                        "An error occurred while adding the doctor schedule.",
                );
            } else {
                alert.error("An unexpected error occurred.");
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-2/3">
                <h2 className="text-lg font-semibold mb-4">
                    Add Doctor Schedule
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Select Doctor
                            </label>
                            <select
                                value={selectedDoctor}
                                onChange={(e) =>
                                    setSelectedDoctor(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Select Doctor</option>
                                {users.map((user) => (
                                    <option
                                        key={user.user_id}
                                        value={user.user_id}
                                    >
                                        {`${user.first_name} ${user.last_name}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Select Branch
                            </label>
                            <select
                                value={selectedBranch}
                                onChange={(e) =>
                                    setSelectedBranch(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                disabled={branches.length === 0}
                            >
                                <option value="">Select Branch</option>
                                {branches.map((branch) => (
                                    <option
                                        key={branch.branch_id}
                                        value={branch.branch_id}
                                    >
                                        {branch.branch_center_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Schedule Day
                            </label>
                            <select
                                value={scheduleDay}
                                onChange={(e) => setScheduleDay(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Select Day</option>
                                {[
                                    "Monday",
                                    "Tuesday",
                                    "Wednesday",
                                    "Thursday",
                                    "Friday",
                                    "Saturday",
                                    "Sunday",
                                ].map((day) => (
                                    <option key={day} value={day}>
                                        {day}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Start Time
                            </label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Maximum Patients
                            </label>
                            <input
                                type="number"
                                value={maxPatients}
                                onChange={(e) => setMaxPatients(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Enter maximum patients"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 bg-neutral-300 text-neutral-700 rounded-md hover:bg-gray-400 mr-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary-500 rounded-lg hover:bg-primary-600 text-white"
                        >
                            Add Schedule
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDoctorScheduleModal;
