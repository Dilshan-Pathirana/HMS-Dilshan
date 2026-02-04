export interface DoctorSchedule {
    id?: string;
    user_first_name: string;
    user_last_name: string;
    areas_of_specialization?: string;
    branch_center_name: string;
    schedule_day: string;
    start_time: string;
    [key: string]: any;
}

type AnyDoctorSchedule = DoctorSchedule | Record<string, any>;
export const deduplicateDoctorSchedules = <T extends AnyDoctorSchedule>(schedules: T[]): T[] => {
    return schedules.reduce((acc: T[], current: T) => {
        const existingDoctor = acc.find(
            (doctor) =>
                doctor.user_first_name === current.user_first_name &&
                doctor.user_last_name === current.user_last_name,
        );

        if (!existingDoctor) {
            const doctorSchedules_filtered = schedules.filter(
                (schedule) =>
                    schedule.user_first_name === current.user_first_name &&
                    schedule.user_last_name === current.user_last_name,
            );

            const doctorSpecializations = doctorSchedules_filtered
                .map((schedule) => schedule.areas_of_specialization)
                .filter((value, index, self) => value && self.indexOf(value) === index);

            const doctorBranches = doctorSchedules_filtered
                .map((schedule) => schedule.branch_center_name)
                .filter((value, index, self) => self.indexOf(value) === index);

            acc.push({
                ...current,
                areas_of_specialization: doctorSpecializations.join(", "),
                branch_center_name: doctorBranches.join(", "),
            });
        }
        return acc;
    }, []);
};

export const groupDoctorSchedulesByTimeSlots = <T extends AnyDoctorSchedule>(schedules: T[]): T[] => {
    return schedules.reduce((acc: T[], current: T) => {
        const existingSchedule = acc.find(
            (schedule) =>
                schedule.user_first_name === current.user_first_name &&
                schedule.user_last_name === current.user_last_name &&
                schedule.branch_center_name === current.branch_center_name &&
                schedule.schedule_day === current.schedule_day &&
                schedule.start_time === current.start_time
        );

        if (!existingSchedule) {
            const sameSlotSchedules = schedules.filter(
                (schedule) =>
                    schedule.user_first_name === current.user_first_name &&
                    schedule.user_last_name === current.user_last_name &&
                    schedule.branch_center_name === current.branch_center_name &&
                    schedule.schedule_day === current.schedule_day &&
                    schedule.start_time === current.start_time
            );

            const specializations = sameSlotSchedules
                .map((schedule) => schedule.areas_of_specialization)
                .filter((value, index, self) => value && self.indexOf(value) === index);

            acc.push({
                ...current,
                areas_of_specialization: specializations.join(", "),
            });
        }
        return acc;
    }, []);
};

export const splitAndLimitItems = (values: string, visibleCount: number = 2) => {
    if (!values) return { visible: '', hiddenItems: [], hiddenCount: 0 };

    const items = values.split(",").map((item) => item.trim()).filter(Boolean);
    const visibleItems = items.slice(0, visibleCount);
    const hiddenItems = items.slice(visibleCount);

    return {
        visible: visibleItems.join(", "),
        hiddenItems,
        hiddenCount: hiddenItems.length,
    };
};

export const formatTimeTo12Hour = (time24: string): string => {
    if (!time24) return '';
    
    try {
        const [hours, minutes] = time24.split(':');
        const hour24 = parseInt(hours, 10);
        const minute = parseInt(minutes, 10);
        
        if (isNaN(hour24) || isNaN(minute)) return time24;
        
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        const minuteStr = minute.toString().padStart(2, '0');
        
        return `${hour12}:${minuteStr} ${ampm}`;
    } catch (error) {
        return time24;
    }
};
