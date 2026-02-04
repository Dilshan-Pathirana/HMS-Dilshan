import React, { useState, useEffect, useMemo } from "react";
import { FiUser } from "react-icons/fi";
import Spinner from "../../../assets/Common/Spinner.tsx";
import Pagination from "../../../components/pharmacyPOS/Common/Pagination.tsx";
import alert from "../../../utils/alert";
import api from "../../../utils/api/axios";
import { useSelector } from "react-redux";
import {
    IDoctorSession,
    IGetDoctorSessionsProps,
    IQuestionAnswer,
    IQuestionData,
    IQuestionWithAnswers,
} from "../../../utils/types/DoctorSession/IDoctorSession.ts";
import QuestionsModal from "./View/QuestionsModal.tsx";
import DoctorSessionCardList from "./View/DoctorSessionCardList.tsx";

const GetDoctorSessions: React.FC<IGetDoctorSessionsProps> = ({
    refreshSessions = false,
}) => {
    const [sessions, setSessions] = useState<IDoctorSession[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [showQuestionsModal, setShowQuestionsModal] =
        useState<boolean>(false);
    const [questionsWithAnswers, setQuestionsWithAnswers] = useState<
        IQuestionWithAnswers[]
    >([]);
    const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false);
    const [selectedSession, setSelectedSession] =
        useState<IDoctorSession | null>(null);

    const currentUserId = useSelector((state: any) => state.auth.userId);
    const rowsPerPage = 6;

    const fetchDoctorSessions = async (doctorId: string) => {
        try {
            setIsLoading(true);
            const response = await api.get(
                `/doctor-sessions/${doctorId}`,
            );

            if (response.status === 200) {
                const fetchedSessions = response.data.doctor_sessions || [];
                setSessions(fetchedSessions);
            } else {
                alert.warn("Failed to fetch your sessions.");
                setSessions([]);
            }
        } catch (error) {
            alert.error("An error occurred while fetching your sessions.");
            setSessions([]);
            console.error("Error fetching doctor sessions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchQuestionsAndAnswers = async (doctorId: string) => {
        try {
            setLoadingQuestions(true);

            const questionsResponse = await api.get(
                `/get-doctor-questions/${doctorId}`,
            );

            if (questionsResponse.status === 200) {
                const questions: IQuestionData[] =
                    questionsResponse.data.doctor_questions || [];

                const questionsWithAnswersPromises = questions.map(
                    async (question) => {
                        try {
                            const answersResponse = await api.get(
                                `/get-question-answers-doctor/${question.id}`,
                            );
                            const answers: IQuestionAnswer[] =
                                answersResponse.data.question_answers || [];

                            return {
                                ...question,
                                answers,
                                isExpanded: false,
                            };
                        } catch (error) {
                            console.error(
                                `Error fetching answers for question ${question.id}:`,
                                error,
                            );
                            return {
                                ...question,
                                answers: [],
                                isExpanded: false,
                            };
                        }
                    },
                );

                const questionsWithAnswersData = await Promise.all(
                    questionsWithAnswersPromises,
                );
                setQuestionsWithAnswers(questionsWithAnswersData);
            } else {
                alert.warn("Failed to fetch questions.");
                setQuestionsWithAnswers([]);
            }
        } catch (error) {
            alert.error("An error occurred while fetching questions.");
            setQuestionsWithAnswers([]);
            console.error("Error fetching questions:", error);
        } finally {
            setLoadingQuestions(false);
        }
    };

    useEffect(() => {
        if (currentUserId) {
            fetchDoctorSessions(currentUserId);
        } else {
            setSessions([]);
            setIsLoading(false);
        }
    }, [currentUserId, refreshSessions]);

    const filteredSessions = useMemo(() => {
        const searchLower = searchTerm.toLowerCase();
        return sessions.filter((session) => {
            return (
                session.patient_first_name
                    ?.toLowerCase()
                    .includes(searchLower) ||
                session.patient_last_name
                    ?.toLowerCase()
                    .includes(searchLower) ||
                session.branch_center_name
                    ?.toLowerCase()
                    .includes(searchLower) ||
                `${session.patient_first_name} ${session.patient_last_name}`
                    .toLowerCase()
                    .includes(searchLower)
            );
        });
    }, [searchTerm, sessions]);

    const totalPages = useMemo(() => {
        return Math.ceil(filteredSessions.length / rowsPerPage);
    }, [filteredSessions.length]);
    const paginatedSessions = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredSessions.slice(start, start + rowsPerPage);
    }, [currentPage, filteredSessions]);

    const handlePageChange = (newPage: number) => setCurrentPage(newPage);

    const handleStartSession = async (session: IDoctorSession) => {
        setSelectedSession(session);
        setShowQuestionsModal(true);
        await fetchQuestionsAndAnswers(currentUserId);
    };

    const handleCloseModal = () => {
        setShowQuestionsModal(false);
        setSelectedSession(null);
        setQuestionsWithAnswers([]);
    };

    const toggleQuestionExpansion = (questionId: string) => {
        setQuestionsWithAnswers((prev) =>
            prev.map((q) =>
                q.id === questionId ? { ...q, isExpanded: !q.isExpanded } : q,
            ),
        );
    };

    if (!currentUserId) {
        return (
            <div className="p-4 mt-20 ml-[20rem] mr-[30px]">
                <div className="bg-white shadow rounded-lg p-4">
                    <div className="text-center py-8 text-red-500">
                        Please log in to view your sessions.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Doctor Sessions
                </h2>
                <div className="mb-4">
                    <div className="relative w-1/2">
                        <input
                            type="text"
                            placeholder="Search by Patient Name or Branch..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border border-gray-300 rounded-lg pl-4 pr-4 py-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            <Spinner isLoading={isLoading} />

            {!isLoading && (
                <>
                    {filteredSessions.length > 0 ? (
                        <>
                            <DoctorSessionCardList
                                sessions={paginatedSessions}
                                onStartSession={handleStartSession}
                            />

                            <div className="mt-8">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="bg-white shadow rounded-lg p-12">
                            <div className="text-center text-gray-500">
                                <div className="mb-4">
                                    <FiUser className="mx-auto h-12 w-12 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No Sessions Found
                                </h3>
                                <p>
                                    {searchTerm
                                        ? "No sessions found matching your search criteria."
                                        : "You have no sessions yet."}
                                </p>
                            </div>
                        </div>
                    )}
                </>
            )}

            <QuestionsModal
                isOpen={showQuestionsModal}
                selectedSession={selectedSession}
                questionsWithAnswers={questionsWithAnswers}
                loadingQuestions={loadingQuestions}
                onClose={handleCloseModal}
                onToggleQuestion={toggleQuestionExpansion}
            />
        </div>
    );
};

export default GetDoctorSessions;
