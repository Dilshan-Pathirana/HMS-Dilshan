import React, { useState } from "react";
import api from "../../../../../../utils/api/axios";
import { DateIcon } from "../../../../../../utils/types/Appointment/SvgComponents.tsx";
import { IPatientAppointmentTableHeaderProps } from "../../../../../../utils/types/users/IDoctorData.ts";
import SlotBadge from "./SlotBadge";
import { AlertService } from "../../../../../../assets/Common/Alert/DoctorAppointment/DoctorAppointmentCancel.tsx";
import CancelScheduleButton from "../../../../../../components/DoctorDashboard/Common/CancelScheduleButton.tsx";
import ToggleDetailsButton from "../../../../../../components/DoctorDashboard/Common/ToggleDetailsButton.tsx";
import CancelReasonModal from "./CancelReasonModal";

const PatientAppointmentTableHeaderDetails: React.FC<
    IPatientAppointmentTableHeaderProps
> = ({
    date,
    bookedCount,
    availableSlots,
    expandedDates,
    toggleDate,
    schedule,
    userId,
    onAppointmentsCancelled,
    appointmentsForDate,
}) => {
    const [isCancelling, setIsCancelling] = useState<boolean>(false);
    const [showReasonModal, setShowReasonModal] = useState<boolean>(false);

    const allAppointmentsCancelled =
        appointmentsForDate?.every((appointment) => appointment.status === 0) ||
        false;

    const handleCancelClick = () => {
        setShowReasonModal(true);
    };

    const handleCancelSchedule = async (reason: string) => {
        try {
            setIsCancelling(true);
            setShowReasonModal(false);

            const response = await api.post("/request-cancel-doctor-appointment", {
                doctor_id: userId,
                branch_id: schedule.branch_id,
                schedule_id: schedule.id,
                date: date,
                reason: reason,
            });

            if (response.data.status === 200) {
                await AlertService.showSuccessAlert();

                if (onAppointmentsCancelled) {
                    onAppointmentsCancelled();
                }
            } else {
                await AlertService.showErrorAlert(response.data.message);
            }
        } catch (error) {
            console.error("Error cancelling appointments:", error);
            await AlertService.showErrorAlert();
        } finally {
            setIsCancelling(false);
        }
    };

    const handleModalClose = () => {
        setShowReasonModal(false);
    };

    const isExpanded = expandedDates.includes(date);
    const isCancelDisabled =
        isCancelling || bookedCount === 0 || allAppointmentsCancelled;

    return (
        <>
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center space-x-1">
                    <DateIcon className="h-3.5 w-3.5 text-green-600" />
                    <h3 className="text-xs font-medium text-neutral-700">
                        {date}
                    </h3>
                </div>

                <div className="flex items-center">
                    <SlotBadge count={bookedCount} type="booked" />
                    <SlotBadge count={availableSlots} type="available" />

                    <CancelScheduleButton
                        onClick={handleCancelClick}
                        isLoading={isCancelling}
                        disabled={isCancelDisabled}
                        allCancelled={allAppointmentsCancelled}
                    />

                    <ToggleDetailsButton
                        onClick={() => toggleDate(date)}
                        isExpanded={isExpanded}
                    />
                </div>
            </div>

            <CancelReasonModal
                isOpen={showReasonModal}
                onClose={handleModalClose}
                onConfirm={handleCancelSchedule}
                date={date}
                isLoading={isCancelling}
            />
        </>
    );
};

export default PatientAppointmentTableHeaderDetails;
