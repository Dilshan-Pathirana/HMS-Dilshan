import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    ShoppingCart, Search, Filter, Eye, Plus,
    Truck, Package, CheckCircle, Clock, AlertTriangle,
    FileText, Download, Calendar, Building, Phone
} from 'lucide-react';

interface PurchaseOrder {
    id: string;
    po_number: string;
    supplier_id: string;
    supplier_name: string;
    items_count: number;
    total_amount: number;
    status: 'draft' | 'submitted' | 'approved' | 'shipped' | 'received' | 'cancelled';
    created_by: string;
    created_at: string;
    expected_delivery?: string;
}

interface Supplier {
    id: string;
    name: string;
    contact_person: string;
    phone: string;
    email: string;
    address: string;
    status: 'active' | 'inactive';
    rating: number;
}

interface GRN {
    id: string;
    grn_number: string;
    po_number: string;
    supplier_name: string;
    items_received: number;
    total_amount: number;
    received_by: string;
    received_at: string;
    status: 'complete' | 'partial' | 'inspection';
}

export const PharmacistPurchase: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'orders' | 'suppliers' | 'grn' | 'new_order'>('orders');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

    const [orders] = useState<PurchaseOrder[]>([
        {
            id: '1',
            po_number: 'PO-2025-0234',
            supplier_id: 'SUP-001',
            supplier_name: 'Medical Supplies Ltd',
            items_count: 15,
            total_amount: 450000.00,
            status: 'approved',
            created_by: 'Pharmacist N. Silva',
            created_at: '2025-12-17',
            expected_delivery: '2025-12-22'
        },
        {
            id: '2',
            po_number: 'PO-2025-0233',
            supplier_id: 'SUP-002',
            supplier_name: 'Pharma Distribution Co',
            items_count: 8,
            total_amount: 185000.00,
            status: 'shipped',
            created_by: 'Pharmacist K. Jayawardena',
            created_at: '2025-12-16',
            expected_delivery: '2025-12-19'
        },
        {
            id: '3',
            po_number: 'PO-2025-0232',
            supplier_id: 'SUP-001',
            supplier_name: 'Medical Supplies Ltd',
            items_count: 25,
            total_amount: 620000.00,
            status: 'received',
            created_by: 'Pharmacist N. Silva',
            created_at: '2025-12-14'
        },
        {
            id: '4',
            po_number: 'PO-2025-0231',
            supplier_id: 'SUP-003',
            supplier_name: 'Healthcare Products Inc',
            items_count: 5,
            total_amount: 75000.00,
            status: 'submitted',
            created_by: 'Pharmacist N. Silva',
            created_at: '2025-12-18'
        }
    ]);

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);

    // Fetch suppliers from database
    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setLoadingSuppliers(true);
        try {
            const response = await axios.get('/api/get-pharmacist-suppliers');
            console.log('Suppliers response:', response.data);
            
            if (response.data) {
                const supplierData = Array.isArray(response.data) 
                    ? response.data 
                    : (response.data.data || response.data.suppliers || []);
                
                // Map to expected format
                const mappedSuppliers = supplierData.map((sup: any) => ({
                    id: sup.id,
                    name: sup.supplier_name || sup.name || 'Unknown',
                    contact_person: sup.contact_person || '',
                    phone: sup.contact_number || sup.phone || '',
                    email: sup.contact_email || sup.email || '',
                    address: `${sup.supplier_address || ''}, ${sup.supplier_city || ''}`.trim().replace(/^,\s*|,\s*$/g, ''),
                    status: 'active' as const,
                    rating: sup.rating || 0
                }));
                
                setSuppliers(mappedSuppliers);
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        } finally {
            setLoadingSuppliers(false);
        }
    };

    const [grns] = useState<GRN[]>([
        {
            id: '1',
            grn_number: 'GRN-2025-0089',
            po_number: 'PO-2025-0232',
            supplier_name: 'Medical Supplies Ltd',
            items_received: 25,
            total_amount: 620000.00,
            received_by: 'Pharmacist K. Jayawardena',
            received_at: '2025-12-17T10:30:00',
            status: 'complete'
        },
        {
            id: '2',
            grn_number: 'GRN-2025-0088',
            po_number: 'PO-2025-0230',
            supplier_name: 'Pharma Distribution Co',
            items_received: 18,
            total_amount: 340000.00,
            received_by: 'Pharmacist N. Silva',
            received_at: '2025-12-15T14:45:00',
            status: 'complete'
        }
    ]);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
            'draft': { bg: 'bg-gray-100', text: 'text-gray-800', icon: <FileText className="w-3 h-3" /> },
            'submitted': { bg: 'bg-blue-100', text: 'text-blue-800', icon: <Clock className="w-3 h-3" /> },
            'approved': { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
            'shipped': { bg: 'bg-purple-100', text: 'text-purple-800', icon: <Truck className="w-3 h-3" /> },
            'received': { bg: 'bg-teal-100', text: 'text-teal-800', icon: <Package className="w-3 h-3" /> },
            'cancelled': { bg: 'bg-red-100', text: 'text-red-800', icon: <AlertTriangle className="w-3 h-3" /> },
            'complete': { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
            'partial': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <AlertTriangle className="w-3 h-3" /> },
            'inspection': { bg: 'bg-orange-100', text: 'text-orange-800', icon: <Eye className="w-3 h-3" /> }
        };
        const style = styles[status] || styles['draft'];
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${style.bg} ${style.text}`}>
                {style.icon}
                {status.toUpperCase()}
            </span>
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount);
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             order.supplier_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        pending_orders: orders.filter(o => ['submitted', 'approved', 'shipped'].includes(o.status)).length,
        total_value: orders.reduce((sum, o) => sum + o.total_amount, 0),
        active_suppliers: suppliers.filter(s => s.status === 'active').length,
        grn_this_month: grns.length
    };

    return (
        <div className="ml-0 md:ml-64 pt-24 min-h-screen bg-gray-50">
            <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <ShoppingCart className="w-7 h-7 text-indigo-600" />
                            Purchase & Supplier Coordination
                        </h1>
                        <p className="text-gray-600">Manage purchase orders and supplier relationships</p>
                    </div>
                    <button
                        onClick={() => setActiveTab('new_order')}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700"
                    >
                        <Plus className="w-4 h-4" />
                        New Purchase Order
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending Orders</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.pending_orders}</p>
                            </div>
                            <ShoppingCart className="w-10 h-10 text-indigo-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Order Value</p>
                                <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.total_value)}</p>
                            </div>
                            <Package className="w-10 h-10 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Active Suppliers</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.active_suppliers}</p>
                            </div>
                            <Building className="w-10 h-10 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-teal-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">GRN This Month</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.grn_this_month}</p>
                            </div>
                            <FileText className="w-10 h-10 text-teal-500" />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`px-6 py-3 font-medium ${
                                activeTab === 'orders' 
                                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Purchase Orders
                        </button>
                        <button
                            onClick={() => setActiveTab('suppliers')}
                            className={`px-6 py-3 font-medium ${
                                activeTab === 'suppliers' 
                                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Suppliers
                        </button>
                        <button
                            onClick={() => setActiveTab('grn')}
                            className={`px-6 py-3 font-medium ${
                                activeTab === 'grn' 
                                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Goods Received
                        </button>
                    </div>

                    {/* Purchase Orders Tab */}
                    {activeTab === 'orders' && (
                        <div className="p-4">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by PO number or supplier..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="all">All Status</option>
                                    <option value="draft">Draft</option>
                                    <option value="submitted">Submitted</option>
                                    <option value="approved">Approved</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="received">Received</option>
                                </select>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredOrders.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-900">{order.po_number}</div>
                                                    <div className="text-xs text-gray-500">Created: {order.created_at}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-gray-900">{order.supplier_name}</div>
                                                    <div className="text-xs text-gray-500">{order.supplier_id}</div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-900">{order.items_count}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    {formatCurrency(order.total_amount)}
                                                </td>
                                                <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    {order.expected_delivery || '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setSelectedOrder(order)}
                                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                            title="View"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                                            title="Download"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Suppliers Tab */}
                    {activeTab === 'suppliers' && (
                        <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {suppliers.map((supplier) => (
                                    <div key={supplier.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                    <Building className="w-6 h-6 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{supplier.name}</h4>
                                                    <p className="text-sm text-gray-500">{supplier.id}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                supplier.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {supplier.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <span className="font-medium">Contact:</span>
                                                {supplier.contact_person}
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Phone className="w-4 h-4" />
                                                {supplier.phone}
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <span className="text-xs">{supplier.email}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <span key={star} className={`text-lg ${
                                                        star <= supplier.rating ? 'text-yellow-400' : 'text-gray-300'
                                                    }`}>★</span>
                                                ))}
                                                <span className="text-sm text-gray-500 ml-1">{supplier.rating}</span>
                                            </div>
                                            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* GRN Tab */}
                    {activeTab === 'grn' && (
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search GRN..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                                    <Plus className="w-4 h-4" />
                                    Receive Goods
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GRN Number</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Reference</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {grns.map((grn) => (
                                            <tr key={grn.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-900">{grn.grn_number}</td>
                                                <td className="px-4 py-3 text-blue-600">{grn.po_number}</td>
                                                <td className="px-4 py-3 text-gray-900">{grn.supplier_name}</td>
                                                <td className="px-4 py-3 text-gray-900">{grn.items_received}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    {formatCurrency(grn.total_amount)}
                                                </td>
                                                <td className="px-4 py-3">{getStatusBadge(grn.status)}</td>
                                                <td className="px-4 py-3">
                                                    <div className="text-gray-900">
                                                        {new Date(grn.received_at).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{grn.received_by}</div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* New Order Tab - Placeholder */}
                    {activeTab === 'new_order' && (
                        <div className="p-6">
                            <div className="max-w-3xl mx-auto">
                                <h3 className="font-semibold text-gray-900 mb-4">Create New Purchase Order</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Supplier* {suppliers.length > 0 && <span className="text-xs text-gray-500">({suppliers.length} available)</span>}
                                        </label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                                            <option value="">{loadingSuppliers ? 'Loading suppliers...' : 'Select Supplier'}</option>
                                            {suppliers.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</label>
                                            <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                                <option value="normal">Normal</option>
                                                <option value="urgent">Urgent</option>
                                                <option value="emergency">Emergency</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                        <textarea rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Additional notes for the supplier..." />
                                    </div>
                                    <div className="border-t pt-4">
                                        <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                                        <p className="text-sm text-gray-500 mb-4">Add items from inventory that need to be reordered</p>
                                        <button className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 w-full justify-center">
                                            <Plus className="w-4 h-4" />
                                            Add Items
                                        </button>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            onClick={() => setActiveTab('orders')}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                                            Save as Draft
                                        </button>
                                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                            Submit for Approval
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PharmacistPurchase;
