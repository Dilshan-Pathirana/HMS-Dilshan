import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const chatbotApi = axios.create({
    baseURL: `${API_BASE_URL}/api/chatbot`,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

export interface ChatMessage {
    id: string;
    type: 'user' | 'bot';
    content: string;
    timestamp: Date;
    category?: string;
    disclaimer?: string;
    suggestions?: string[];
    data?: {
        doctors?: DoctorInfo[];
        branches?: BranchInfo[];
        schedules?: ScheduleInfo[];
    };
}

export interface DoctorInfo {
    id: string;
    name: string;
    specialization: string;
    branches: string[];
}

export interface BranchInfo {
    id: string;
    name: string;
    location: string;
    contact?: string;
}

export interface ScheduleInfo {
    doctor_name: string;
    branch_name: string;
    date: string;
    time: string;
    available_slots: number;
}

export interface ChatResponse {
    success: boolean;
    response: string;
    category: string;
    suggestions: string[];
    disclaimer?: string;
    data?: {
        doctors?: DoctorInfo[];
        branches?: BranchInfo[];
        schedules?: ScheduleInfo[];
    };
    interaction_id: string;
    language?: string;
}

export interface SuggestionsResponse {
    suggestions: string[];
    categories: {
        key: string;
        label: string;
        examples: string[];
    }[];
    language?: string;
}

export type SupportedLanguage = 'en' | 'si';

/**
 * Send a chat message to the chatbot API
 */
export const sendChatMessage = async (
    message: string,
    sessionId?: string,
    language: SupportedLanguage = 'en'
): Promise<ChatResponse> => {
    const response = await chatbotApi.post('/chat', {
        question: message,
        session_id: sessionId,
        language: language
    });
    return response.data;
};

/**
 * Send feedback about a chatbot response
 */
export const sendFeedback = async (interactionId: string, wasHelpful: boolean): Promise<{ success: boolean }> => {
    const response = await chatbotApi.post('/feedback', {
        interaction_id: interactionId,
        was_helpful: wasHelpful
    });
    return response.data;
};

/**
 * Get initial suggestions for the chatbot
 */
export const getSuggestions = async (language: SupportedLanguage = 'en'): Promise<SuggestionsResponse> => {
    const response = await chatbotApi.get('/suggestions', {
        params: { language }
    });
    return response.data;
};

// Helper to generate a session ID
export const generateSessionId = (): string => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
};
