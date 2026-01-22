export interface ISelectedAnswer {
    question_id: string;
    selected_answer_id: string;
    answer_text: string;
    question_text: string;
    is_custom?: boolean;
}

export interface ISessionAnswers {
    patient_id: string;
    doctor_id: string;
    branch_id: string;
    session_id: string;
    patient_name: string;
    branch_name: string;
    selected_answers: ISelectedAnswer[];
    custom_answers: ICustomAnswer[];
    is_saved: boolean;
    saved_at?: string;
    is_custom?: boolean;
}

export interface ISessionAnswersState {
    current_session: ISessionAnswers | null;
    saved_sessions: ISessionAnswers[];
    is_saving: boolean;
}

export const initialState: ISessionAnswersState = {
    current_session: null,
    saved_sessions: [],
    is_saving: false,
};
export interface ICustomAnswer {
    question_id: string;
    custom_answer_id: string;
    custom_answer_text: string;
    question_text: string;
    created_at: string;
}
