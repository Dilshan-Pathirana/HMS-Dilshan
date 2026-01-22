import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, TrendingUp, TrendingDown, Package, Calendar, Filter } from 'lucide-react';

interface Transaction {
  id: string;
  pharmacy_id: string;
  inventory_id: string;
  transaction_type: 'add' | 'remove' | 'transfer' | 'sale' | 'adjustment';
  quantity: number;
  unit: string;
  reference_number?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  medicine_name?: string;
  batch_number?: string;
  pharmacy_name?: string;
}

const BranchTransactions: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: ''
  });

  useEffect(() => {
    fetchTransactions();
  }, [id, selectedType, dateFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query params
      const params = new URLSearchParams();
      params.append('branch_id', id || '');
      if (selectedType !== 'all') params.append('type', selectedType);
      if (dateFilter.from) params.append('from', dateFilter.from);
      if (dateFilter.to) params.append('to', dateFilter.to);

      const response = await axios.get(
        `http://127.0.0.1:8000/api/v1/pharmacy-inventory/transactions?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setTransactions(response.data.data?.transactions || response.data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load transactions');
      console.error('Error fetching transactions:', err);
      // Set empty array on error
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'add':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'remove':
      case 'sale':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'transfer':
        return <Package className="w-5 h-5 text-blue-600" />;
      case 'adjustment':
        return <Package className="w-5 h-5 text-orange-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionBadgeColor = (type: string) => {
    switch (type) {
      case 'add':
        return 'bg-green-100 text-green-800';
      case 'remove':
        return 'bg-red-100 text-red-800';
      case 'sale':
        return 'bg-purple-100 text-purple-800';
      case 'transfer':
        return 'bg-blue-100 text-blue-800';
      case 'adjustment':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateStats = () => {
    const stats = {
      totalTransactions: transactions.length,
      additions: transactions.filter((t) => t.transaction_type === 'add').length,
      removals: transactions.filter((t) => t.transaction_type === 'remove' || t.transaction_type === 'sale').length,
      transfers: transactions.filter((t) => t.transaction_type === 'transfer').length
    };
    return stats;
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/branch/${id}`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Stock Transactions</h1>
              <p className="text-gray-600 mt-1">View all stock movements and transactions</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total Transactions</div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</div>
              </div>
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Stock Additions</div>
                <div className="text-2xl font-bold text-green-600">{stats.additions}</div>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Stock Removals</div>
                <div className="text-2xl font-bold text-red-600">{stats.removals}</div>
              </div>
              <TrendingDown className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Transfers</div>
                <div className="text-2xl font-bold text-blue-600">{stats.transfers}</div>
              </div>
              <Package className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="add">Additions</option>
                <option value="remove">Removals</option>
                <option value="sale">Sales</option>
                <option value="transfer">Transfers</option>
                <option value="adjustment">Adjustments</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={dateFilter.from}
                onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={dateFilter.to}
                onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">{error}</p>
            <p className="text-sm text-yellow-700 mt-1">
              Note: Transaction tracking may not be fully implemented yet. This is a preview of the interface.
            </p>
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600">
                {selectedType !== 'all' || dateFilter.from || dateFilter.to
                  ? 'Try adjusting your filters'
                  : 'Transactions will appear here as stock movements occur'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Medicine
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Pharmacy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-900">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(transaction.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(transaction.transaction_type)}
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getTransactionBadgeColor(
                              transaction.transaction_type
                            )}`}
                          >
                            {transaction.transaction_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{transaction.medicine_name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{transaction.batch_number || ''}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {transaction.pharmacy_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-medium ${
                            transaction.transaction_type === 'add' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.transaction_type === 'add' ? '+' : '-'}
                          {transaction.quantity} {transaction.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {transaction.reference_number || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                        {transaction.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BranchTransactions;
