import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FileText, Search, Filter, Eye, CheckCircle, AlertTriangle,
    Clock, User, Calendar, Pill, RefreshCw, MessageSquare,
    AlertCircle, ChevronLeft, ChevronRight, Download, Printer
} from 'lucide-react';

interface Prescription {
    id: string;
    prescription_number: string;
    patient_name: string;
    patient_id: string;
    doctor_name: string;
    doctor_id: string;
    date: string;
    type: 'OPD' | 'IPD';
    status: 'pending' | 'dispensed' | 'partial' | 'clarification' | 'cancelled';
    items_count: number;
    notes?: string;
    is_verified: boolean;
    created_at: string;
}

interface PrescriptionStats {
    total_today: number;
    pending: number;
    dispensed: number;
    clarification_needed: number;
    partial: number;
}

export const PharmacistPrescriptions: React.FC = () => {
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [stats, setStats] = useState<PrescriptionStats>({
        total_today: 0,
        pending: 0,
        dispensed: 0,
        clarification_needed: 0,
        partial: 0
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('today');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const itemsPerPage = 15;

    useEffect(() => {
        fetchPrescriptions();
    }, [filterType, filterStatus, dateFilter]);

    const fetchPrescriptions = async () => {
        setLoading(true);
        try {
            // Mock data - replace with actual API call
            const mockPrescriptions: Prescription[] = [
                {
                    id: '1',
                    prescription_number: 'RX-2025-001234',
                    patient_name: 'John Doe',
                    patient_id: 'P001',
                    doctor_name: 'Dr. Silva',
                    doctor_id: 'D001',
                    date: '2025-12-18',
                    type: 'OPD',
                    status: 'pending',
                    items_count: 3,
                    is_verified: true,
                    created_at: '2025-12-18T09:30:00'
                },
                {
                    id: '2',
                    prescription_number: 'RX-2025-001235',
                    patient_name: 'Jane Smith',
                    patient_id: 'P002',
                    doctor_name: 'Dr. Fernando',
                    doctor_id: 'D002',
                    date: '2025-12-18',
                    type: 'IPD',
                    status: 'clarification',
                    items_count: 5,
                    notes: 'Dosage clarification needed',
                    is_verified: true,
                    created_at: '2025-12-18T10:15:00'
                },
                {
                    id: '3',
                    prescription_number: 'RX-2025-001236',
                    patient_name: 'Mike Johnson',
                    patient_id: 'P003',
                    doctor_name: 'Dr. Perera',
                    doctor_id: 'D003',
                    date: '2025-12-18',
                    type: 'OPD',
                    status: 'dispensed',
                    items_count: 2,
                    is_verified: true,
                    created_at: '2025-12-18T08:45:00'
                },
                {
                    id: '4',
                    prescription_number: 'RX-2025-001237',
                    patient_name: 'Sarah Wilson',
                    patient_id: 'P004',
                    doctor_name: 'Dr. Silva',
                    doctor_id: 'D001',
                    date: '2025-12-18',
                    type: 'OPD',
                    status: 'partial',
                    items_count: 4,
                    notes: 'Partial dispense - 2 items out of stock',
                    is_verified: true,
                    created_at: '2025-12-18T11:00:00'
                },
                {
                    id: '5',
                    prescription_number: 'RX-2025-001238',
                    patient_name: 'David Brown',
                    patient_id: 'P005',
                    doctor_name: 'Dr. Kumar',
                    doctor_id: 'D004',
                    date: '2025-12-18',
                    type: 'IPD',
                    status: 'pending',
                    items_count: 6,
                    is_verified: false,
                    created_at: '2025-12-18T11:30:00'
                }
            ];

            setPrescriptions(mockPrescriptions);
            setStats({
                total_today: mockPrescriptions.length,
                pending: mockPrescriptions.filter(p => p.status === 'pending').length,
                dispensed: mockPrescriptions.filter(p => p.status === 'dispensed').length,
                clarification_needed: mockPrescriptions.filter(p => p.status === 'clarification').length,
                partial: mockPrescriptions.filter(p => p.status === 'partial').length
            });
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            dispensed: 'bg-green-100 text-green-800',
            partial: 'bg-blue-100 text-blue-800',
            clarification: 'bg-orange-100 text-orange-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        const labels: Record<string, string> = {
            pending: 'Pending',
            dispensed: 'Dispensed',
            partial: 'Partial',
            clarification: 'Needs Clarification',
            cancelled: 'Cancelled'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const filteredPrescriptions = prescriptions.filter(p => {
        const matchesSearch = 
            p.prescription_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.doctor_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || p.type === filterType;
        const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
    });

    const totalPages = Math.ceil(filteredPrescriptions.length / itemsPerPage);
    const paginatedPrescriptions = filteredPrescriptions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleDispense = (prescription: Prescription) => {
        // Navigate to dispensing page with prescription
        window.location.href = `/pharmacy-dashboard/dispensing?prescription=${prescription.id}`;
    };

    const handleRequestClarification = (prescription: Prescription) => {
        // Open clarification modal
        console.log('Request clarification for:', prescription.id);
    };

    return (
        <div className="ml-0 md:ml-64 pt-24 min-h-screen bg-gray-50">
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Prescription Management</h1>
                    <p className="text-gray-600">View and manage OPD/IPD prescriptions</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Today's Total</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total_today}</p>
                            </div>
                            <FileText className="w-10 h-10 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                            </div>
                            <Clock className="w-10 h-10 text-yellow-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Dispensed</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.dispensed}</p>
                            </div>
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Need Clarification</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.clarification_needed}</p>
                            </div>
                            <AlertTriangle className="w-10 h-10 text-orange-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Partial</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.partial}</p>
                            </div>
                            <Pill className="w-10 h-10 text-purple-500" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="md:col-span-2 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by prescription #, patient, or doctor..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            <option value="OPD">OPD</option>
                            <option value="IPD">IPD</option>
                        </select>
                        <select
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="dispensed">Dispensed</option>
                            <option value="partial">Partial</option>
                            <option value="clarification">Needs Clarification</option>
                        </select>
                        <button
                            onClick={fetchPrescriptions}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Prescriptions Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Prescription #
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Patient
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Doctor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Items
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Verified
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center">
                                            <div className="flex items-center justify-center">
                                                <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                                                Loading prescriptions...
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedPrescriptions.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                                            No prescriptions found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedPrescriptions.map((prescription) => (
                                        <tr key={prescription.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-medium text-blue-600">
                                                    {prescription.prescription_number}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <User className="w-4 h-4 text-gray-400 mr-2" />
                                                    <span>{prescription.patient_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                                {prescription.doctor_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    prescription.type === 'OPD' 
                                                        ? 'bg-blue-100 text-blue-800' 
                                                        : 'bg-purple-100 text-purple-800'
                                                }`}>
                                                    {prescription.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {prescription.items_count}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(prescription.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {prescription.is_verified ? (
                                                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                                                ) : (
                                                    <AlertCircle className="w-5 h-5 text-yellow-500 mx-auto" />
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(prescription.created_at).toLocaleTimeString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPrescription(prescription);
                                                            setShowDetailsModal(true);
                                                        }}
                                                        className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {prescription.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleDispense(prescription)}
                                                            className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                                                            title="Dispense"
                                                        >
                                                            <Pill className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRequestClarification(prescription)}
                                                        className="p-1 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded"
                                                        title="Request Clarification"
                                                    >
                                                        <MessageSquare className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="p-1 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded"
                                                        title="Print"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPrescriptions.length)} of {filteredPrescriptions.length} prescriptions
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="px-3 py-1 text-sm">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Prescription Details Modal */}
                {showDetailsModal && selectedPrescription && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">
                                            {selectedPrescription.prescription_number}
                                        </h2>
                                        <p className="text-gray-500">Prescription Details</p>
                                    </div>
                                    <button
                                        onClick={() => setShowDetailsModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">Patient</p>
                                        <p className="font-medium">{selectedPrescription.patient_name}</p>
                                        <p className="text-sm text-gray-400">ID: {selectedPrescription.patient_id}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">Doctor</p>
                                        <p className="font-medium">{selectedPrescription.doctor_name}</p>
                                        <p className="text-sm text-gray-400">ID: {selectedPrescription.doctor_id}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">Type</p>
                                        <p className="font-medium">{selectedPrescription.type}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">Status</p>
                                        {getStatusBadge(selectedPrescription.status)}
                                    </div>
                                </div>

                                {selectedPrescription.notes && (
                                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                                        <p className="text-sm font-medium text-yellow-800">Notes</p>
                                        <p className="text-yellow-700">{selectedPrescription.notes}</p>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowDetailsModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Close
                                    </button>
                                    {selectedPrescription.status === 'pending' && (
                                        <button
                                            onClick={() => {
                                                setShowDetailsModal(false);
                                                handleDispense(selectedPrescription);
                                            }}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            Dispense
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PharmacistPrescriptions;
