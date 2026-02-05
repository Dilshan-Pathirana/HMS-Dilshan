import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaUserMd, FaHospital, FaCalendarAlt, FaSearch } from "react-icons/fa";
import { MultiSelect } from "react-multi-select-component";
import { getAllBranches } from "../../../utils/api/branch/GetAllBranches";
import { getAllDoctorUsers } from "../../../utils/api/dashboard/StaffAndUsers/GetAllDoctorUsers";
import { specializationOptions } from "../../../utils/api/user/DoctorData";
import {
    Branch,
    Doctor,
    FilterProps,
    Filters,
    MultiSelectOption,
} from "../../../utils/types/Appointment/IAppointment.ts";

const DoctorFilter: React.FC<FilterProps> = ({ onApplyFilter }) => {
    const [users, setUsers] = useState<Doctor[]>([]);
    const [branchOptions, setBranchOptions] = useState<MultiSelectOption[]>([]);
    const [selectedDoctors, setSelectedDoctors] = useState<MultiSelectOption[]>(
        [],
    );
    const [selectedBranches, setSelectedBranches] = useState<
        MultiSelectOption[]
    >([]);
    const [selectedSpecializations, setSelectedSpecializations] = useState<
        MultiSelectOption[]
    >([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [doctorUsersDropDownOptions, setDoctorUsersDropDownOptions] =
        useState<MultiSelectOption[]>([]);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const response = await getAllDoctorUsers();
                if (response.status === 200) {
                    setUsers(response.data.doctors);
                }
            } catch (error) {
                console.error("Failed to fetch doctors:", error);
            }
        };

        const fetchBranches = async () => {
            try {
                const response = await getAllBranches();
                // Response is already IBranchData[] from axios interceptor
                const branchOptions = response.map(
                    (branch: Branch) => ({
                        label: branch.center_name,
                        value: branch.id,
                    }),
                );
                setBranchOptions(branchOptions);
            } catch (error) {
                console.error("Failed to fetch branches:", error);
            }
        };

        fetchDoctors();
        fetchBranches();
    }, []);

    useEffect(() => {
        doctorUsersCreateForSelector();
    }, [users]);

    const handleApplyFilter = () => {
        const daysOfWeek = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];
        const filters: Filters = {
            branch_id:
                selectedBranches.length > 0 ? selectedBranches[0].value : null,
            doctor_id:
                selectedDoctors.length > 0 ? selectedDoctors[0].value : null,
            areas_of_specialization:
                selectedSpecializations.length > 0
                    ? selectedSpecializations[0].value
                    : null,
            date: selectedDate ? daysOfWeek[selectedDate.getDay()] : null,
        };
        onApplyFilter(filters);
    };

    const doctorUsersCreateForSelector = (): void => {
        const doctorUsersOptions = users.map((user) => ({
            label: `${user.first_name} ${user.last_name}`,
            value: user.user_id,
        }));

        setDoctorUsersDropDownOptions(doctorUsersOptions);
    };

    return (
        <div className="flex items-center gap-6 p-6 bg-gray-100 shadow-md rounded-lg">
            <div className="flex flex-col w-full max-w-sm">
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaUserMd className="mr-2 text-gray-500" /> DoctorSchedule
                </label>
                <MultiSelect
                    options={doctorUsersDropDownOptions}
                    value={selectedDoctors}
                    onChange={(selected: MultiSelectOption[]) => {
                        setSelectedDoctors(selected.slice(-1));
                    }}
                    labelledBy="Select DoctorSchedule"
                    className="border border-gray-300 rounded-md shadow-sm p-2"
                />
            </div>

            <div className="flex flex-col w-full max-w-sm">
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaHospital className="mr-2 text-gray-500" /> Specialization
                </label>
                <MultiSelect
                    options={specializationOptions}
                    value={selectedSpecializations}
                    onChange={(selected: MultiSelectOption[]) =>
                        setSelectedSpecializations(selected.slice(-1))
                    }
                    labelledBy="Select Specialization"
                    className="border border-gray-300 rounded-md shadow-sm p-2"
                />
            </div>

            <div className="flex flex-col w-full max-w-sm">
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaHospital className="mr-2 text-gray-500" />{" "}
                    Hospital/Branch
                </label>
                <MultiSelect
                    options={branchOptions}
                    value={selectedBranches}
                    onChange={(selected: MultiSelectOption[]) =>
                        setSelectedBranches(selected.slice(-1))
                    }
                    labelledBy="Select Branch"
                    className="border border-gray-300 rounded-md shadow-sm p-2"
                />
            </div>
            <div className="flex flex-col w-full max-w-sm">
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaCalendarAlt className="mr-2 text-gray-500" /> Appointment
                    Date
                </label>
                <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    placeholderText="Select Date"
                    dateFormat="yyyy/MM/dd"
                    minDate={new Date()}
                    maxDate={
                        new Date(new Date().setDate(new Date().getDate() + 30))
                    }
                    className="border border-gray-300 rounded-md shadow-sm p-2 w-full"
                />
            </div>
            <button
                onClick={handleApplyFilter}
                className="flex items-center justify-center mt-7 bg-blue-600 text-white py-2 px-6 rounded-md shadow hover:bg-blue-700"
            >
                <FaSearch className="mr-2" />
                Search
            </button>
        </div>
    );
};

export default DoctorFilter;
