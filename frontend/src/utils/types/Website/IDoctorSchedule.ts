export interface DoctorSchedule {
    areas_of_specialization: string;
    id: string;
    user_first_name: string;
    user_last_name: string;
    branch_center_name: string;
    schedule_day: string;
    start_time: string;
    doctor_id: string;
    branch_id: string;
}

export interface IDoctorDetailsCardProp {
    doctorSchedules: DoctorSchedule[];
}
