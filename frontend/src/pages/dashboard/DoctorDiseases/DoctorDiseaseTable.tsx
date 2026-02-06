import { useState, useEffect } from "react";
import { FiEye, FiEdit, FiTrash2 } from "react-icons/fi";
import api from "../../../utils/api/axios";
import Spinner from "../../../assets/Common/Spinner.tsx";
import Pagination from "../../../components/pharmacyPOS/Common/Pagination.tsx";
import alert from "../../../utils/alert";
import {
    DoctorDisease,
    DoctorDiseaseTableProps,
} from "../../../utils/types/DoctorDisease/DoctorDisease.ts";
import { ConfirmAlert } from "../../../assets/Common/Alert/ConfirmAlert.tsx";
import DoctorDiseaseEditModal from "./View/DoctorDiseaseEditModal.tsx";

const DoctorDiseaseTable: React.FC<DoctorDiseaseTableProps> = ({
    refreshDiseases,
}) => {
    const [diseases, setDiseases] = useState<DoctorDisease[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedDisease, setSelectedDisease] =
        useState<DoctorDisease | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const rowsPerPage = 10;

    useEffect(() => {
        fetchAllDiseases();
    }, [refreshDiseases]);

    const fetchAllDiseases = async () => {
        try {
            setIsLoading(true);
            const response = await api.get("/get-all-doctor-disease");
            if (response.data.status === 200) {
                setDiseases(response.data.doctor_diseases || []);
            } else {
                alert.warn("Failed to fetch doctor diseases.");
                setDiseases([]);
            }
        } catch {
            alert.error("An error occurred while fetching diseases.");
            setDiseases([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteDisease = async (diseaseId: string) => {
        const disease = diseases.find((d) => d.id === diseaseId);
        const diseaseName = disease?.disease_name || "this disease";
        const doctorName = disease
            ? `Dr. ${disease.doctor_first_name} ${disease.doctor_last_name}`
            : "";

        const isConfirmed = await ConfirmAlert(
            "Delete Disease",
            `Are you sure you want to delete "${diseaseName}"${doctorName ? ` by ${doctorName}` : ""}? This action cannot be undone.`,
        );

        if (isConfirmed) {
            try {
                const response = await api.delete(
                    `/delete-doctor-disease/${diseaseId}`,
                );
                if (response.status === 200) {
                    alert.success("Disease deleted successfully.");
                    setDiseases((prev) =>
                        prev.filter((disease) => disease.id !== diseaseId),
                    );
                } else {
                    alert.error("Failed to delete the disease.");
                }
            } catch {
                alert.error("An error occurred while deleting the disease.");
            }
        }
    };

    const handleEditClick = (disease: DoctorDisease) => {
        setSelectedDisease(disease);
        setIsEditModalOpen(true);
    };

    const handleEditSuccess = () => {
        fetchAllDiseases();
    };

    const handleEditClose = () => {
        setIsEditModalOpen(false);
        setSelectedDisease(null);
    };

    const handleViewClick = (disease: DoctorDisease) => {
        setSelectedDisease(disease);
        setIsDetailsModalOpen(true);
    };

    const totalPages = Math.ceil(diseases.length / rowsPerPage);
    const paginatedDiseases = diseases.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage,
    );

    const handlePageChange = (newPage: number) => setCurrentPage(newPage);

    return (
        <div className="p-4">
            <Spinner isLoading={isLoading} />
            {!isLoading && (
                <>
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold text-neutral-800">
                            Doctor Diseases
                        </h2>
                        <p className="text-neutral-600">
                            Manage diseases created by doctors
                        </p>
                    </div>

                    {paginatedDiseases.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200 border border-neutral-200 mt-4">
                            <thead className="bg-neutral-50">
                                <tr>
                                    {[
                                        "Disease Name",
                                        "Doctor Name",
                                        "Priority",
                                        "Description",
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
                                {paginatedDiseases.map((disease) => (
                                    <tr
                                        key={disease.id}
                                        className="hover:bg-neutral-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                                            {disease.disease_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                            Dr. {disease.doctor_first_name}{" "}
                                            {disease.doctor_last_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                            {disease.priority ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    Priority {disease.priority}
                                                </span>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-900 max-w-xs truncate">
                                            {disease.description || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                                            <div className="flex items-center space-x-3">
                                                <FiEye
                                                    className="text-primary-500 cursor-pointer hover:text-blue-700 w-4 h-4"
                                                    onClick={() =>
                                                        handleViewClick(disease)
                                                    }
                                                    title="View Details"
                                                />
                                                <FiEdit
                                                    className="text-green-500 cursor-pointer hover:text-green-700 w-4 h-4"
                                                    onClick={() =>
                                                        handleEditClick(disease)
                                                    }
                                                    title="Edit Disease"
                                                />
                                                <FiTrash2
                                                    className="text-error-500 cursor-pointer hover:text-red-700 w-4 h-4"
                                                    onClick={() =>
                                                        handleDeleteDisease(
                                                            disease.id,
                                                        )
                                                    }
                                                    title="Delete Disease"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-8 text-neutral-600">
                            No doctor diseases found.
                        </div>
                    )}

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </>
            )}

            {isDetailsModalOpen && selectedDisease && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-neutral-800">
                                Disease Details
                            </h3>
                            <button
                                onClick={() => setIsDetailsModalOpen(false)}
                                className="text-neutral-400 hover:text-neutral-600"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700">
                                    Disease Name
                                </label>
                                <p className="text-sm text-neutral-900 mt-1">
                                    {selectedDisease.disease_name}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700">
                                    Doctor
                                </label>
                                <p className="text-sm text-neutral-900 mt-1">
                                    Dr. {selectedDisease.doctor_first_name}{" "}
                                    {selectedDisease.doctor_last_name}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700">
                                    Priority
                                </label>
                                <p className="text-sm text-neutral-900 mt-1">
                                    {selectedDisease.priority
                                        ? `Priority ${selectedDisease.priority}`
                                        : "Not set"}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700">
                                    Description
                                </label>
                                <p className="text-sm text-neutral-900 mt-1">
                                    {selectedDisease.description ||
                                        "No description provided"}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setIsDetailsModalOpen(false)}
                                className="px-4 py-2 bg-neutral-200 text-neutral-800 rounded-md hover:bg-neutral-300 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedDisease && (
                <DoctorDiseaseEditModal
                    isOpen={isEditModalOpen}
                    onClose={handleEditClose}
                    onSuccess={handleEditSuccess}
                    disease={selectedDisease}
                />
            )}
        </div>
    );
};

export default DoctorDiseaseTable;
