import React, { useState } from 'react';
import {
    DollarSign, Receipt, CreditCard, Search, Filter,
    Eye, Printer, Download, CheckCircle, XCircle,
    Clock, Calculator, RefreshCw, Plus, FileText
} from 'lucide-react';

interface Invoice {
    id: string;
    invoice_number: string;
    patient_id: string;
    patient_name: string;
    prescription_no: string;
    type: 'opd' | 'ipd' | 'ward';
    items_count: number;
    subtotal: number;
    discount: number;
    total: number;
    payment_status: 'paid' | 'pending' | 'partial' | 'voided';
    payment_method?: string;
    created_by: string;
    created_at: string;
}

interface BillStats {
    today_sales: number;
    pending_amount: number;
    invoices_count: number;
    refunds: number;
}

export const PharmacistBilling: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDate, setFilterDate] = useState('today');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [showNewBillModal, setShowNewBillModal] = useState(false);

    const [stats] = useState<BillStats>({
        today_sales: 125850.00,
        pending_amount: 23400.00,
        invoices_count: 87,
        refunds: 2500.00
    });

    const [invoices] = useState<Invoice[]>([
        {
            id: '1',
            invoice_number: 'INV-2025-0501',
            patient_id: 'PAT-001',
            patient_name: 'John Perera',
            prescription_no: 'RX-2025-001234',
            type: 'opd',
            items_count: 5,
            subtotal: 3500.00,
            discount: 350.00,
            total: 3150.00,
            payment_status: 'paid',
            payment_method: 'Cash',
            created_by: 'Pharmacist N. Silva',
            created_at: '2025-12-18T11:30:00'
        },
        {
            id: '2',
            invoice_number: 'INV-2025-0500',
            patient_id: 'PAT-015',
            patient_name: 'Mary Fernando',
            prescription_no: 'RX-2025-001233',
            type: 'opd',
            items_count: 3,
            subtotal: 1800.00,
            discount: 0,
            total: 1800.00,
            payment_status: 'pending',
            created_by: 'Pharmacist K. Jayawardena',
            created_at: '2025-12-18T10:45:00'
        },
        {
            id: '3',
            invoice_number: 'INV-2025-0499',
            patient_id: 'IPD-042',
            patient_name: 'Kumar Jayasuriya',
            prescription_no: 'IPD-RX-2025-0089',
            type: 'ipd',
            items_count: 12,
            subtotal: 15600.00,
            discount: 1560.00,
            total: 14040.00,
            payment_status: 'partial',
            payment_method: 'Card',
            created_by: 'Pharmacist N. Silva',
            created_at: '2025-12-18T09:30:00'
        },
        {
            id: '4',
            invoice_number: 'INV-2025-0498',
            patient_id: 'WARD-3B',
            patient_name: 'Ward 3B Supply',
            prescription_no: 'WS-2025-0034',
            type: 'ward',
            items_count: 25,
            subtotal: 45000.00,
            discount: 0,
            total: 45000.00,
            payment_status: 'paid',
            payment_method: 'Internal Transfer',
            created_by: 'Pharmacist K. Jayawardena',
            created_at: '2025-12-18T08:15:00'
        },
        {
            id: '5',
            invoice_number: 'INV-2025-0497',
            patient_id: 'PAT-089',
            patient_name: 'Sarah de Silva',
            prescription_no: 'RX-2025-001232',
            type: 'opd',
            items_count: 2,
            subtotal: 850.00,
            discount: 0,
            total: 850.00,
            payment_status: 'voided',
            created_by: 'Pharmacist N. Silva',
            created_at: '2025-12-18T07:45:00'
        }
    ]);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
            'paid': { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
            'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock className="w-3 h-3" /> },
            'partial': { bg: 'bg-blue-100', text: 'text-blue-800', icon: <DollarSign className="w-3 h-3" /> },
            'voided': { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle className="w-3 h-3" /> }
        };
        const style = styles[status] || styles['pending'];
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${style.bg} ${style.text}`}>
                {style.icon}
                {status.toUpperCase()}
            </span>
        );
    };

    const getTypeBadge = (type: string) => {
        const styles: Record<string, string> = {
            'opd': 'bg-blue-100 text-blue-800',
            'ipd': 'bg-purple-100 text-purple-800',
            'ward': 'bg-orange-100 text-orange-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type]}`}>
                {type.toUpperCase()}
            </span>
        );
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             inv.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             inv.prescription_no.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || inv.payment_status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount);
    };

    return (
        <div className="ml-0 md:ml-64 pt-24 min-h-screen bg-gray-50">
            <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <DollarSign className="w-7 h-7 text-green-600" />
                            Billing & Invoices
                        </h1>
                        <p className="text-gray-600">Manage pharmacy billing and payment records</p>
                    </div>
                    <button
                        onClick={() => setShowNewBillModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700"
                    >
                        <Plus className="w-4 h-4" />
                        New Invoice
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Today's Sales</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.today_sales)}</p>
                            </div>
                            <DollarSign className="w-10 h-10 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending Amount</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pending_amount)}</p>
                            </div>
                            <Clock className="w-10 h-10 text-yellow-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Invoices Today</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.invoices_count}</p>
                            </div>
                            <Receipt className="w-10 h-10 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Refunds</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.refunds)}</p>
                            </div>
                            <RefreshCw className="w-10 h-10 text-red-500" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative flex-1 min-w-[200px] max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by invoice, patient, or prescription..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        >
                            <option value="all">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                            <option value="partial">Partial</option>
                            <option value="voided">Voided</option>
                        </select>
                        <select
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        >
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                        </select>
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Invoices Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{invoice.invoice_number}</div>
                                            <div className="text-xs text-gray-500">{invoice.prescription_no}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-gray-900">{invoice.patient_name}</div>
                                            <div className="text-xs text-gray-500">{invoice.patient_id}</div>
                                        </td>
                                        <td className="px-4 py-3">{getTypeBadge(invoice.type)}</td>
                                        <td className="px-4 py-3 text-gray-900">{invoice.items_count}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{formatCurrency(invoice.total)}</div>
                                            {invoice.discount > 0 && (
                                                <div className="text-xs text-green-600">-{formatCurrency(invoice.discount)}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">{getStatusBadge(invoice.payment_status)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {new Date(invoice.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setSelectedInvoice(invoice)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                                    title="Print"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                                {invoice.payment_status === 'pending' && (
                                                    <button
                                                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                                                        title="Collect Payment"
                                                    >
                                                        <CreditCard className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Invoice Detail Modal */}
                {selectedInvoice && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
                            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Receipt className="w-5 h-5 text-green-600" />
                                    Invoice Details - {selectedInvoice.invoice_number}
                                </h3>
                                <button
                                    onClick={() => setSelectedInvoice(null)}
                                    className="text-gray-400 hover:text-gray-600 text-2xl"
                                >
                                    &times;
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase">Patient</label>
                                        <p className="text-gray-900 font-medium">{selectedInvoice.patient_name}</p>
                                        <p className="text-sm text-gray-500">{selectedInvoice.patient_id}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase">Prescription</label>
                                        <p className="text-gray-900">{selectedInvoice.prescription_no}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase">Type</label>
                                        <div className="mt-1">{getTypeBadge(selectedInvoice.type)}</div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase">Status</label>
                                        <div className="mt-1">{getStatusBadge(selectedInvoice.payment_status)}</div>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-medium text-gray-900 mb-3">Bill Summary</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Subtotal ({selectedInvoice.items_count} items)</span>
                                            <span className="text-gray-900">{formatCurrency(selectedInvoice.subtotal)}</span>
                                        </div>
                                        {selectedInvoice.discount > 0 && (
                                            <div className="flex justify-between text-green-600">
                                                <span>Discount</span>
                                                <span>-{formatCurrency(selectedInvoice.discount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                                            <span>Total</span>
                                            <span>{formatCurrency(selectedInvoice.total)}</span>
                                        </div>
                                    </div>
                                </div>

                                {selectedInvoice.payment_method && (
                                    <div className="border-t pt-4 mt-4">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <CreditCard className="w-4 h-4" />
                                            <span>Payment Method: {selectedInvoice.payment_method}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="text-sm text-gray-500 mt-4">
                                    <p>Created by: {selectedInvoice.created_by}</p>
                                    <p>Date: {new Date(selectedInvoice.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="p-4 border-t flex justify-end gap-3">
                                <button
                                    onClick={() => setSelectedInvoice(null)}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Close
                                </button>
                                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                                    <Printer className="w-4 h-4" />
                                    Print Invoice
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PharmacistBilling;
