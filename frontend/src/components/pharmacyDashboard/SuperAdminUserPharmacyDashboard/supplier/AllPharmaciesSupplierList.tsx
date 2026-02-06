import React, { useState, useEffect } from 'react';
import api from "../../../../utils/api/axios";
import { Search, Filter, Users, Building2, MapPin, Globe, Package, ChevronLeft, ChevronRight, Eye, Edit, Trash2, UserPlus, Copy, X } from 'lucide-react';
import SupplierDetailsModal from './SupplierDetailsModal';
import SupplierEditModal from './SupplierEditModal';
import { ConfirmAlert } from '../../../../assets/Common/Alert/ConfirmAlert';
import alert from '../../../../utils/alert';
import { SupplierList } from '../../../../utils/types/pos/IProduct.ts';

interface Supplier {
    id: string;
    pharmacy_id: string;
    pharmacy_name: string;
    supplier_name: string;
    contact_person: string;
    contact_number: string;
    contact_email: string;
    supplier_address: string;
    supplier_city: string;
    supplier_country: string;
    supplier_type: string;
    products_supplied: string;
    user_id?: string;
}

interface SupplierCredentials {
    username: string;
    password: string;
    email: string;
    supplier_name: string;
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

const AllPharmaciesSupplierList: React.FC = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationData | null>(null);

