import React, { useState, useEffect } from 'react';
import api from "../../../utils/api/axios";
import { Store, Building2, Package, AlertTriangle, ChevronRight } from 'lucide-react';

interface Pharmacy {
    id: number;
    branch_id: number;
    name: string;
    pharmacy_code: string;
    location: string;
    status: string;
    inventory_count: number;
    low_stock_count: number;
    branch?: {
        center_name: string;
    };
}

interface Branch {
    id: string;
    center_name: string;
}

interface PharmacySelectorProps {
    onSelectPharmacy: (pharmacyId: number | null, pharmacyName: string) => void;
    selectedPharmacyId: number | null;
}

const PharmacySelector: React.FC<PharmacySelectorProps> = ({ onSelectPharmacy, selectedPharmacyId }) => {
    const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [pharmaciesRes, branchesRes] = await Promise.all([
                api.get('/pharmacies', { headers }),
                api.get('/api/get-branches', { headers }),
            ]);

            if (pharmaciesRes.data.success) {
                setPharmacies(pharmaciesRes.data.data.pharmacies || []);
            }
            if (branchesRes.data.branches) {
                setBranches(branchesRes.data.branches);
            }
        } catch (err: any) {
            setError('Failed to load pharmacies');
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredPharmacies = selectedBranch === 'all' 
        ? pharmacies 
        : pharmacies.filter(p => p.branch_id?.toString() === selectedBranch);

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-error-500 text-center">{error}</div>
        );
    }

    return (
        <div className="p-6 mt-16 ml-64 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Store className="w-8 h-8 text-primary-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-indigo-600 bg-clip-text text-transparent">
                                Pharmacy Management
                            </h1>
                            <p className="text-neutral-500 mt-1">Select a pharmacy to manage inventory and products</p>
                        </div>
                    </div>
                </div>

                {/* Branch Filter */}
                <div className="bg-white rounded-xl shadow p-4 mb-6">
                    <div className="flex items-center gap-4">
                        <Building2 className="w-5 h-5 text-neutral-500" />
                        <label className="font-medium text-neutral-700">Filter by Branch:</label>
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="all">All Branches</option>
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.center_name}
                                </option>
                            ))}
                        </select>
                        <span className="text-sm text-neutral-500">
                            {filteredPharmacies.length} pharmacies found
                        </span>
                    </div>
                </div>

                {/* Pharmacy Grid */}
                {filteredPharmacies.length === 0 ? (
                    <div className="bg-white rounded-xl shadow p-12 text-center">
                        <Store className="w-16 h-16 mx-auto text-neutral-400 mb-4" />
                        <h3 className="text-lg font-medium text-neutral-900 mb-2">No Pharmacies Found</h3>
                        <p className="text-neutral-500">There are no pharmacies in the selected branch.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPharmacies.map((pharmacy) => (
                            <div
                                key={pharmacy.id}
                                onClick={() => onSelectPharmacy(pharmacy.id, pharmacy.name)}
                                className={`bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl hover:scale-105 ${
                                    selectedPharmacyId === pharmacy.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                                }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <Store className="w-6 h-6 text-primary-500" />
                                    </div>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                        pharmacy.status === 'active' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-error-100 text-red-800'
                                    }`}>
                                        {pharmacy.status}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-neutral-900 mb-1">{pharmacy.name}</h3>
                                <p className="text-sm text-primary-500 font-medium mb-2">{pharmacy.pharmacy_code}</p>
                                
                                {pharmacy.branch?.center_name && (
                                    <p className="text-sm text-neutral-500 flex items-center gap-1 mb-3">
                                        <Building2 className="w-4 h-4" />
                                        {pharmacy.branch.center_name}
                                    </p>
                                )}

                                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t">
                                    <div className="flex items-center gap-2">
                                        <Package className="w-4 h-4 text-neutral-400" />
                                        <div>
                                            <p className="text-xs text-neutral-500">Products</p>
                                            <p className="font-semibold text-neutral-900">{pharmacy.inventory_count || 0}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className={`w-4 h-4 ${pharmacy.low_stock_count > 0 ? 'text-orange-500' : 'text-neutral-400'}`} />
                                        <div>
                                            <p className="text-xs text-neutral-500">Low Stock</p>
                                            <p className={`font-semibold ${pharmacy.low_stock_count > 0 ? 'text-orange-600' : 'text-neutral-900'}`}>
                                                {pharmacy.low_stock_count || 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-center gap-2 text-primary-500 font-medium">
                                    <span>Manage Pharmacy</span>
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PharmacySelector;
