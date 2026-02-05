import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
    FaUserMd,
    FaHospital,
    FaCalendarAlt,
    FaSearch,
    FaUser,
} from "react-icons/fa";
import { MultiSelect } from "react-multi-select-component";
import { getAllBranches } from "../../../utils/api/branch/GetAllBranches";
import { getAllDoctorUsers } from "../../../utils/api/dashboard/StaffAndUsers/GetAllDoctorUsers";
import {
    MultiSelectOption,
    Filters,
} from "../../../utils/types/Appointment/IAppointment";

type DoctorAppointmentFilterProps = {
    onApplyFilter: (filters: Filters) => void;
};

const DoctorAppointmentFilter: React.FC<DoctorAppointmentFilterProps> = ({
    onApplyFilter,
}) => {
    const [doctors, setDoctors] = useState<MultiSelectOption[]>([]);
    const [branches, setBranches] = useState<MultiSelectOption[]>([]);
    const [selectedDoctors, setSelectedDoctors] = useState<MultiSelectOption[]>(
        [],
    );
    const [selectedBranches, setSelectedBranches] = useState<
        MultiSelectOption[]
    >([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [newPatientName, setNewPatientName] = useState("");

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const response = await getAllDoctorUsers();
                if (response.status === 200) {
                    setDoctors(
                        response.data.doctors.map(
                            (doctor: {
                                first_name: string;
                                last_name: string;
                                user_id: string;
                            }) => ({
                                label: `${doctor.first_name} ${doctor.last_name}`,
                                value: doctor.user_id,
                            }),
                        ),
                    );
                }
            } catch (error) {
                console.error("Failed to fetch doctors:", error);
            }
        };

        const fetchBranches = async () => {
            try {
                const response = await getAllBranches();
                // Response is already IBranchData[] from axios interceptor
                setBranches(
                    response.map(
                        (branch: { center_name: string; id: string }) => ({
                            label: branch.center_name,
                            value: branch.id,
                        }),
                    ),
                );
            } catch (error) {
                console.error("Failed to fetch branches:", error);
            }
        };

        fetchDoctors();
        fetchBranches();
    }, []);

    const handleFilterSubmit = () => {
        const selectedDoctor =
            selectedDoctors.length > 0 ? selectedDoctors[0].value : null;

        const filters: Filters = {
            doctor_id: selectedDoctor,
            branch_id:
                selectedBranches.length > 0 ? selectedBranches[0].value : null,
            patient_name: newPatientName.trim() !== "" ? newPatientName : null,
            date: selectedDate
                ? new Date(
                      selectedDate.getTime() -
                          selectedDate.getTimezoneOffset() * 60000,
                  )
                      .toISOString()
                      .split("T")[0]
                : null,
            areas_of_specialization: selectedDoctor
                ? (doctors.find((doc) => doc.value === selectedDoctor)?.label ??
                  null)
                : null,
        };

        onApplyFilter(filters);
    };

    return (
        <div className="flex flex-wrap items-end gap-4 p-6 bg-gray-100 shadow-md rounded-lg">
            <div className="flex flex-col w-1/5">
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaUserMd className="mr-2 text-gray-500" /> Doctor
                </label>
                <MultiSelect
                    options={doctors}
                    value={selectedDoctors}
                    onChange={setSelectedDoctors}
                    labelledBy="Select Doctor"
                    className="border border-gray-300 rounded-md shadow-sm p-2"
                />
            </div>

            <div className="flex flex-col w-1/5">
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaHospital className="mr-2 text-gray-500" /> Branch
                </label>
                <MultiSelect
                    options={branches}
                    value={selectedBranches}
                    onChange={setSelectedBranches}
                    labelledBy="Select Branch"
                    className="border border-gray-300 rounded-md shadow-sm p-2"
                />
            </div>

            <div className="flex flex-col w-1/5">
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaUser className="mr-2 text-gray-500" /> Patient Name
                </label>
                <input
                    type="text"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    placeholder="Enter patient name"
                    className="border border-gray-300 rounded-md shadow-sm p-2 w-full"
                />
            </div>

            <div className="flex flex-col w-1/5">
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaCalendarAlt className="mr-2 text-gray-500" /> Appointment
                    Date
                </label>
                <DatePicker
                    selected={selectedDate}
                    onChange={setSelectedDate}
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
                onClick={handleFilterSubmit}
                className="flex items-center justify-center bg-blue-600 text-white py-2 px-6 rounded-md shadow hover:bg-blue-700 h-10 mt-6"
            >
                <FaSearch className="mr-2" />
                Search
            </button>
        </div>
    );
};

export default DoctorAppointmentFilter;
