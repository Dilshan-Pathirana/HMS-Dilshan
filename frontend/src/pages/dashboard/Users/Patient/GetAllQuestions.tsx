import { useState, useEffect } from "react";
import { FiEdit, FiEye, FiTrash, FiList } from "react-icons/fi";
import Spinner from "../../../../assets/Common/Spinner.tsx";
import Pagination from "../../../../components/pharmacyPOS/Common/Pagination.tsx";
import alert from "../../../../utils/alert";
import api from "../../../../utils/api/axios";
import { IQuestionData } from "../../../../utils/types/CreateQuestions/IAllQuestions.ts";
import { ConfirmAlert } from "../../../../assets/Common/Alert/ConfirmAlert.tsx";
import QuestionViewModal from "./QuestionViewModal.tsx";
import QuestionEditModal from "./QuestionEditModal.tsx";
import QuestionAnswerModal from "../QuestionAnswer/QuestionAnswerModal.tsx";

const GetAllQuestions = ({
    refreshQuestions = false,
    triggerRefresh = () => {},
}: {
    refreshQuestions?: boolean;
    triggerRefresh?: () => void;
}) => {
    const [questions, setQuestions] = useState<IQuestionData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewModalContent, setViewModalContent] =
        useState<IQuestionData | null>(null);
    const [editModalContent, setEditModalContent] =
        useState<IQuestionData | null>(null);
    const [answerModalContent, setAnswerModalContent] =
        useState<IQuestionData | null>(null);

    const rowsPerPage = 10;

    const fetchQuestions = async () => {
        try {
            setIsLoading(true);
            const response = await api.get("/get-all-doctor-questions");
            if (response.status === 200) {
                const fetchedQuestions = response.data.doctor_questions || [];
                setQuestions(fetchedQuestions);
            } else {
                alert.warn("Failed to fetch questions.");
                setQuestions([]);
            }
        } catch (error) {
            alert.error("An error occurred while fetching questions.");
            setQuestions([]);
            console.error("Error fetching questions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, [refreshQuestions]);

    const filteredQuestions = questions.filter(
        (question) =>
            question.question
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            question.doctor_first_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            question.doctor_last_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            `${question.doctor_first_name} ${question.doctor_last_name}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase()),
    );

    const totalPages = Math.ceil(filteredQuestions.length / rowsPerPage);
    const paginatedQuestions = filteredQuestions.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage,
    );

    const handlePageChange = (newPage: number) => setCurrentPage(newPage);
    const openViewModal = (question: IQuestionData) =>
        setViewModalContent(question);
    const closeViewModal = () => setViewModalContent(null);
    const openEditModal = (question: IQuestionData) =>
        setEditModalContent(question);
    const closeEditModal = () => setEditModalContent(null);
    const openAnswerModal = (question: IQuestionData) =>
        setAnswerModalContent(question);
    const closeAnswerModal = () => setAnswerModalContent(null);

    const handleDelete = async (questionId: string) => {
        const isConfirm = await ConfirmAlert(
            "Are you sure you want to delete this question?",
            "Do you really want to delete this main question?",
        );

        if (isConfirm) {
            try {
                const response = await api.delete(
                    `/delete-main-question/${questionId}`,
                );

                if (response.status === 200) {
                    const message =
                        response.data.message ||
                        "The question has been deleted!";
                    alert.success(message);
                    triggerRefresh();
                } else {
                    alert.error("Failed to delete the question.");
                }
            } catch (error) {
                alert.error("An error occurred while deleting the question.");
            }
        }
    };

    const getStatusBadge = (status: string | number | null | undefined) => {
        const statusClasses = {
            active: "bg-green-100 text-green-800",
            inactive: "bg-error-100 text-red-800",
            pending: "bg-yellow-100 text-yellow-800",
        };

        let statusString = "";
        let displayStatus = "";

        if (status === 1 || status === "1") {
            statusString = "active";
            displayStatus = "Active";
        } else if (status === 0 || status === "0") {
            statusString = "inactive";
            displayStatus = "Inactive";
        } else if (status) {
            statusString = String(status).toLowerCase();
            displayStatus = String(status);
        } else {
            statusString = "unknown";
            displayStatus = "Unknown";
        }

        const className =
            statusClasses[statusString as keyof typeof statusClasses] ||
            "bg-neutral-100 text-neutral-800";

        return (
            <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${className}`}
            >
                {displayStatus}
            </span>
        );
    };

    return (
        <div className="p-4">
            <div className="bg-white shadow rounded-lg p-4">
                <Spinner isLoading={isLoading} />
                {!isLoading && (
                    <>
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="relative w-1/2">
                                <input
                                    type="text"
                                    placeholder="Search by Question, Doctor Name..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="border border-neutral-300 rounded pl-3 pr-4 py-2 w-full"
                                />
                            </div>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200 border border-neutral-200">
                            <thead className="bg-neutral-50">
                                <tr>
                                    {[
                                        "Doctor Name",
                                        "Question",
                                        "Category",
                                        "Description",
                                        "Order",
                                        "Status",
                                        "Actions",
                                    ].map((header) => (
                                        <th
                                            key={header}
                                            className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedQuestions.map((question) => (
                                    <tr
                                        key={question.id}
                                        className="hover:bg-neutral-50 cursor-pointer"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                            Dr. {question.doctor_first_name}{" "}
                                            {question.doctor_last_name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-900 max-w-xs truncate">
                                            {question.question}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-900 max-w-xs truncate">
                                            {question.category || "Uncategorized"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-900 max-w-xs truncate">
                                            {question.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                            {question.order}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                            {getStatusBadge(question.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                            <div className="flex items-center space-x-3">
                                                <FiEye
                                                    className="text-primary-500 cursor-pointer hover:text-blue-700 text-lg"
                                                    onClick={() =>
                                                        openViewModal(question)
                                                    }
                                                    title="View Question"
                                                />
                                                <FiEdit
                                                    className="text-yellow-500 cursor-pointer hover:text-yellow-700 text-lg"
                                                    onClick={() =>
                                                        openEditModal(question)
                                                    }
                                                    title="Edit Question"
                                                />
                                                <FiList
                                                    className="text-green-500 cursor-pointer hover:text-green-700 text-lg"
                                                    onClick={() =>
                                                        openAnswerModal(
                                                            question,
                                                        )
                                                    }
                                                    title="Manage Answers"
                                                />
                                                <FiTrash
                                                    className="text-error-500 cursor-pointer hover:text-red-700 text-lg"
                                                    onClick={() =>
                                                        handleDelete(
                                                            question.id,
                                                        )
                                                    }
                                                    title="Delete Question"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredQuestions.length === 0 && (
                            <div className="text-center py-8 text-neutral-500">
                                No questions found matching your search
                                criteria.
                            </div>
                        )}

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}

                <QuestionViewModal
                    isOpen={!!viewModalContent}
                    question={viewModalContent}
                    onClose={closeViewModal}
                />

                <QuestionEditModal
                    isOpen={!!editModalContent}
                    questionData={editModalContent}
                    onClose={closeEditModal}
                    triggerRefresh={() => {
                        triggerRefresh();
                        fetchQuestions();
                    }}
                />

                <QuestionAnswerModal
                    isOpen={!!answerModalContent}
                    question={answerModalContent}
                    onClose={closeAnswerModal}
                    triggerRefresh={() => {
                        triggerRefresh();
                        fetchQuestions();
                    }}
                />
            </div>
        </div>
    );
};

export default GetAllQuestions;
