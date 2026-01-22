import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Package, AlertTriangle, Calendar, Building2, ChevronLeft, ChevronRight } from 'lucide-react';

interface PharmacyInventoryItem {
    id: number;
    pharmacy_id: number;
    pharmacy_name?: string;
    medicine_name: string;
    generic_name: string;
    batch_number: string;
    quantity: number;
    unit: string;
    unit_price: number;
    expiry_date: string;
    supplier: string;
    reorder_level: number;
    created_at: string;
}

interface Pharmacy {
    id: number;
    name: string;
    branch_name?: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

const AllPharmaciesInventoryList: React.FC = () => {
    const [inventory, setInventory] = useState<PharmacyInventoryItem[]>([]);
    const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    
    // Filters
    const [selectedPharmacy, setSelectedPharmacy] = useState<string>('all');
    const [stockFilter, setStockFilter] = useState<string>('all');
    const [expiryFilter, setExpiryFilter] = useState<string>('all');

    useEffect(() => {
        fetchPharmacies();
    }, []);

    useEffect(() => {
        setCurrentPage(1); // Reset to page 1 when filters change
        fetchAllInventory(1);
    }, [selectedPharmacy, stockFilter, expiryFilter]);

    useEffect(() => {
        fetchAllInventory(currentPage);
    }, [currentPage]);

    const fetchPharmacies = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://127.0.0.1:8000/api/v1/pharmacies', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setPharmacies(response.data.data.pharmacies || []);
            }
        } catch (err) {
            console.error('Failed to fetch pharmacies:', err);
        }
    };

    const fetchAllInventory = async (page: number = 1) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            let url = 'http://127.0.0.1:8000/api/v1/pharmacy-inventory';
            const params = new URLSearchParams();

            params.append('page', page.toString());

            if (selectedPharmacy !== 'all') {
                params.append('pharmacy_id', selectedPharmacy);
            }

            if (stockFilter === 'low_stock') {
                params.append('low_stock', 'true');
            } else if (stockFilter === 'out_of_stock') {
                params.append('out_of_stock', 'true');
            }

            if (expiryFilter === 'expiring') {
                params.append('expiring', 'true');
            } else if (expiryFilter === 'expired') {
                params.append('expired', 'true');
            }

            if (params.toString()) {
                url += '?' + params.toString();
            }

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                const items = response.data.data.inventory || [];
                setPagination(response.data.data.pagination);
                
                // Add pharmacy names to items
                const itemsWithPharmacy = items.map((item: PharmacyInventoryItem) => {
                    const pharmacy = pharmacies.find(p => p.id === item.pharmacy_id);
                    return {
                        ...item,
                        pharmacy_name: pharmacy?.name || `Pharmacy ${item.pharmacy_id}`
                    };
                });
                setInventory(itemsWithPharmacy);
            }
        } catch (err: any) {
            console.error('Error fetching inventory:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStockStatus = (quantity: number, reorderLevel: number) => {
        if (quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
        if (quantity <= reorderLevel) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
        return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
    };

    const getExpiryStatus = (expiryDate: string) => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) return { label: 'Expired', color: 'bg-red-100 text-red-800' };
        if (daysUntilExpiry <= 30) return { label: 'Expiring Soon', color: 'bg-orange-100 text-orange-800' };
        if (daysUntilExpiry <= 90) return { label: 'Expiring in 3 months', color: 'bg-yellow-100 text-yellow-800' };
        return { label: 'Good', color: 'bg-green-100 text-green-800' };
    };

    const filteredInventory = inventory.filter(item =>
        item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pharmacy_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const resetFilters = () => {
        setSelectedPharmacy('all');
        setStockFilter('all');
        setExpiryFilter('all');
        setSearchTerm('');
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderPagination = () => {
        if (!pagination || pagination.last_page <= 1) return null;

        const pages = [];
        const maxVisiblePages = 7;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(pagination.last_page, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Previous button
        pages.push(
            <button
                key="prev"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg ${
                    currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-300'
                }`}
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
        );

        // First page
        if (startPage > 1) {
            pages.push(
                <button
                    key={1}
                    onClick={() => handlePageChange(1)}
                    className="px-4 py-2 rounded-lg bg-white text-gray-700 hover:bg-blue-50 border border-gray-300"
                >
                    1
                </button>
            );
            if (startPage > 2) {
                pages.push(
                    <span key="ellipsis1" className="px-2 py-2 text-gray-500">
                        ...
                    </span>
                );
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-4 py-2 rounded-lg ${
                        i === currentPage
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-300'
                    }`}
                >
                    {i}
                </button>
            );
        }

        // Last page
        if (endPage < pagination.last_page) {
            if (endPage < pagination.last_page - 1) {
                pages.push(
                    <span key="ellipsis2" className="px-2 py-2 text-gray-500">
                        ...
                    </span>
                );
            }
            pages.push(
                <button
                    key={pagination.last_page}
                    onClick={() => handlePageChange(pagination.last_page)}
                    className="px-4 py-2 rounded-lg bg-white text-gray-700 hover:bg-blue-50 border border-gray-300"
                >
                    {pagination.last_page}
                </button>
            );
        }

        // Next button
        pages.push(
            <button
                key="next"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.last_page}
                className={`px-3 py-2 rounded-lg ${
                    currentPage === pagination.last_page
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-300'
                }`}
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        );

        return pages;
    };

    return (
        <div className="p-6 mt-16 ml-64 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">All Pharmacies Inventory</h1>
                            <p className="text-gray-600 mt-1">View and filter products across all pharmacy locations</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-lg">
                            <Package className="w-5 h-5 text-blue-600" />
                            <span className="text-blue-800 font-semibold">
                                {pagination ? `${pagination.total} Total Items` : `${filteredInventory.length} Items`}
                            </span>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by product name, generic name, or pharmacy..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Pharmacy Filter */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Building2 className="w-4 h-4" />
                                Pharmacy
                            </label>
                            <select
                                value={selectedPharmacy}
                                onChange={(e) => setSelectedPharmacy(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="all">All Pharmacies</option>
                                {pharmacies.map((pharmacy) => (
                                    <option key={pharmacy.id} value={pharmacy.id}>
                                        {pharmacy.name} {pharmacy.branch_name && `(${pharmacy.branch_name})`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Stock Level Filter */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Package className="w-4 h-4" />
                                Stock Level
                            </label>
                            <select
                                value={stockFilter}
                                onChange={(e) => setStockFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="all">All Stock Levels</option>
                                <option value="low_stock">Low Stock</option>
                                <option value="out_of_stock">Out of Stock</option>
                            </select>
                        </div>

                        {/* Expiry Filter */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4" />
                                Expiry Status
                            </label>
                            <select
                                value={expiryFilter}
                                onChange={(e) => setExpiryFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="all">All Items</option>
                                <option value="expiring">Expiring Soon (30 days)</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>
                    </div>

                    {/* Reset Filters */}
                    {(selectedPharmacy !== 'all' || stockFilter !== 'all' || expiryFilter !== 'all' || searchTerm) && (
                        <div className="mt-4">
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                Reset All Filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Inventory Table */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredInventory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <AlertTriangle className="w-12 h-12 mb-4" />
                            <p className="text-lg font-medium">No items found</p>
                            <p className="text-sm">Try adjusting your filters or search criteria</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Pharmacy
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Generic Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Batch No.
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Quantity
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Stock Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Unit Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Expiry Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Expiry Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredInventory.map((item) => {
                                        const stockStatus = getStockStatus(item.quantity, item.reorder_level);
                                        const expiryStatus = getExpiryStatus(item.expiry_date);
                                        
                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {item.pharmacy_name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">{item.medicine_name}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-500">{item.generic_name || 'N/A'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{item.batch_number}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {item.quantity} {item.unit}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${stockStatus.color}`}>
                                                        {stockStatus.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        LKR {parseFloat(String(item.unit_price || 0)).toFixed(2)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {new Date(item.expiry_date).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${expiryStatus.color}`}>
                                                        {expiryStatus.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && pagination && pagination.last_page > 1 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{pagination.from}</span> to{' '}
                                    <span className="font-medium">{pagination.to}</span> of{' '}
                                    <span className="font-medium">{pagination.total}</span> results
                                </div>
                                <div className="flex items-center gap-2">
                                    {renderPagination()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AllPharmaciesInventoryList;
