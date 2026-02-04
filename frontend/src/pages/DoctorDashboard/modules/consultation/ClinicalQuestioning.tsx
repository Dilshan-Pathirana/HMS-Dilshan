import React, { useState, useEffect } from 'react';
import {
    MessageSquare,
    Plus,
    Trash2,
    ChevronDown,
    ChevronUp,
    Search,
    Loader2,
    Check
} from 'lucide-react';
import { QuestionBankItem, ConsultationQuestion } from './types';
import { getQuestionBank } from './consultationApi';

interface ClinicalQuestioningProps {
    consultationId: string;
    questions: ConsultationQuestion[];
    setQuestions: React.Dispatch<React.SetStateAction<ConsultationQuestion[]>>;
}

const CATEGORIES = [
    { id: 'general_symptoms', label: 'General Symptoms', color: 'blue' },
    { id: 'mental_state', label: 'Mental State', color: 'purple' },
    { id: 'physical_symptoms', label: 'Physical Symptoms', color: 'green' },
    { id: 'modalities', label: 'Modalities', color: 'amber' },
];

const ClinicalQuestioning: React.FC<ClinicalQuestioningProps> = ({
    consultationId,
    questions,
    setQuestions
}) => {
    const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['general_symptoms']);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [customQuestion, setCustomQuestion] = useState('');
    const [customAnswer, setCustomAnswer] = useState('');

    useEffect(() => {
        fetchQuestionBank();
    }, []);

    const fetchQuestionBank = async () => {
        try {
            setLoading(true);
            const response = await getQuestionBank();
            if (response.status === 200) {
                setQuestionBank(response.questions);
            }
        } catch (error) {
            console.error('Failed to fetch question bank:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(c => c !== categoryId)
                : [...prev, categoryId]
        );
    };

    const getQuestionsByCategory = (category: string) => {
        return questionBank.filter(q => q.category === category);
    };

    const isQuestionAnswered = (questionId: string) => {
        return questions.some(q => q.question_bank_id === questionId);
    };

    const getAnswerForQuestion = (questionId: string) => {
        const q = questions.find(q => q.question_bank_id === questionId);
        return q?.answer_text || '';
    };

    const handleAnswerChange = (bankQuestion: QuestionBankItem, answer: string) => {
        setQuestions(prev => {
            const existing = prev.find(q => q.question_bank_id === bankQuestion.id);
            if (existing) {
                // Update existing answer
                if (answer.trim() === '') {
                    // Remove if empty
                    return prev.filter(q => q.question_bank_id !== bankQuestion.id);
                }
                return prev.map(q =>
                    q.question_bank_id === bankQuestion.id
                        ? { ...q, answer_text: answer }
                        : q
                );
            } else if (answer.trim() !== '') {
                // Add new answer
                return [...prev, {
                    id: `temp-${Date.now()}`,
                    consultation_id: consultationId,
                    question_bank_id: bankQuestion.id,
                    question_text: bankQuestion.question_text,
                    answer_text: answer,
                    is_custom: false
                }];
            }
            return prev;
        });
    };

    const handleYesNoChange = (bankQuestion: QuestionBankItem, value: 'Yes' | 'No') => {
        handleAnswerChange(bankQuestion, value);
    };

    const handleScaleChange = (bankQuestion: QuestionBankItem, value: number) => {
        handleAnswerChange(bankQuestion, value.toString());
    };

    const handleAddCustomQuestion = () => {
        if (!customQuestion.trim() || !customAnswer.trim()) return;
        
        setQuestions(prev => [...prev, {
            id: `custom-${Date.now()}`,
            consultation_id: consultationId,
            question_bank_id: null,
            question_text: customQuestion,
            answer_text: customAnswer,
            is_custom: true
        }]);
        
        setCustomQuestion('');
        setCustomAnswer('');
        setShowCustomForm(false);
    };

    const handleRemoveQuestion = (questionId: string) => {
        setQuestions(prev => prev.filter(q => q.id !== questionId));
    };

    const filteredQuestionBank = searchTerm
        ? questionBank.filter(q =>
            q.question_text.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : questionBank;

    const getCustomQuestions = () => {
        return questions.filter(q => q.is_custom);
    };

    const getCategoryColor = (categoryId: string) => {
        const cat = CATEGORIES.find(c => c.id === categoryId);
        return cat?.color || 'gray';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Clinical Questions</h2>
                    <p className="text-gray-500">
                        Answer relevant questions from the Materia Medica repertory
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                        {questions.length} question{questions.length !== 1 ? 's' : ''} answered
                    </span>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search questions..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Question Categories */}
            <div className="space-y-4">
                {CATEGORIES.map(category => {
                    const categoryQuestions = getQuestionsByCategory(category.id);
                    const answeredCount = categoryQuestions.filter(q => isQuestionAnswered(q.id)).length;
                    const isExpanded = expandedCategories.includes(category.id);

                    // Filter if searching
                    const displayQuestions = searchTerm
                        ? filteredQuestionBank.filter(q => q.category === category.id)
                        : categoryQuestions;

                    if (searchTerm && displayQuestions.length === 0) return null;

                    return (
                        <div
                            key={category.id}
                            className={`border border-gray-200 rounded-xl overflow-hidden ${
                                isExpanded ? 'ring-2 ring-' + category.color + '-500/30' : ''
                            }`}
                        >
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(category.id)}
                                className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors bg-${category.color}-50/50`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full bg-${category.color}-500`} />
                                    <span className="font-semibold text-gray-800">{category.label}</span>
                                    <span className={`px-2 py-0.5 text-xs rounded-full bg-${category.color}-100 text-${category.color}-700`}>
                                        {answeredCount}/{categoryQuestions.length}
                                    </span>
                                </div>
                                {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-gray-500" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-500" />
                                )}
                            </button>

                            {/* Questions */}
                            {isExpanded && (
                                <div className="divide-y divide-gray-100">
                                    {displayQuestions.map(bankQuestion => (
                                        <QuestionItem
                                            key={bankQuestion.id}
                                            question={bankQuestion}
                                            answer={getAnswerForQuestion(bankQuestion.id)}
                                            onAnswerChange={(answer) => handleAnswerChange(bankQuestion, answer)}
                                            onYesNoChange={(value) => handleYesNoChange(bankQuestion, value)}
                                            onScaleChange={(value) => handleScaleChange(bankQuestion, value)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Custom Questions */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-4 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-gray-600" />
                        <span className="font-semibold text-gray-800">Custom Questions</span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
                            {getCustomQuestions().length}
                        </span>
                    </div>
                    <button
                        onClick={() => setShowCustomForm(!showCustomForm)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4" />
                        Add Custom
                    </button>
                </div>

                {/* Custom Question Form */}
                {showCustomForm && (
                    <div className="p-4 bg-blue-50 border-b border-gray-200">
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={customQuestion}
                                onChange={(e) => setCustomQuestion(e.target.value)}
                                placeholder="Enter your question..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <textarea
                                value={customAnswer}
                                onChange={(e) => setCustomAnswer(e.target.value)}
                                placeholder="Enter the answer..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
                            />
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={() => setShowCustomForm(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddCustomQuestion}
                                    disabled={!customQuestion.trim() || !customAnswer.trim()}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    <Check className="w-4 h-4" />
                                    Add Question
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Custom Questions List */}
                {getCustomQuestions().length > 0 && (
                    <div className="divide-y divide-gray-100">
                        {getCustomQuestions().map(question => (
                            <div key={question.id} className="p-4 flex items-start gap-4">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">{question.question_text}</p>
                                    <p className="text-gray-600 mt-1">{question.answer_text}</p>
                                </div>
                                <button
                                    onClick={() => handleRemoveQuestion(question.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Individual Question Item Component
const QuestionItem: React.FC<{
    question: QuestionBankItem;
    answer: string;
    onAnswerChange: (answer: string) => void;
    onYesNoChange: (value: 'Yes' | 'No') => void;
    onScaleChange: (value: number) => void;
}> = ({ question, answer, onAnswerChange, onYesNoChange, onScaleChange }) => {
    const renderAnswerInput = () => {
        switch (question.answer_type) {
            case 'yes_no':
                return (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onYesNoChange('Yes')}
                            className={`px-4 py-2 rounded-lg border transition-colors ${
                                answer === 'Yes'
                                    ? 'bg-green-100 border-green-500 text-green-700'
                                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            Yes
                        </button>
                        <button
                            onClick={() => onYesNoChange('No')}
                            className={`px-4 py-2 rounded-lg border transition-colors ${
                                answer === 'No'
                                    ? 'bg-red-100 border-red-500 text-red-700'
                                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            No
                        </button>
                    </div>
                );
            case 'scale':
                return (
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <button
                                key={num}
                                onClick={() => onScaleChange(num)}
                                className={`w-8 h-8 rounded-lg border transition-colors text-sm font-medium ${
                                    parseInt(answer) === num
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                );
            case 'multiple_choice':
                return (
                    <div className="flex flex-wrap gap-2">
                        {question.options?.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => onAnswerChange(option)}
                                className={`px-4 py-2 rounded-lg border transition-colors ${
                                    answer === option
                                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                );
            default:
                return (
                    <textarea
                        value={answer}
                        onChange={(e) => onAnswerChange(e.target.value)}
                        placeholder="Enter response..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] resize-none"
                    />
                );
        }
    };

    return (
        <div className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-3 mb-3">
                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                    answer ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <p className="font-medium text-gray-800 flex-1">{question.question_text}</p>
                {question.is_required && (
                    <span className="text-red-500 text-sm">Required</span>
                )}
            </div>
            <div className="ml-5">
                {renderAnswerInput()}
            </div>
        </div>
    );
};

export default ClinicalQuestioning;
