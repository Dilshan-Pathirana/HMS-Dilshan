import React, { useState, useEffect } from 'react';
import {
    ShieldAlert, Search, Lock, FileText, AlertTriangle,
    CheckCircle, Clock, User, Calendar, Plus, Eye,
    RefreshCw, Download, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';

interface ControlledDrugEntry {
    id: string;
    drug_name: string;
    batch_number: string;
    opening_balance: number;
    received: number;
    issued: number;
    closing_balance: number;
    patient_name?: string;
    prescription_number?: string;
    issued_by: string;
    verified_by?: string;
    timestamp: string;
    notes?: string;
}

interface ControlledDrugStats {
    total_drugs: number;
    issued_today: number;
    pending_verification: number;
    low_stock: number;
}

export const PharmacistControlledDrugs: React.FC = () => {
    const [entries, setEntries] = useState<ControlledDrugEntry[]>([]);
    const [stats, setStats] = useState<ControlledDrugStats>({
        total_drugs: 24,
        issued_today: 8,
        pending_verification: 2,
        low_stock: 3
    });
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('today');
    const [currentPage, setCurrentPage] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchEntries();
    }, [dateFilter]);

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const mockData: ControlledDrugEntry[] = [
                {
                    id: '1',
                    drug_name: 'Morphine Sulfate 10mg',
                    batch_number: 'MOR-2025-001',
                    opening_balance: 50,
                    received: 0,
                    issued: 2,
                    closing_balance: 48,
                    patient_name: 'John Doe',
                    prescription_number: 'RX-2025-001234',
                    issued_by: 'Pharmacist A1',
                    verified_by: 'Dr. Silva',
                    timestamp: '2025-12-18T09:30:00',
                    notes: 'Post-operative pain management'
                },
                {
                    id: '2',
                    drug_name: 'Codeine Phosphate 30mg',
                    batch_number: 'COD-2025-012',
                    opening_balance: 100,
                    received: 0,
                    issued: 6,
                    closing_balance: 94,
                    patient_name: 'Jane Smith',
                    prescription_number: 'RX-2025-001235',
                    issued_by: 'Pharmacist A1',
                    timestamp: '2025-12-18T10:15:00'
                },
                {
                    id: '3',
                    drug_name: 'Fentanyl Patch 25mcg/hr',
                    batch_number: 'FEN-2025-003',
                    opening_balance: 20,
                    received: 10,
                    issued: 0,
                    closing_balance: 30,
                    issued_by: 'Pharmacist A1',
                    verified_by: 'Dr. Fernando',
                    timestamp: '2025-12-18T08:00:00',
                    notes: 'Stock received from supplier'
                }
            ];
            setEntries(mockData);
        } catch (error) {
            console.error('Error fetching entries:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEntries = entries.filter(entry =>
        entry.drug_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.patient_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="ml-0 md:ml-64 pt-24 min-h-screen bg-gray-50">
            <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <ShieldAlert className="w-7 h-7 text-red-600" />
                            Controlled Drugs Register
                        </h1>
                        <p className="text-gray-600">Maintain and track controlled substance records</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        <Plus className="w-4 h-4" />
                        New Entry
                    </button>
                </div>

                {/* Warning Banner */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Lock className="w-6 h-6 text-red-600" />
                        <div>
                            <p className="font-medium text-red-800">Audit-Ready Register</p>
                            <p className="text-sm text-red-600">All entries are immutable and time-stamped. Regulatory compliance mode enabled.</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Controlled Drugs</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total_drugs}</p>
                            </div>
                            <ShieldAlert className="w-10 h-10 text-purple-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Issued Today</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.issued_today}</p>
                            </div>
                            <CheckCircle className="w-10 h-10 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending Verification</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.pending_verification}</p>
                            </div>
                            <Clock className="w-10 h-10 text-yellow-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Low Stock Alert</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.low_stock}</p>
                            </div>
                            <AlertTriangle className="w-10 h-10 text-red-500" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search drug name, batch, or patient..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        >
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="all">All Time</option>
                        </select>
                        <button
                            onClick={() => {}}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                            <Download className="w-4 h-4" />
                            Export Register
                        </button>
                    </div>
                </div>

                {/* Register Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-red-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drug Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Opening</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Received</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Issued</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Closing</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issued By</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified By</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={11} className="px-6 py-12 text-center">
                                            <RefreshCw className="w-6 h-6 animate-spin text-red-600 mx-auto mb-2" />
                                            Loading register...
                                        </td>
                                    </tr>
                                ) : filteredEntries.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                                            No entries found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEntries.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 text-sm text-gray-600">
                                                {new Date(entry.timestamp).toLocaleTimeString()}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="font-medium text-gray-900">{entry.drug_name}</span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-600">{entry.batch_number}</td>
                                            <td className="px-4 py-4 text-center font-medium">{entry.opening_balance}</td>
                                            <td className="px-4 py-4 text-center text-green-600 font-medium">
                                                {entry.received > 0 ? `+${entry.received}` : '-'}
                                            </td>
                                            <td className="px-4 py-4 text-center text-red-600 font-medium">
                                                {entry.issued > 0 ? `-${entry.issued}` : '-'}
                                            </td>
                                            <td className="px-4 py-4 text-center font-bold">{entry.closing_balance}</td>
                                            <td className="px-4 py-4 text-sm">
                                                {entry.patient_name && (
                                                    <div>
                                                        <p className="text-gray-900">{entry.patient_name}</p>
                                                        <p className="text-xs text-gray-500">{entry.prescription_number}</p>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-600">{entry.issued_by}</td>
                                            <td className="px-4 py-4 text-sm">
                                                {entry.verified_by ? (
                                                    <span className="text-green-600 flex items-center gap-1">
                                                        <CheckCircle className="w-4 h-4" />
                                                        {entry.verified_by}
                                                    </span>
                                                ) : (
                                                    <span className="text-yellow-600 flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <button className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PharmacistControlledDrugs;
