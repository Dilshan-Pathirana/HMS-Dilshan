import React, { useEffect, useState } from 'react';
import api from "../../utils/api/axios";
import { Package, ShoppingCart, TrendingUp, User } from 'lucide-react';

interface SupplierStats {
    total_orders: number;
    pending_orders: number;
    completed_orders: number;
    total_products: number;
}

interface SupplierData {
    id: string;
    supplier_name: string;
    contact_person: string;
    contact_email: string;
    contact_number: string;
    supplier_type: string;
    products_supplied: string;
    pharmacy_name?: string;
}

const SupplierDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [supplier, setSupplier] = useState<SupplierData | null>(null);
    const [stats, setStats] = useState<SupplierStats>({
        total_orders: 0,
        pending_orders: 0,
        completed_orders: 0,
        total_products: 0
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/api/supplier/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setSupplier(response.data.data.supplier);
                setStats(response.data.data.stats);
            }
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-800">Supplier Dashboard</h1>
                            <p className="text-neutral-600 mt-1">Welcome, {supplier?.supplier_name}</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-lg">
                            <User className="w-5 h-5 text-primary-500" />
                            <span className="text-blue-800 font-semibold">{supplier?.supplier_type || 'Supplier'}</span>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-neutral-500 text-sm">Total Orders</p>
                                <p className="text-3xl font-bold text-neutral-800 mt-2">{stats.total_orders}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <ShoppingCart className="w-8 h-8 text-primary-500" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-neutral-500 text-sm">Pending Orders</p>
                                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending_orders}</p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <Package className="w-8 h-8 text-yellow-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-neutral-500 text-sm">Completed Orders</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">{stats.completed_orders}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <TrendingUp className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-neutral-500 text-sm">Total Products</p>
                                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.total_products}</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Package className="w-8 h-8 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Supplier Info */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-neutral-800 mb-4">Supplier Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-neutral-500">Contact Person</p>
                            <p className="text-neutral-800 font-medium">{supplier?.contact_person || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Email</p>
                            <p className="text-neutral-800 font-medium">{supplier?.contact_email || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Phone</p>
                            <p className="text-neutral-800 font-medium">{supplier?.contact_number || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Supplier Type</p>
                            <p className="text-neutral-800 font-medium">{supplier?.supplier_type || 'N/A'}</p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-sm text-neutral-500">Products Supplied</p>
                            <p className="text-neutral-800 font-medium">{supplier?.products_supplied || 'N/A'}</p>
                        </div>
                        {supplier?.pharmacy_name && (
                            <div className="md:col-span-2">
                                <p className="text-sm text-neutral-500">Pharmacy</p>
                                <p className="text-neutral-800 font-medium">{supplier.pharmacy_name}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-neutral-800 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                            <Package className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                            <p className="text-center font-medium text-neutral-800">View Products</p>
                        </button>
                        <button className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors">
                            <ShoppingCart className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <p className="text-center font-medium text-neutral-800">Manage Orders</p>
                        </button>
                        <button className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
                            <User className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                            <p className="text-center font-medium text-neutral-800">Update Profile</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierDashboard;
