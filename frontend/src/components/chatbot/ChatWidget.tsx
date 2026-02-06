import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    sendChatMessage, 
    sendFeedback, 
    getSuggestions, 
    generateSessionId,
    ChatMessage,
    ChatResponse,
    SuggestionsResponse,
    SupportedLanguage
} from '../../services/chatbotService';

// Icons
const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
);

const ThumbUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
    </svg>
);

const ThumbDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
    </svg>
);

const BotAvatar = () => (
    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    </div>
);

interface MessageBubbleProps {
    message: ChatMessage;
    onFeedback?: (interactionId: string, wasHelpful: boolean) => void;
    onSuggestionClick?: (suggestion: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onFeedback, onSuggestionClick }) => {
    const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null);

    const handleFeedback = (wasHelpful: boolean) => {
        if (feedbackGiven !== null) return;
        setFeedbackGiven(wasHelpful);
        if (onFeedback && message.id) {
            onFeedback(message.id, wasHelpful);
        }
    };

    if (message.type === 'user') {
        return (
            <div className="flex justify-end mb-3">
                <div className="bg-primary-500 text-white px-4 py-2 rounded-2xl rounded-tr-md max-w-[80%] shadow-sm">
                    <p className="text-sm">{message.content}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-2 mb-3">
            <BotAvatar />
            <div className="flex flex-col max-w-[80%]">
                <div className="bg-neutral-100 px-4 py-2 rounded-2xl rounded-tl-md shadow-sm">
                    <p className="text-sm text-neutral-800 whitespace-pre-line">{message.content}</p>
                    
                    {/* Display doctor cards if available */}
                    {message.data?.doctors && message.data.doctors.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {message.data.doctors.map((doctor, idx) => (
                                <div key={idx} className="bg-white p-2 rounded-lg border border-neutral-200 text-xs">
                                    <p className="font-semibold text-blue-700">{doctor.name}</p>
                                    <p className="text-neutral-600">{doctor.specialization}</p>
                                    {doctor.branches.length > 0 && (
                                        <p className="text-neutral-500">📍 {doctor.branches.join(', ')}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Display branch cards if available */}
                    {message.data?.branches && message.data.branches.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {message.data.branches.map((branch, idx) => (
                                <div key={idx} className="bg-white p-2 rounded-lg border border-neutral-200 text-xs">
                                    <p className="font-semibold text-blue-700">{branch.name}</p>
                                    <p className="text-neutral-600">📍 {branch.location}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Display schedules if available */}
                    {message.data?.schedules && message.data.schedules.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {message.data.schedules.slice(0, 5).map((schedule, idx) => (
                                <div key={idx} className="bg-white p-2 rounded-lg border border-neutral-200 text-xs">
                                    <p className="font-semibold text-blue-700">{schedule.doctor_name}</p>
                                    <p className="text-neutral-600">📅 {schedule.date} at {schedule.time}</p>
                                    <p className="text-neutral-500">📍 {schedule.branch_name}</p>
                                    <p className="text-green-600">{schedule.available_slots} slots available</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Disclaimer */}
                    {message.disclaimer && (
                        <div className="mt-2 p-2 bg-amber-50 border-l-3 border-amber-400 text-xs text-amber-800 rounded">
                            ⚠️ {message.disclaimer}
                        </div>
                    )}
                </div>

                {/* Suggestions inline with bot message */}
                {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-2">
                        <div className="flex flex-wrap gap-2">
                            {message.suggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onSuggestionClick && onSuggestionClick(suggestion)}
                                    className="bg-white border border-blue-200 text-blue-700 text-xs px-3 py-1.5 rounded-full hover:bg-blue-50 transition-colors shadow-sm"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Feedback buttons */}
                <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-xs text-neutral-400">Was this helpful?</span>
                    <button
                        onClick={() => handleFeedback(true)}
                        disabled={feedbackGiven !== null}
                        className={`p-1 rounded transition-colors ${
                            feedbackGiven === true 
                                ? 'text-green-600' 
                                : feedbackGiven === null 
                                    ? 'text-neutral-400 hover:text-green-600' 
                                    : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title="Yes, helpful"
                    >
                        <ThumbUpIcon />
                    </button>
                    <button
                        onClick={() => handleFeedback(false)}
                        disabled={feedbackGiven !== null}
                        className={`p-1 rounded transition-colors ${
                            feedbackGiven === false 
                                ? 'text-error-600' 
                                : feedbackGiven === null 
                                    ? 'text-neutral-400 hover:text-error-600' 
                                    : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title="No, not helpful"
                    >
                        <ThumbDownIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};

const TypingIndicator = () => (
    <div className="flex gap-2 mb-3">
        <BotAvatar />
        <div className="bg-neutral-100 px-4 py-3 rounded-2xl rounded-tl-md">
            <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
        </div>
    </div>
);

const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<SuggestionsResponse | null>(null);
    const [sessionId] = useState(() => generateSessionId());
    const [showInitialSuggestions, setShowInitialSuggestions] = useState(true);
    const [language, setLanguage] = useState<SupportedLanguage>(() => {
        // Load language preference from localStorage
        const saved = localStorage.getItem('chatbot_language');
        return (saved === 'si' || saved === 'en') ? saved : 'en';
    });
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Welcome messages for each language
    const welcomeMessages: Record<SupportedLanguage, string> = {
        en: "Hello! 👋 Welcome to Cure.lk! I'm your virtual assistant.\n\nI can help you with:\n• Information about homeopathy treatments\n• Finding doctors and their specializations\n• Our branch locations\n• Booking appointments\n\nHow can I assist you today?",
        si: "ආයුබෝවන්! 👋 Cure.lk වෙත සාදරයෙන් පිළිගනිමු! මම ඔබේ අතථ්‍ය සහායකයායි.\n\nමට ඔබට උදව් කළ හැක්කේ:\n• හෝමියෝපති ප්‍රතිකාර පිළිබඳ තොරතුරු\n• වෛද්‍යවරුන් සහ ඔවුන්ගේ විශේෂීකරණ සොයා ගැනීම\n• අපගේ ශාඛා ස්ථාන\n• හමුවීම් වෙන් කිරීම\n\nඅද මට ඔබට කෙසේ සහාය විය හැකිද?"
    };

    // Save language preference
    const handleLanguageChange = (newLang: SupportedLanguage) => {
        setLanguage(newLang);
        localStorage.setItem('chatbot_language', newLang);
        
        // Reload suggestions for new language
        loadSuggestions(newLang);
        
        // Update welcome message if chat is at initial state
        if (messages.length === 1 && messages[0].id === 'welcome') {
            setMessages([{
                id: 'welcome',
                type: 'bot',
                content: welcomeMessages[newLang],
                timestamp: new Date()
            }]);
        }
    };

    // Load suggestions function
    const loadSuggestions = async (lang: SupportedLanguage) => {
        try {
            const data = await getSuggestions(lang);
            setSuggestions(data);
        } catch (error) {
            console.error('Failed to load suggestions:', error);
        }
    };

    // Scroll to bottom when new messages arrive
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, scrollToBottom]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    // Load suggestions on mount
    useEffect(() => {
        loadSuggestions(language);
    }, []);

    // Add welcome message on first open
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                id: 'welcome',
                type: 'bot',
                content: welcomeMessages[language],
                timestamp: new Date()
            }]);
        }
    }, [isOpen, messages.length, language]);

    const handleSendMessage = async (message: string) => {
        if (!message.trim() || isLoading) return;

        setShowInitialSuggestions(false);
        const userMessage: ChatMessage = {
            id: 'user_' + Date.now(),
            type: 'user',
            content: message.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response: ChatResponse = await sendChatMessage(message.trim(), sessionId, language);
            
            const botMessage: ChatMessage = {
                id: response.interaction_id || 'bot_' + Date.now(),
                type: 'bot',
                content: response.response,
                timestamp: new Date(),
                category: response.category,
                disclaimer: response.disclaimer,
                suggestions: response.suggestions,
                data: response.data
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorContent = language === 'si' 
                ? "සමාවන්න, ඔබේ ඉල්ලීම සකසන විට ගැටලුවක් ඇති විය. කරුණාකර මොහොතකින් නැවත උත්සාහ කරන්න, හෝ ක්ෂණික සහාය සඳහා අපගේ සහාය කණ්ඩායම අමතන්න."
                : "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment, or contact our support team for immediate assistance.";
            const errorMessage: ChatMessage = {
                id: 'error_' + Date.now(),
                type: 'bot',
                content: errorContent,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFeedback = async (interactionId: string, wasHelpful: boolean) => {
        try {
            await sendFeedback(interactionId, wasHelpful);
        } catch (error) {
            console.error('Feedback error:', error);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(inputValue);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        handleSendMessage(suggestion);
    };

    return (
        <>
            {/* Chat Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50 ${
                    isOpen 
                        ? 'bg-gray-600 hover:bg-gray-700' 
                        : 'bg-primary-500 hover:bg-primary-600 animate-pulse hover:animate-none'
                }`}
                title={isOpen ? 'Close chat' : 'Chat with us'}
            >
                <span className="text-white">
                    {isOpen ? <CloseIcon /> : <ChatIcon />}
                </span>
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 h-[32rem] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-slideUp">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary-500 to-blue-700 text-white px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BotAvatar />
                            <div>
                                <h3 className="font-semibold">Cure.lk Assistant</h3>
                                <p className="text-xs text-blue-100">
                                    {language === 'si' ? 'හෝමියෝපති & හමුවීම් ගැන අසන්න' : 'Ask me about homeopathy & appointments'}
                                </p>
                            </div>
                        </div>
                        {/* Language Toggle */}
                        <div className="flex items-center bg-primary-500/30 rounded-full p-0.5">
                            <button
                                onClick={() => handleLanguageChange('en')}
                                className={`px-2 py-1 text-xs rounded-full transition-all ${
                                    language === 'en' 
                                        ? 'bg-white text-blue-700 font-semibold' 
                                        : 'text-blue-100 hover:text-white'
                                }`}
                            >
                                EN
                            </button>
                            <button
                                onClick={() => handleLanguageChange('si')}
                                className={`px-2 py-1 text-xs rounded-full transition-all ${
                                    language === 'si' 
                                        ? 'bg-white text-blue-700 font-semibold' 
                                        : 'text-blue-100 hover:text-white'
                                }`}
                            >
                                සිං
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 bg-neutral-50">
                        {messages.map((message) => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                onFeedback={message.type === 'bot' ? handleFeedback : undefined}
                                onSuggestionClick={handleSuggestionClick}
                            />
                        ))}
                        
                        {isLoading && <TypingIndicator />}
                        
                        {/* Quick Suggestions */}
                        {showInitialSuggestions && suggestions && messages.length === 1 && (
                            <div className="mt-4">
                                <p className="text-xs text-neutral-500 mb-2">Quick questions:</p>
                                <div className="flex flex-wrap gap-2">
                                    {suggestions.suggestions.slice(0, 4).map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            className="bg-white border border-blue-200 text-blue-700 text-xs px-3 py-1.5 rounded-full hover:bg-blue-50 transition-colors shadow-sm"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t border-gray-100">
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={language === 'si' ? 'ඔබේ ප්‍රශ්නය ටයිප් කරන්න...' : 'Type your question...'}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2 border border-neutral-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
                            />
                            <button
                                onClick={() => handleSendMessage(inputValue)}
                                disabled={!inputValue.trim() || isLoading}
                                className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
                            >
                                <SendIcon />
                            </button>
                        </div>
                        <p className="text-xs text-neutral-400 text-center mt-2">
                            {language === 'si' 
                                ? 'හදිසි අවස්ථා සඳහා, කරුණාකර අපගේ හොට්ලයින් ඍජුව අමතන්න' 
                                : 'For emergencies, please call our hotline directly'}
                        </p>
                    </div>
                </div>
            )}

            {/* CSS for animation */}
            <style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slideUp {
                    animation: slideUp 0.3s ease-out;
                }
            `}</style>
        </>
    );
};

export default ChatWidget;
