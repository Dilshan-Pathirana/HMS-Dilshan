import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { initialState } from "../../types/DoctorSession/ISessionAnswer.ts";

export const sessionAnswersSlice = createSlice({
    name: "sessionAnswers",
    initialState,
    reducers: {
        initializeSession: (
            state,
            action: PayloadAction<{
                patient_id: string;
                doctor_id: string;
                branch_id: string;
                session_id: string;
                patient_name: string;
                branch_name: string;
            }>,
        ) => {
            state.current_session = {
                ...action.payload,
                selected_answers: [],
                custom_answers: [],
                is_saved: false,
            };
        },

        selectAnswer: (
            state,
            action: PayloadAction<{
                question_id: string;
                selected_answer_id: string;
                answer_text: string;
                question_text: string;
                is_custom?: boolean;
            }>,
        ) => {
            if (!state.current_session) return;

            const existingAnswerIndex =
                state.current_session.selected_answers.findIndex(
                    (answer) =>
                        answer.question_id === action.payload.question_id,
                );

            if (existingAnswerIndex !== -1) {
                state.current_session.selected_answers[existingAnswerIndex] =
                    action.payload;
            } else {
                state.current_session.selected_answers.push(action.payload);
            }
        },

        addCustomAnswer: (
            state,
            action: PayloadAction<{
                question_id: string;
                custom_answer_text: string;
                question_text: string;
            }>,
        ) => {
            if (!state.current_session) return;

            const customAnswerId = `custom_${action.payload.question_id}_${Date.now()}`;

            const existingCustomIndex =
                state.current_session.custom_answers.findIndex(
                    (answer) =>
                        answer.question_id === action.payload.question_id,
                );

            const customAnswer = {
                question_id: action.payload.question_id,
                custom_answer_id: customAnswerId,
                custom_answer_text: action.payload.custom_answer_text,
                question_text: action.payload.question_text,
                created_at: new Date().toISOString(),
            };

            if (existingCustomIndex !== -1) {
                state.current_session.custom_answers[existingCustomIndex] =
                    customAnswer;
            } else {
                state.current_session.custom_answers.push(customAnswer);
            }

            const selectedAnswer = {
                question_id: action.payload.question_id,
                selected_answer_id: customAnswerId,
                answer_text: action.payload.custom_answer_text,
                question_text: action.payload.question_text,
                is_custom: true,
            };

            const existingSelectedIndex =
                state.current_session.selected_answers.findIndex(
                    (answer) =>
                        answer.question_id === action.payload.question_id,
                );

            if (existingSelectedIndex !== -1) {
                state.current_session.selected_answers[existingSelectedIndex] =
                    selectedAnswer;
            } else {
                state.current_session.selected_answers.push(selectedAnswer);
            }
        },

        saveSessionStart: (state) => {
            state.is_saving = true;
        },

        saveSessionSuccess: (state) => {
            if (!state.current_session) return;

            state.current_session.is_saved = true;
            state.current_session.saved_at = new Date().toISOString();
            const existingSessionIndex = state.saved_sessions.findIndex(
                (session) =>
                    session.session_id === state.current_session!.session_id,
            );

            if (existingSessionIndex !== -1) {
                state.saved_sessions[existingSessionIndex] = {
                    ...state.current_session,
                };
            } else {
                state.saved_sessions.push({ ...state.current_session });
            }

            state.is_saving = false;
        },

        saveSessionFailure: (state) => {
            state.is_saving = false;
        },

        clearCurrentSession: (state) => {
            state.current_session = null;
        },
    },
});

export const {
    initializeSession,
    selectAnswer,
    addCustomAnswer,
    saveSessionStart,
    saveSessionSuccess,
    saveSessionFailure,
    clearCurrentSession,
} = sessionAnswersSlice.actions;

export default sessionAnswersSlice.reducer;
