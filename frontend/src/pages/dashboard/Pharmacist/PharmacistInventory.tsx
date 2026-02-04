import React, { useEffect, useState } from 'react';
import api from "../../../utils/api/axios";
import {
    Package, Search, Plus, Edit2, AlertTriangle,
    Calendar, DollarSign, TrendingDown, RefreshCw,
    Eye, FileText
} from 'lucide-react';
import ProductCreateModalForPharmacist from '../../../components/pharmacyDashboard/PharmacistUserPharamacyDashboard/product/productCreate/ProductCreateModalForPharmacist';
import InventoryEditModal from './InventoryEditModal';

interface InventoryItem {
    id: number;
    pharmacy_id: number;
    medicine_name: string;
    generic_name: string | null;
    batch_number: string;
    barcode?: string;
    brand_name?: string;
    category?: string;
    quantity: number;
    unit: string;
    unit_price: number;
    expiry_date: string;
    supplier: string | null;
    supplier_id?: string | null;
    reorder_level: number;
    created_at: string;
}

interface InventoryStats {
    total_items: number;
    total_value: number;
    low_stock: number;
    out_of_stock: number;
    expiring_soon: number;
    expired: number;
}

interface PaginationInfo {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

export const PharmacistInventory: React.FC = () => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [stats, setStats] = useState<InventoryStats>({
        total_items: 0,
        total_value: 0,
        low_stock: 0,
        out_of_stock: 0,
        expiring_soon: 0,
        expired: 0,
    });
    const [pagination, setPagination] = useState<PaginationInfo>({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
        from: 0,
        to: 0,
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'low_stock' | 'out_of_stock' | 'expiring' | 'expired'>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    const branchId = userInfo.branch_id;

    useEffect(() => {
        fetchInventory();
    }, [filterType, currentPage]);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            console.log('Fetching products from /api/pharmacist-user-get-products');
            
            const response = await api.get('/pharmacy/products');
            console.log('Products response:', response.data);
            
            if (response.data.status === 200 && response.data.products) {
                // Log first product to see structure
                if (response.data.products.length > 0) {
                    console.log('First product structure:', response.data.products[0]);
                    console.log('Supplier info:', {
                        supplier_id: response.data.products[0].supplier_id,
                        supplier_name: response.data.products[0].supplier_name
                    });
                }
                
                // Transform products data to match inventory interface
                const products = response.data.products.map((product: any) => ({
                    id: product.id,
                    pharmacy_id: branchId,
                    medicine_name: product.item_name,
                    generic_name: product.generic_name,
                    batch_number: product.item_code || '',
                    barcode: product.barcode || '',
                    brand_name: product.brand_name || '',
                    category: product.category || '',
                    quantity: product.current_stock || 0,
                    unit: product.unit || 'units',
                    unit_price: product.unit_selling_price || 0,
                    expiry_date: product.expiry_date,
                    supplier: product.supplier_name || null,
                    supplier_id: product.supplier_id || null,
                    reorder_level: product.reorder_level || 10,
                    created_at: product.created_at,
                }));
                
                setInventory(products);
                
                // Calculate stats from products
                const totalValue = products.reduce((sum: number, item: any) => 
                    sum + (item.quantity * item.unit_price), 0
                );
                
                const today = new Date();
                const lowStockItems = products.filter((item: any) => 
                    item.quantity > 0 && item.quantity <= item.reorder_level
                );
                const outOfStockItems = products.filter((item: any) => item.quantity === 0);
                const expiringItems = products.filter((item: any) => {
                    if (!item.expiry_date) return false;
                    const expiry = new Date(item.expiry_date);
                    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
                });
                const expiredItems = products.filter((item: any) => {
                    if (!item.expiry_date) return false;
                    const expiry = new Date(item.expiry_date);
                    return expiry < today;
                });
                
                setStats({
                    total_items: products.length,
                    total_value: totalValue,
                    low_stock: lowStockItems.length,
                    out_of_stock: outOfStockItems.length,
                    expiring_soon: expiringItems.length,
                    expired: expiredItems.length,
                });
                
                setPagination({
                    current_page: 1,
                    last_page: 1,
                    per_page: products.length,
                    total: products.length,
                    from: 1,
                    to: products.length,
                });
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchInventory();
    };

    const getStockStatus = (item: InventoryItem) => {
        if (item.quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700' };
        if (item.quantity <= item.reorder_level) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700' };
        return { label: 'In Stock', color: 'bg-green-100 text-green-700' };
    };

    const getExpiryStatus = (expiryDate: string) => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) return { label: 'Expired', color: 'bg-red-100 text-red-700' };
        if (daysUntilExpiry <= 30) return { label: `${daysUntilExpiry}d left`, color: 'bg-orange-100 text-orange-700' };
        if (daysUntilExpiry <= 90) return { label: `${daysUntilExpiry}d left`, color: 'bg-yellow-100 text-yellow-700' };
        return { label: 'Good', color: 'bg-green-100 text-green-700' };
    };

    const filteredInventory = inventory.filter(item => {
        // Apply search filter
        const matchesSearch = searchTerm === '' || 
            item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.batch_number.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;

        // Apply filter type - Note: Backend already filters, but this is for client-side search
        if (filterType === 'all') return true;
        if (filterType === 'low_stock') return item.quantity > 0 && item.quantity <= item.reorder_level;
        if (filterType === 'out_of_stock') return item.quantity === 0;
        if (filterType === 'expiring') {
            const today = new Date();
            const expiry = new Date(item.expiry_date);
            const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
        }
        if (filterType === 'expired') {
            const today = new Date();
            const expiry = new Date(item.expiry_date);
            return expiry < today;
        }
        
        return true;
    });

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleProductAddSuccess = () => {
        fetchInventory();
    };

    return (
        <div className="ml-0 md:ml-64 min-h-screen bg-gray-50 p-6 pt-24">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <Package className="w-8 h-8 text-blue-600" />
                            Pharmacy Inventory
                        </h1>
                        <p className="text-gray-600 mt-1">Manage your branch medication stock</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleRefresh}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Refresh
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Add Item
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Items</p>
                                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total_items}</p>
                            </div>
                            <Package className="w-10 h-10 text-blue-500 opacity-80" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Value</p>
                                <p className="text-2xl font-bold text-gray-800 mt-1">
                                    LKR {stats.total_value.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                            <DollarSign className="w-10 h-10 text-green-500 opacity-80" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Low Stock</p>
                                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.low_stock}</p>
                            </div>
                            <TrendingDown className="w-10 h-10 text-yellow-500 opacity-80" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Out of Stock</p>
                                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.out_of_stock}</p>
                            </div>
                            <AlertTriangle className="w-10 h-10 text-red-500 opacity-80" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Expiring Soon</p>
                                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.expiring_soon}</p>
                            </div>
                            <Calendar className="w-10 h-10 text-orange-500 opacity-80" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Expired</p>
                                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.expired}</p>
                            </div>
                            <FileText className="w-10 h-10 text-purple-500 opacity-80" />
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by medicine name, generic name, or batch number..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilterType('all')}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    filterType === 'all'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilterType('low_stock')}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    filterType === 'low_stock'
                                        ? 'bg-yellow-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Low Stock
                            </button>
                            <button
                                onClick={() => setFilterType('out_of_stock')}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    filterType === 'out_of_stock'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Out of Stock
                            </button>
                            <button
                                onClick={() => setFilterType('expiring')}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    filterType === 'expiring'
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Expiring
                            </button>
                            <button
                                onClick={() => setFilterType('expired')}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    filterType === 'expired'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Expired
                            </button>
                        </div>
                    </div>
                </div>

                {/* Inventory Table */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex items-center justify-center p-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : filteredInventory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12">
                                <Package className="w-16 h-16 text-gray-300 mb-4" />
                                <p className="text-gray-600 text-lg font-semibold mb-2">
                                    {filterType !== 'all' 
                                        ? `No ${filterType.replace('_', ' ')} items found` 
                                        : 'No inventory items found'}
                                </p>
                                <p className="text-gray-500 text-sm mb-6">
                                    {filterType !== 'all' 
                                        ? 'Try changing the filter or adjusting your search criteria.' 
                                        : 'Get started by adding your first inventory item or view the product catalog.'}
                                </p>
                                <div className="flex gap-3">
                                    {filterType !== 'all' && (
                                        <button
                                            onClick={() => setFilterType('all')}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Clear Filter
                                        </button>
                                    )}
                                    <button
                                        onClick={() => window.location.href = '/pharmacy-dashboard/product-list'}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View Products
                                    </button>
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Inventory
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Medicine
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Batch
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Quantity
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Unit Price
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Expiry Date
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredInventory.map((item) => {
                                            const stockStatus = getStockStatus(item);
                                            const expiryStatus = getExpiryStatus(item.expiry_date);

                                            return (
                                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="font-medium text-gray-900">{item.medicine_name}</p>
                                                            {item.generic_name && (
                                                                <p className="text-sm text-gray-500">{item.generic_name}</p>
                                                            )}
                                                            <p className="text-xs text-gray-400">{item.unit}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-700 font-mono">{item.batch_number}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{item.quantity}</p>
                                                            <p className="text-xs text-gray-500">Reorder: {item.reorder_level}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-medium text-gray-900">LKR {parseFloat(item.unit_price.toString()).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="text-sm text-gray-700">
                                                                {new Date(item.expiry_date).toLocaleDateString()}
                                                            </p>
                                                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${expiryStatus.color} mt-1`}>
                                                                {expiryStatus.label}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${stockStatus.color}`}>
                                                            {stockStatus.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setSelectedItem(item)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedItem(item);
                                                                    setShowEditModal(true);
                                                                }}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit2 className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                {pagination.last_page > 1 && (
                                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                                        <div className="text-sm text-gray-700">
                                            Showing {pagination.from} to {pagination.to} of {pagination.total} results
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                            {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                                                const page = i + 1;
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => handlePageChange(page)}
                                                        className={`px-4 py-2 border rounded-lg ${
                                                            currentPage === page
                                                                ? 'bg-blue-600 text-white border-blue-600'
                                                                : 'border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            })}
                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === pagination.last_page}
                                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Product Create Modal - For adding new items only */}
                <ProductCreateModalForPharmacist
                    isOpen={showAddModal}
                    onClose={() => {
                        setShowAddModal(false);
                    }}
                    onSuccess={handleProductAddSuccess}
                />

                {/* Edit Modal - For editing existing items */}
                <InventoryEditModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedItem(null);
                    }}
                    onSuccess={handleProductAddSuccess}
                    item={selectedItem}
                />

                {/* View Item Details Modal */}
                {selectedItem && !showAddModal && !showEditModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-800">Item Details</h2>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Medicine Information */}
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-blue-900 mb-3">Medicine Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-blue-600 font-medium">Medicine Name</p>
                                            <p className="text-gray-900 font-semibold">{selectedItem.medicine_name}</p>
                                        </div>
                                        {selectedItem.generic_name && (
                                            <div>
                                                <p className="text-sm text-blue-600 font-medium">Generic Name</p>
                                                <p className="text-gray-900">{selectedItem.generic_name}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm text-blue-600 font-medium">Batch Number</p>
                                            <p className="text-gray-900 font-mono">{selectedItem.batch_number}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-blue-600 font-medium">Unit</p>
                                            <p className="text-gray-900">{selectedItem.unit}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Stock Information */}
                                <div className="bg-green-50 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-green-900 mb-3">Stock Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-green-600 font-medium">Current Quantity</p>
                                            <p className="text-2xl font-bold text-gray-900">{selectedItem.quantity}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-green-600 font-medium">Reorder Level</p>
                                            <p className="text-2xl font-bold text-gray-900">{selectedItem.reorder_level}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-green-600 font-medium">Stock Status</p>
                                            <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStockStatus(selectedItem).color}`}>
                                                {getStockStatus(selectedItem).label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing Information */}
                                <div className="bg-purple-50 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-purple-900 mb-3">Pricing Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-purple-600 font-medium">Unit Price</p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                LKR {parseFloat(selectedItem.unit_price.toString()).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-purple-600 font-medium">Total Value</p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                LKR {(selectedItem.quantity * selectedItem.unit_price).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Expiry Information */}
                                <div className="bg-orange-50 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-orange-900 mb-3">Expiry Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-orange-600 font-medium">Expiry Date</p>
                                            <p className="text-gray-900 font-semibold">
                                                {new Date(selectedItem.expiry_date).toLocaleDateString('en-US', { 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-orange-600 font-medium">Expiry Status</p>
                                            <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getExpiryStatus(selectedItem.expiry_date).color}`}>
                                                {getExpiryStatus(selectedItem.expiry_date).label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Supplier Information */}
                                {selectedItem.supplier && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Supplier Information</h3>
                                        <div>
                                            <p className="text-sm text-gray-600 font-medium">Supplier</p>
                                            <p className="text-gray-900">{selectedItem.supplier}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            setShowEditModal(true);
                                        }}
                                        className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        Edit Item
                                    </button>
                                    <button
                                        onClick={() => setSelectedItem(null)}
                                        className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
