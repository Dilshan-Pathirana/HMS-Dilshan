import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from "../../utils/api/axios";
import { Building2, ArrowLeft } from 'lucide-react';

interface BranchData {
  id: string;
  center_name: string;
  register_number: string;
  center_type: string;
  owner_full_name: string;
  owner_contact_number: string;
  division?: string;
  created_at?: string;
  updated_at?: string;
}

const BranchDashboardSimple: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [branch, setBranch] = useState<BranchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBranchData();
  }, [id]);

  const fetchBranchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`http://127.0.0.1:8000/api/v1/branches/${id}`);
      
      // Handle the response structure - the API returns { success: true, data: { branch: {...}, statistics: {...} } }
      const branchData = response.data.data?.branch || response.data.data;
      setBranch(branchData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load branch data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error || 'Branch not found'}
        </div>
        <button
          onClick={() => navigate('/dashboard/branch')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Branches
        </button>
      </div>
    );
  }

  return (
    <div className="p-2 mt-20 ml-[16rem] mr-[30px]">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/branch')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Branches
        </button>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Building2 className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{branch.center_name}</h1>
              <p className="text-gray-600">{branch.register_number}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-600">Center Type</p>
              <p className="text-gray-900">{branch.center_type || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Owner</p>
              <p className="text-gray-900">{branch.owner_full_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contact Number</p>
              <p className="text-gray-900">{branch.owner_contact_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Division</p>
              <p className="text-gray-900">{branch.division || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Register Number</p>
              <p className="text-gray-900">{branch.register_number || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Pharmacies</h2>
          <p className="text-gray-600 mb-4">Manage pharmacies in this branch</p>
          <button 
            onClick={() => navigate(`/branch/${id}/pharmacies`)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Manage Pharmacies
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Inventory</h2>
          <p className="text-gray-600 mb-4">View and manage inventory</p>
          <button 
            onClick={() => navigate(`/branch/${id}/inventory`)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Manage Inventory
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Staff</h2>
          <p className="text-gray-600 mb-4">Manage branch staff assignments</p>
          <button 
            onClick={() => navigate(`/branch/${id}/staff`)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Manage Staff
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Transactions</h2>
          <p className="text-gray-600 mb-4">View stock transactions</p>
          <button 
            onClick={() => navigate(`/branch/${id}/transactions`)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            View Transactions
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Stats</h2>
        <p className="text-gray-600">Coming soon: View branch statistics and analytics</p>
      </div>
    </div>
  );
};

export default BranchDashboardSimple;
