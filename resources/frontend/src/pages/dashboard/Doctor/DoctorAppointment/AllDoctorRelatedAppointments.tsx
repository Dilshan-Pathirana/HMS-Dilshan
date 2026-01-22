import { useSelector } from "react-redux";
import { RootState } from "../../../../store.tsx";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { DoctorSchedule } from "../../../../utils/types/users/IDoctorData.ts";
import DoctorAppointments from "./DoctorAppointmentDetails/DoctorAppointments.tsx";
import DoctorAllAppointmentFilter from "./AllDoctorAppointmentTable/DoctorAllAppointmentFilter.tsx";
import DoctorAllAppointmentTable from "./AllDoctorAppointmentTable/DoctorAllAppointmentTable/DoctorAllAppointmentTable.tsx";

const AllDoctorRelatedAppointments = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedSchedule, setSelectedSchedule] =
        useState<DoctorSchedule | null>(null);
    const [filteredSchedules, setFilteredSchedules] = useState<
        DoctorSchedule[]
    >([]);

    useEffect(() => {
        if (userId) {
            refreshSchedules().then();
        }
    }, [userId]);

    useMemo(() => {
        const afterFilteringScheduleDetails = (schedules || []).filter(
            (schedule) =>
                `${schedule.branch_center_name} ${schedule.schedule_day} ${schedule.start_time}`
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
        );

        setFilteredSchedules(afterFilteringScheduleDetails);
    }, [schedules, searchTerm]);

    const refreshSchedules = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(
                `/api/get-doctor-all-schedule/${userId}`,
            );
            setSchedules(response.data?.doctorSchedule || []);
        } catch (err) {
            console.error("Error fetching schedules:", err);
            setSchedules([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleModalOpen = (schedule: DoctorSchedule) => {
        setIsModalOpen(true);
        setSelectedSchedule(schedule);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="m-5">
            <h1 className="text-2xl font-bold text-left mb-5 text-gray-700 dark:text-white">
                Doctor Schedules
            </h1>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <DoctorAllAppointmentFilter
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />
                {isModalOpen && selectedSchedule && (
                    <DoctorAppointments
                        handleModalClose={handleModalClose}
                        schedule={selectedSchedule}
                    />
                )}

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <DoctorAllAppointmentTable
                            filteredSchedules={filteredSchedules}
                            searchTerm={searchTerm}
                            handleModalOpen={handleModalOpen}
                            setSearchTerm={setSearchTerm}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllDoctorRelatedAppointments;
