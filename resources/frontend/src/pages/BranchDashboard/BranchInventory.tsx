import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit, Trash2, ArrowLeft, Package, AlertTriangle, TrendingDown } from 'lucide-react';

interface InventoryItem {
  id: string;
  pharmacy_id: string;
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
  id: string;
  name: string;
}

const BranchInventory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'low-stock' | 'expiring'>('all');
  const [formData, setFormData] = useState({
    pharmacy_id: '',
    medicine_name: '',
    generic_name: '',
    batch_number: '',
    quantity: 0,
    unit: 'tablets',
    unit_price: 0,
    expiry_date: '',
    supplier: '',
    reorder_level: 10
  });
  const [adjustData, setAdjustData] = useState({
    quantity: 0,
    type: 'add' as 'add' | 'remove',
    reason: ''
  });

  useEffect(() => {
    fetchPharmacies();
    fetchInventory();
  }, [id, selectedFilter]);

  const fetchPharmacies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://127.0.0.1:8000/api/v1/pharmacies?branch_id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPharmacies(response.data.data?.pharmacies || response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching pharmacies:', err);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = `http://127.0.0.1:8000/api/v1/pharmacy-inventory?branch_id=${id}`;
      
      if (selectedFilter === 'low-stock') {
        url = `http://127.0.0.1:8000/api/v1/pharmacies/${pharmacies[0]?.id}/low-stock`;
      } else if (selectedFilter === 'expiring') {
        url = `http://127.0.0.1:8000/api/v1/pharmacies/${pharmacies[0]?.id}/expiring`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventory(response.data.data?.inventory || response.data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load inventory');
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      if (editingItem) {
        await axios.put(`http://127.0.0.1:8000/api/v1/pharmacy-inventory/${editingItem.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('http://127.0.0.1:8000/api/v1/pharmacy-inventory', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setShowModal(false);
      resetForm();
      fetchInventory();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save inventory item');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://127.0.0.1:8000/api/v1/pharmacy-inventory/${editingItem.id}/adjust-stock`,
        adjustData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowAdjustModal(false);
      setEditingItem(null);
      setAdjustData({ quantity: 0, type: 'add', reason: '' });
      fetchInventory();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to adjust stock');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://127.0.0.1:8000/api/v1/pharmacy-inventory/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchInventory();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete item');
    }
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      pharmacy_id: item.pharmacy_id,
      medicine_name: item.medicine_name,
      generic_name: item.generic_name,
      batch_number: item.batch_number,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      expiry_date: item.expiry_date,
      supplier: item.supplier,
      reorder_level: item.reorder_level
    });
    setShowModal(true);
  };

  const openAdjustModal = (item: InventoryItem) => {
    setEditingItem(item);
    setShowAdjustModal(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      pharmacy_id: pharmacies[0]?.id || '',
      medicine_name: '',
      generic_name: '',
      batch_number: '',
      quantity: 0,
      unit: 'tablets',
      unit_price: 0,
      expiry_date: '',
      supplier: '',
      reorder_level: 10
    });
  };

  const isLowStock = (item: InventoryItem) => item.quantity <= item.reorder_level;
  const isExpiringSoon = (item: InventoryItem) => {
    const today = new Date();
    const expiryDate = new Date(item.expiry_date);
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading inventory...</div>
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
              <h1 className="text-2xl font-bold text-gray-900">Branch Inventory</h1>
              <p className="text-gray-600 mt-1">View and manage pharmacy inventory</p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setSelectedFilter('low-stock')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              selectedFilter === 'low-stock'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Low Stock
          </button>
          <button
            onClick={() => setSelectedFilter('expiring')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              selectedFilter === 'expiring'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            Expiring Soon
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {inventory.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items</h3>
              <p className="text-gray-600 mb-4">Add your first inventory item to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{item.medicine_name}</div>
                        <div className="text-sm text-gray-500">{item.generic_name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.batch_number}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-sm font-medium ${
                            isLowStock(item) ? 'text-orange-600' : 'text-gray-900'
                          }`}
                        >
                          {item.quantity} {item.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">LKR {item.unit_price.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-sm ${
                            isExpiringSoon(item) ? 'text-red-600 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {new Date(item.expiry_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          {isLowStock(item) && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                              Low Stock
                            </span>
                          )}
                          {isExpiringSoon(item) && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Expiring
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openAdjustModal(item)}
                            className="text-green-600 hover:text-green-900"
                            title="Adjust Stock"
                          >
                            <Package className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pharmacy *</label>
                    <select
                      required
                      value={formData.pharmacy_id}
                      onChange={(e) => setFormData({ ...formData, pharmacy_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Pharmacy</option>
                      {pharmacies.map((pharmacy) => (
                        <option key={pharmacy.id} value={pharmacy.id}>
                          {pharmacy.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.medicine_name}
                      onChange={(e) => setFormData({ ...formData, medicine_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
                    <input
                      type="text"
                      value={formData.generic_name}
                      onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.batch_number}
                      onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                    <select
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="tablets">Tablets</option>
                      <option value="capsules">Capsules</option>
                      <option value="bottles">Bottles</option>
                      <option value="boxes">Boxes</option>
                      <option value="vials">Vials</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.reorder_level}
                      onChange={(e) => setFormData({ ...formData, reorder_level: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Adjust Stock</h2>
              <p className="text-gray-600 mb-6">
                {editingItem.medicine_name} - Current: {editingItem.quantity} {editingItem.unit}
              </p>
              <form onSubmit={handleAdjustStock} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={adjustData.type}
                    onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value as 'add' | 'remove' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="add">Add Stock</option>
                    <option value="remove">Remove Stock</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={adjustData.quantity}
                    onChange={(e) => setAdjustData({ ...adjustData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                  <textarea
                    required
                    value={adjustData.reason}
                    onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdjustModal(false);
                      setEditingItem(null);
                      setAdjustData({ quantity: 0, type: 'add', reason: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Adjust Stock
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchInventory;