    // Filters
    const [selectedPharmacy, setSelectedPharmacy] = useState<string>('all');
    const [selectedCountry, setSelectedCountry] = useState<string>('all');
    const [selectedCity, setSelectedCity] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedProductType, setSelectedProductType] = useState<string>('all');

    // Modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
    const [credentials, setCredentials] = useState<SupplierCredentials | null>(null);

    // Unique filter options
    const [countries, setCountries] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [types, setTypes] = useState<string[]>([]);
    const [productTypes, setProductTypes] = useState<string[]>([]);

    useEffect(() => {
        fetchPharmacies();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
        fetchSuppliers(1);
    }, [selectedPharmacy, selectedCountry, selectedCity, selectedType, selectedProductType]);

    useEffect(() => {
        fetchSuppliers(currentPage);
    }, [currentPage]);

    const fetchPharmacies = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/pharmacies', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setPharmacies(response.data.data.pharmacies || []);
            }
        } catch (err) {
            console.error('Failed to fetch pharmacies:', err);
        }
    };

    const fetchSuppliers = async (page: number = 1) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            let url = '/api/get-suppliers';
            const params = new URLSearchParams();

            params.append('page', page.toString());

            if (selectedPharmacy !== 'all') {
                params.append('pharmacy_id', selectedPharmacy);
            }

            if (selectedCountry !== 'all') {
                params.append('country', selectedCountry);
            }

            if (selectedCity !== 'all') {
                params.append('city', selectedCity);
            }

            if (selectedType !== 'all') {
                params.append('type', selectedType);
            }

            if (selectedProductType !== 'all') {
                params.append('product_type', selectedProductType);
            }

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            if (params.toString()) {
                url += '?' + params.toString();
            }

            const response = await api.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 200) {
                const supplierData = response.data.suppliers || [];
                setSuppliers(supplierData);
                setPagination(response.data.pagination);

                // Extract unique filter options
                const allSuppliers = supplierData;
                setCountries([...new Set(allSuppliers.map((s: Supplier) => s.supplier_country).filter(Boolean))] as string[]);
                setCities([...new Set(allSuppliers.map((s: Supplier) => s.supplier_city).filter(Boolean))] as string[]);
                setTypes([...new Set(allSuppliers.map((s: Supplier) => s.supplier_type).filter(Boolean))] as string[]);
                const allProducts = allSuppliers
                    .map((s: Supplier) => s.products_supplied)
                    .filter(Boolean)
                    .flatMap((p: string) => p.split(',').map(item => item.trim()));
                setProductTypes([...new Set(allProducts)] as string[]);
            }
        } catch (err: any) {
            console.error('Error fetching suppliers:', err);
            alert.error('Failed to fetch suppliers');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (id: string) => {
        const supplier = suppliers.find((s) => s.id === id);
        if (supplier) {
            setSelectedSupplier(supplier);
            setIsViewModalOpen(true);
        }
    };

    const handleEdit = (id: string) => {
        const supplier = suppliers.find((s) => s.id === id);
        if (supplier) {
            setSelectedSupplier(supplier);
            setIsEditModalOpen(true);
        }
    };

    const handleDelete = async (id: string) => {
        const isConfirm = await ConfirmAlert(
            'Are you sure you want to delete this supplier?',
            'Do you really want to delete this supplier?'
        );

        if (isConfirm) {
            try {
                const token = localStorage.getItem('token');
                const response = await api.delete(
                    `/api/delete-supplier/${id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.status === 200) {
                    alert.success('Supplier deleted successfully');
                    fetchSuppliers(currentPage);
                }
            } catch (error) {
                alert.error('Failed to delete supplier');
            }
        }
    };

    const saveEditedSupplier = async (updatedSupplier: SupplierList) => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.put(
                `/api/update-supplier/${updatedSupplier.id}`,
                updatedSupplier,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 200) {
                alert.success('Supplier updated successfully');
                setIsEditModalOpen(false);
                fetchSuppliers(currentPage);
            }
        } catch (error) {
            alert.error('Failed to update supplier');
        }
    };

    const handleCreateAccount = async (id: string) => {
        const supplier = suppliers.find((s) => s.id === id);

        if (supplier?.user_id) {
            alert.warn('This supplier already has a user account');
            return;
        }

        const isConfirm = await ConfirmAlert(
            'Create User Account',
            `Create a login account for ${supplier?.supplier_name}? Credentials will be generated automatically.`
        );

        if (isConfirm) {
            try {
                const token = localStorage.getItem('token');
                const response = await api.post(
                    `/api/create-supplier-account/${id}`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data.status === 200) {
                    setCredentials(response.data.credentials);
                    setIsCredentialsModalOpen(true);
                    alert.success('User account created successfully');
                    fetchSuppliers(currentPage);
                }
            } catch (error: any) {
                alert.error(error.response?.data?.message || 'Failed to create user account');
            }
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert.success('Copied to clipboard!');
    };

    const resetFilters = () => {
        setSelectedPharmacy('all');
        setSelectedCountry('all');
        setSelectedCity('all');
        setSelectedType('all');
        setSelectedProductType('all');
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

        pages.push(
            <button
                key="prev"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg ${currentPage === 1
                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                    : 'bg-white text-neutral-700 hover:bg-blue-50 border border-neutral-300'
                    }`}
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
        );

        if (startPage > 1) {
            pages.push(
                <button
                    key={1}
                    onClick={() => handlePageChange(1)}
                    className="px-4 py-2 rounded-lg bg-white text-neutral-700 hover:bg-blue-50 border border-neutral-300"
                >
                    1
                </button>
            );
            if (startPage > 2) {
                pages.push(
                    <span key="ellipsis1" className="px-2 py-2 text-neutral-500">
                        ...
                    </span>
                );
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-4 py-2 rounded-lg ${i === currentPage
                        ? 'bg-primary-500 text-white font-semibold'
                        : 'bg-white text-neutral-700 hover:bg-blue-50 border border-neutral-300'
                        }`}
                >
                    {i}
                </button>
            );
        }

        if (endPage < pagination.last_page) {
            if (endPage < pagination.last_page - 1) {
                pages.push(
                    <span key="ellipsis2" className="px-2 py-2 text-neutral-500">
                        ...
                    </span>
                );
            }
            pages.push(
                <button
                    key={pagination.last_page}
                    onClick={() => handlePageChange(pagination.last_page)}
                    className="px-4 py-2 rounded-lg bg-white text-neutral-700 hover:bg-blue-50 border border-neutral-300"
                >
                    {pagination.last_page}
                </button>
            );
        }

        pages.push(
            <button
                key="next"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.last_page}
                className={`px-3 py-2 rounded-lg ${currentPage === pagination.last_page
                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                    : 'bg-white text-neutral-700 hover:bg-blue-50 border border-neutral-300'
                    }`}
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        );

        return pages;
    };

    return (
        <div className="p-6 mt-16 ml-64 bg-gradient-to-br from-purple-50 to-pink-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-800">All Suppliers</h1>
                            <p className="text-neutral-600 mt-1">View and manage suppliers across all pharmacies</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-lg">
                            <Users className="w-5 h-5 text-purple-600" />
                            <span className="text-purple-800 font-semibold">
                                {pagination ? `${pagination.total} Total Suppliers` : `${suppliers.length} Suppliers`}
                            </span>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by supplier name, contact person, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && fetchSuppliers(1)}
                            className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-neutral-600" />
                        <h3 className="text-lg font-semibold text-neutral-800">Filters</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {/* Pharmacy Filter */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                                <Building2 className="w-4 h-4" />
                                Pharmacy
                            </label>
                            <select
                                value={selectedPharmacy}
                                onChange={(e) => setSelectedPharmacy(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                            >
                                <option value="all">All Pharmacies</option>
                                {pharmacies.map((pharmacy) => (
                                    <option key={pharmacy.id} value={pharmacy.id}>
                                        {pharmacy.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Country Filter */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                                <Globe className="w-4 h-4" />
                                Country
                            </label>
                            <select
                                value={selectedCountry}
                                onChange={(e) => setSelectedCountry(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                            >
                                <option value="all">All Countries</option>
                                {countries.map((country) => (
                                    <option key={country} value={country}>
                                        {country}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* City Filter */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                                <MapPin className="w-4 h-4" />
                                City
                            </label>
                            <select
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                            >
                                <option value="all">All Cities</option>
                                {cities.map((city) => (
                                    <option key={city} value={city}>
                                        {city}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Supplier Type Filter */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                                <Users className="w-4 h-4" />
                                Type
                            </label>
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                            >
                                <option value="all">All Types</option>
                                {types.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Product Type Filter */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                                <Package className="w-4 h-4" />
                                Product Type
                            </label>
                            <select
                                value={selectedProductType}
                                onChange={(e) => setSelectedProductType(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                            >
                                <option value="all">All Products</option>
                                {productTypes.map((product) => (
                                    <option key={product} value={product}>
                                        {product}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Reset Filters */}
                    {(selectedPharmacy !== 'all' || selectedCountry !== 'all' || selectedCity !== 'all' ||
                        selectedType !== 'all' || selectedProductType !== 'all' || searchTerm) && (
                            <div className="mt-4">
                                <button
                                    onClick={resetFilters}
                                    className="px-4 py-2 text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                                >
                                    Reset All Filters
                                </button>
                            </div>
                        )}
                </div>

                {/* Suppliers Table */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        </div>
                    ) : suppliers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
                            <Users className="w-12 h-12 mb-4" />
                            <p className="text-lg font-medium">No suppliers found</p>
                            <p className="text-sm">Try adjusting your filters or search criteria</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-neutral-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Pharmacy
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Supplier Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Contact Person
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Phone
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Location
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Products
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {suppliers.map((supplier) => (
                                        <tr key={supplier.id} className="hover:bg-neutral-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Building2 className="w-4 h-4 text-neutral-400 mr-2" />
                                                    <span className="text-sm font-medium text-neutral-900">
                                                        {supplier.pharmacy_name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-neutral-900">
                                                    {supplier.supplier_name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-neutral-500">{supplier.contact_person || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-neutral-900">{supplier.contact_number || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-neutral-900">
                                                    {supplier.supplier_city && supplier.supplier_country
                                                        ? `${supplier.supplier_city}, ${supplier.supplier_country}`
                                                        : supplier.supplier_city || supplier.supplier_country || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {supplier.supplier_type || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-neutral-500 max-w-xs truncate">
                                                    {supplier.products_supplied || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewDetails(supplier.id)}
                                                        className="text-primary-500 hover:text-blue-900"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(supplier.id)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                    {!supplier.user_id && (
                                                        <button
                                                            onClick={() => handleCreateAccount(supplier.id)}
                                                            className="text-purple-600 hover:text-purple-900"
                                                            title="Create User Account"
                                                        >
                                                            <UserPlus className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(supplier.id)}
                                                        className="text-error-600 hover:text-red-900"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && pagination && pagination.last_page > 1 && (
                        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-neutral-700">
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

            {/* Modals */}
            {isViewModalOpen && selectedSupplier && (
                <SupplierDetailsModal
                    supplier={selectedSupplier}
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                />
            )}

            {isEditModalOpen && selectedSupplier && (
                <SupplierEditModal
                    supplier={selectedSupplier}
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={saveEditedSupplier}
                />
            )}

            {/* Credentials Modal */}
            {isCredentialsModalOpen && credentials && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <UserPlus className="w-6 h-6" />
                                    Account Created
                                </h3>
                                <button
                                    onClick={() => setIsCredentialsModalOpen(false)}
                                    className="text-white hover:bg-white/20 rounded-lg p-1"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-green-800 font-medium text-center">
                                    ? User account successfully created for {credentials.supplier_name}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-neutral-50 p-4 rounded-lg">
                                    <label className="block text-sm font-medium text-neutral-600 mb-1">
                                        Username
                                    </label>
                                    <div className="flex items-center justify-between bg-white p-3 rounded border">
                                        <span className="font-mono font-semibold text-neutral-900">
                                            {credentials.username}
                                        </span>
                                        <button
                                            onClick={() => copyToClipboard(credentials.username)}
                                            className="text-purple-600 hover:text-purple-800"
                                            title="Copy"
                                        >
                                            <Copy className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-neutral-50 p-4 rounded-lg">
                                    <label className="block text-sm font-medium text-neutral-600 mb-1">
                                        Password
                                    </label>
                                    <div className="flex items-center justify-between bg-white p-3 rounded border">
                                        <span className="font-mono font-semibold text-neutral-900">
                                            {credentials.password}
                                        </span>
                                        <button
                                            onClick={() => copyToClipboard(credentials.password)}
                                            className="text-purple-600 hover:text-purple-800"
                                            title="Copy"
                                        >
                                            <Copy className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-neutral-50 p-4 rounded-lg">
                                    <label className="block text-sm font-medium text-neutral-600 mb-1">
                                        Email
                                    </label>
                                    <div className="flex items-center justify-between bg-white p-3 rounded border">
                                        <span className="text-neutral-900">
                                            {credentials.email}
                                        </span>
                                        <button
                                            onClick={() => copyToClipboard(credentials.email)}
                                            className="text-purple-600 hover:text-purple-800"
                                            title="Copy"
                                        >
                                            <Copy className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    <strong>Important:</strong> Save these credentials securely. Share them with the supplier
                                    via secure channels (email, encrypted message, etc.). The password cannot be recovered later.
                                </p>
                            </div>

                            <button
                                onClick={() => setIsCredentialsModalOpen(false)}
                                className="mt-6 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllPharmaciesSupplierList;
