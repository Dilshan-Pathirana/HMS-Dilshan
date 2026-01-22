import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit, Trash2, ArrowLeft, Package, AlertCircle } from 'lucide-react';

interface Pharmacy {
  id: string;
  branch_id: string;
  name: string;
  pharmacy_code?: string;
  location: string;
  contact_number: string;
  email: string;
  manager_name: string;
  status: 'active' | 'inactive';
  created_at: string;
  branch?: {
    center_name: string;
  };
}

interface ConflictResponse {
  conflict: boolean;
  existing_branch?: {
    id: string;
    center_name: string;
  };
  pharmacy_id?: string;
}

const BranchPharmacies: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [availablePharmacies, setAvailablePharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSelectionMode, setShowSelectionMode] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState<Pharmacy | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictData, setConflictData] = useState<ConflictResponse | null>(null);
  const [branchName, setBranchName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    contact_number: '',
    email: '',
    manager_name: '',
    status: 'active' as 'active' | 'inactive',
    pharmacy_code: ''
  });

  useEffect(() => {
    fetchPharmacies();
    fetchBranchInfo();
  }, [id]);

  const fetchBranchInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://127.0.0.1:8000/api/v1/branches/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const branchData = response.data.data?.branch || response.data.data;
      setBranchName(branchData.center_name);
    } catch (err: any) {
      console.error('Error fetching branch info:', err);
    }
  };

  const fetchPharmacies = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://127.0.0.1:8000/api/v1/pharmacies?branch_id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fetchedPharmacies = response.data.data?.pharmacies || response.data.data || [];
      console.log('Fetched pharmacies for branch:', fetchedPharmacies);
      // Force a new array reference to trigger React re-render
      setPharmacies([...fetchedPharmacies]);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load pharmacies');
      console.error('Error fetching pharmacies:', err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const fetchAvailablePharmacies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/api/v1/pharmacies', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allPharmacies = response.data.data?.pharmacies || response.data.data || [];
      // Filter out pharmacies already in this branch
      const currentPharmacyIds = pharmacies.map(p => p.id);
      const available = allPharmacies.filter((p: Pharmacy) => !currentPharmacyIds.includes(p.id));
      setAvailablePharmacies(available);
    } catch (err: any) {
      console.error('Error fetching available pharmacies:', err);
      alert('Failed to load available pharmacies');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = { 
        ...formData, 
        branch_id: id,
        pharmacy_name: formData.name,
        location_in_branch: formData.location,
        phone: formData.contact_number,
        is_active: formData.status === 'active'
      };

      if (editingPharmacy) {
        await axios.put(`http://127.0.0.1:8000/api/v1/pharmacies/${editingPharmacy.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setShowModal(false);
        resetForm();
        fetchPharmacies();
      } else {
        // Check for conflicts before creating
        const checkResponse = await axios.post(
          'http://127.0.0.1:8000/api/v1/pharmacies/check-conflict',
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (checkResponse.data.conflict) {
          setConflictData(checkResponse.data);
          setShowConflictDialog(true);
        } else {
          // No conflict, proceed with creation
          await axios.post('http://127.0.0.1:8000/api/v1/pharmacies', payload, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setShowModal(false);
          resetForm();
          fetchPharmacies();
        }
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        // Conflict detected
        setConflictData(err.response.data);
        setShowConflictDialog(true);
      } else {
        alert(err.response?.data?.message || 'Failed to save pharmacy');
      }
    }
  };

  const handleReassignPharmacy = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = { 
        ...formData, 
        branch_id: id,
        pharmacy_name: formData.name,
        location_in_branch: formData.location,
        phone: formData.contact_number,
        is_active: formData.status === 'active',
        force_reassign: true
      };

      if (conflictData?.pharmacy_id) {
        // Update existing pharmacy to new branch
        await axios.put(
          `http://127.0.0.1:8000/api/v1/pharmacies/${conflictData.pharmacy_id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create with force flag
        await axios.post('http://127.0.0.1:8000/api/v1/pharmacies', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setShowConflictDialog(false);
      setConflictData(null);
      setShowModal(false);
      resetForm();
      fetchPharmacies();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reassign pharmacy');
    }
  };

  const handleAddExistingPharmacy = async (pharmacy: Pharmacy) => {
    const wasReassigned = pharmacy.branch && pharmacy.branch_id !== id;
    const oldBranchName = pharmacy.branch?.center_name;
    
    try {
      const token = localStorage.getItem('token');

      // Check if pharmacy is already assigned to another branch
      if (wasReassigned) {
        const confirmMessage = `This pharmacy is currently assigned to "${oldBranchName}".\n\nDo you want to reassign it to the current branch?`;
        if (!confirm(confirmMessage)) {
          return;
        }
      }

      const payload = {
        branch_id: id,
        force_reassign: true
      };

      const updateResponse = await axios.put(
        `http://127.0.0.1:8000/api/v1/pharmacies/${pharmacy.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Update response:', updateResponse.status);

      // Close modal first
      setShowModal(false);
      setShowSelectionMode(false);
      
      // Refresh the pharmacy list without showing loading screen
      await fetchPharmacies(false);
      
      // Show success message
      if (wasReassigned) {
        alert(`Pharmacy successfully reassigned from "${oldBranchName}" to this branch`);
      } else {
        alert('Pharmacy added to branch successfully');
      }
      
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add pharmacy to branch');
    }
  };

  const openPharmacySelectionModal = async () => {
    setShowSelectionMode(true);
    setShowModal(true);
    await fetchAvailablePharmacies();
  };

  const handleDelete = async (pharmacyId: string) => {
    if (!confirm('Are you sure you want to remove this pharmacy from this branch?\n\nNote: The pharmacy will not be deleted, only unassigned from this branch.')) return;

    try {
      const token = localStorage.getItem('token');
      // Unassign pharmacy from branch by setting branch_id to null
      await axios.put(
        `http://127.0.0.1:8000/api/v1/pharmacies/${pharmacyId}`,
        { branch_id: null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchPharmacies(false);
      alert('Pharmacy removed from branch successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove pharmacy from branch');
    }
  };

  const openEditModal = (pharmacy: Pharmacy) => {
    setEditingPharmacy(pharmacy);
    setFormData({
      name: pharmacy.name,
      location: pharmacy.location,
      contact_number: pharmacy.contact_number,
      email: pharmacy.email,
      manager_name: pharmacy.manager_name,
      status: pharmacy.status,
      pharmacy_code: pharmacy.pharmacy_code || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingPharmacy(null);
    setShowSelectionMode(false);
    setSearchQuery('');
    setFormData({
      name: '',
      location: '',
      contact_number: '',
      email: '',
      manager_name: '',
      status: 'active',
      pharmacy_code: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading pharmacies...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(`/branch/${id}`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pharmacies</h1>
            </div>
          </div>
          
          {/* Branch Name Card */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-blue-100 text-sm font-medium">Branch Location</p>
                  <h2 className="text-2xl font-bold text-white">{branchName || 'Loading...'}</h2>
                </div>
              </div>
              <button
                onClick={openPharmacySelectionModal}
                className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold shadow-md"
              >
                <Plus className="w-5 h-5" />
                Add Pharmacy
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Pharmacies Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {pharmacies.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pharmacies yet</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first pharmacy</p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Add Pharmacy
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pharmacy Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pharmacies.map((pharmacy) => (
                  <tr key={pharmacy.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{pharmacy.name}</div>
                      <div className="text-sm text-gray-500">{pharmacy.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {pharmacy.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {pharmacy.manager_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {pharmacy.contact_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          pharmacy.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {pharmacy.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEditModal(pharmacy)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pharmacy.id)}
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
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {showSelectionMode ? 'Select Pharmacy to Add' : editingPharmacy ? 'Edit Pharmacy' : 'Add New Pharmacy'}
              </h2>
              {showSelectionMode ? (
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search pharmacies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Available Pharmacies List */}
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {availablePharmacies
                      .filter(pharmacy => 
                        pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        pharmacy.pharmacy_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        pharmacy.email.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((pharmacy) => (
                        <div
                          key={pharmacy.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <Package className="w-5 h-5 text-blue-600" />
                                <div>
                                  <h3 className="font-semibold text-gray-900">{pharmacy.name}</h3>
                                  <p className="text-sm text-gray-500">{pharmacy.pharmacy_code}</p>
                                </div>
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-600">Location: </span>
                                  <span className="text-gray-900">{pharmacy.location}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Contact: </span>
                                  <span className="text-gray-900">{pharmacy.contact_number}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Email: </span>
                                  <span className="text-gray-900">{pharmacy.email}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Manager: </span>
                                  <span className="text-gray-900">{pharmacy.manager_name}</span>
                                </div>
                                {pharmacy.branch && (
                                  <div className="col-span-2">
                                    <span className="text-gray-600">Current Branch: </span>
                                    <span className="text-orange-600 font-medium">{pharmacy.branch.center_name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddExistingPharmacy(pharmacy)}
                              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Add
                            </button>
                          </div>
                        </div>
                      ))}
                    {availablePharmacies.filter(pharmacy => 
                      pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      pharmacy.pharmacy_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      pharmacy.email.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No pharmacies available to add</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pharmacy Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pharmacy Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.pharmacy_code}
                      onChange={(e) => setFormData({ ...formData, pharmacy_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., PHR001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manager Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.manager_name}
                      onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.contact_number}
                      onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
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
                    {editingPharmacy ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conflict Confirmation Dialog */}
      {showConflictDialog && conflictData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Pharmacy Already Assigned
                </h2>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  A pharmacy with code <strong>"{formData.pharmacy_code}"</strong> or similar details is already assigned to:
                </p>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-600">Current Branch:</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {conflictData.existing_branch?.center_name}
                  </p>
                </div>
                <p className="text-gray-700 mt-4">
                  Do you want to <strong>reassign</strong> this pharmacy to <strong>"{branchName}"</strong>?
                </p>
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ This will remove the pharmacy from the current branch and assign it to this branch.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowConflictDialog(false);
                    setConflictData(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReassignPharmacy}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Yes, Reassign Pharmacy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchPharmacies;
