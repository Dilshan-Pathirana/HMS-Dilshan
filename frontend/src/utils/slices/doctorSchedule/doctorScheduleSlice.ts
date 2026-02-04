import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DoctorSchedule } from "../../types/Website/IDoctorSchedule";

interface DoctorScheduleState {
    selectedSchedule: DoctorSchedule | null;
}

const initialState: DoctorScheduleState = {
    selectedSchedule: null,
};

const doctorScheduleSlice = createSlice({
    name: "doctorSchedule",
    initialState,
    reducers: {
        setSelectedSchedule: (state, action: PayloadAction<DoctorSchedule>) => {
            state.selectedSchedule = action.payload;
        },
        clearSelectedSchedule: (state) => {
            state.selectedSchedule = null;
        },
    },
});

export const { setSelectedSchedule, clearSelectedSchedule } = doctorScheduleSlice.actions;
export default doctorScheduleSlice.reducer;