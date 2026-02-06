import React, { useState, useEffect } from "react";
import alert from "../../../../utils/alert";
import { IDoctorSchedule } from "../../../../utils/types/Appointment/IDoctorSchedule.ts";
import { updateDoctorSchedule } from "../../../../utils/api/Appointment/UpdateDoctorSchedule.ts";

const EditDoctorScheduleModal: React.FC<{
    isOpen: boolean;
    schedule: IDoctorSchedule | null;
    onClose: () => void;
    onScheduleUpdated: () => void;
}> = ({ isOpen, schedule, onClose, onScheduleUpdated }) => {
    const [scheduleDay, setScheduleDay] = useState<string>("");
    const [startTime, setStartTime] = useState<string>("");
    const [maxPatients, setMaxPatients] = useState<string>("");
    const [doctorName, setDoctorName] = useState<string>("");
    const [branchName, setBranchName] = useState<string>("");

    useEffect(() => {
        if (schedule) {
            setScheduleDay(schedule.schedule_day || "");
            setStartTime(schedule.start_time || "");
            setMaxPatients(schedule.max_patients?.toString() || "");
            setDoctorName(
                `${schedule.user_first_name} ${schedule.user_last_name}`,
            );
            setBranchName(schedule.branch_center_name || "");
        }
    }, [schedule]);

    if (!isOpen || !schedule) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!schedule.id) {
            alert.error("Invalid schedule ID.");
            return;
        }

        if (!scheduleDay || !startTime || !maxPatients) {
            alert.warn("All fields are required.");
            return;
        }

        const payload = {
            id: schedule.id,
            doctor_id: schedule.doctor_id,
            branch_id: schedule.branch_id,
            schedule_day: scheduleDay,
            start_time: startTime,
            max_patients: parseInt(maxPatients, 10),
        };


        try {
            const response = await updateDoctorSchedule(payload);
            if (response.status === 200) {
                alert.success("Doctor schedule updated successfully!");
                onScheduleUpdated();
                onClose();
            } else {
                alert.error("Failed to update schedule.");
            }
        } catch (error) {
            alert.error("An unexpected error occurred. Please try again.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
                <h2 className="text-lg font-semibold mb-4">
                    Edit Doctor Schedule
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Doctor Name
                        </label>
                        <input
                            type="text"
                            value={doctorName}
                            readOnly
                            className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-100 focus:outline-none"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Branch Name
                        </label>
                        <input
                            type="text"
                            value={branchName}
                            readOnly
                            className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-100 focus:outline-none"
                        />
                    </div>
                    <div className="mb-4">
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
                    <div className="mb-4">
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
                    <div className="mb-4">
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
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-neutral-300 text-neutral-700 rounded-md hover:bg-gray-400 mr-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary-500 rounded-lg hover:bg-primary-600 text-white"
                        >
                            Update
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditDoctorScheduleModal;
