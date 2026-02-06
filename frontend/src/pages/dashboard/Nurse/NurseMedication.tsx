import React, { useState } from 'react';
import { Pill, Clock, CheckCircle, AlertTriangle, Search, Filter } from 'lucide-react';

interface Medication {
  id: string;
  patientId: string;
  patientName: string;
  bed: string;
  medicationName: string;
  dosage: string;
  route: string;
  frequency: string;
  scheduledTime: string;
  status: 'pending' | 'administered' | 'missed' | 'refused';
  prescribedBy: string;
  notes: string;
}

const NurseMedication: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAdministerModal, setShowAdministerModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);

  // Mock data
  const medications: Medication[] = [
    {
      id: 'MED001',
      patientId: 'P001',
      patientName: 'John Smith',
      bed: 'Ward A - Bed 12',
      medicationName: 'Amoxicillin',
      dosage: '500mg',
      route: 'Oral',
      frequency: 'TID',
      scheduledTime: '08:00 AM',
      status: 'pending',
      prescribedBy: 'Dr. Williams',
      notes: 'Take with food'
    },
    {
      id: 'MED002',
      patientId: 'P001',
      patientName: 'John Smith',
      bed: 'Ward A - Bed 12',
      medicationName: 'Paracetamol',
      dosage: '500mg',
      route: 'Oral',
      frequency: 'QID',
      scheduledTime: '09:00 AM',
      status: 'administered',
      prescribedBy: 'Dr. Williams',
      notes: 'For fever'
    },
    {
      id: 'MED003',
      patientId: 'P002',
      patientName: 'Emily Davis',
      bed: 'Ward B - Bed 5',
      medicationName: 'Insulin Glargine',
      dosage: '10 units',
      route: 'SC',
      frequency: 'Daily',
      scheduledTime: '08:00 AM',
      status: 'pending',
      prescribedBy: 'Dr. Martinez',
      notes: 'Before breakfast'
    },
    {
      id: 'MED004',
      patientId: 'P003',
      patientName: 'Michael Chen',
      bed: 'ICU - Bed 3',
      medicationName: 'Dopamine',
      dosage: '5mcg/kg/min',
      route: 'IV',
      frequency: 'Continuous',
      scheduledTime: 'Ongoing',
      status: 'administered',
      prescribedBy: 'Dr. Thompson',
      notes: 'Monitor BP closely'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'administered':
        return 'bg-green-100 text-green-800';
      case 'missed':
        return 'bg-error-100 text-red-800';
      case 'refused':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const handleAdminister = () => {
    console.log('Administering medication:', selectedMed);
    setShowAdministerModal(false);
    setSelectedMed(null);
  };

  const filteredMedications = medications.filter(med => {
    const matchesSearch = 
      med.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.medicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.bed.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || med.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const pendingCount = medications.filter(m => m.status === 'pending').length;
  const administeredCount = medications.filter(m => m.status === 'administered').length;
  const missedCount = medications.filter(m => m.status === 'missed').length;

  return (
    <div className="p-6 space-y-6 bg-neutral-50 min-h-screen sm:ml-64 mt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Medication Administration</h1>
            <p className="text-teal-100">Manage patient medications and MAR</p>
          </div>
          <Pill className="w-16 h-16 opacity-20" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-neutral-900">{pendingCount}</span>
          </div>
          <h3 className="text-neutral-600 text-sm font-medium">Pending</h3>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-neutral-900">{administeredCount}</span>
          </div>
          <h3 className="text-neutral-600 text-sm font-medium">Administered Today</h3>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-neutral-900">{missedCount}</span>
          </div>
          <h3 className="text-neutral-600 text-sm font-medium">Missed Doses</h3>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-neutral-900">{medications.length}</span>
          </div>
          <h3 className="text-neutral-600 text-sm font-medium">Total Scheduled</h3>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by patient, medication, or bed..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-neutral-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="administered">Administered</option>
              <option value="missed">Missed</option>
              <option value="refused">Refused</option>
            </select>
          </div>
        </div>
      </div>

      {/* Medications Table */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Medication</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Dosage</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Route</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Frequency</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMedications.map((med) => (
                <tr key={med.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-neutral-900">{med.patientName}</div>
                      <div className="text-sm text-neutral-500">{med.bed}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-neutral-900">{med.medicationName}</div>
                    <div className="text-sm text-neutral-500">Dr. {med.prescribedBy}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-900">{med.dosage}</td>
                  <td className="px-6 py-4 text-sm text-neutral-900">{med.route}</td>
                  <td className="px-6 py-4 text-sm text-neutral-900">{med.frequency}</td>
                  <td className="px-6 py-4 text-sm text-neutral-900">{med.scheduledTime}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(med.status)}`}>
                      {med.status.charAt(0).toUpperCase() + med.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {med.status === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedMed(med);
                          setShowAdministerModal(true);
                        }}
                        className="bg-gradient-to-r from-primary-500 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 text-sm"
                      >
                        Administer
                      </button>
                    )}
                    {med.status === 'administered' && (
                      <span className="text-green-600 text-sm font-medium">✓ Given</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Administer Modal */}
      {showAdministerModal && selectedMed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-primary-500 to-cyan-600 p-6 text-white">
              <h2 className="text-2xl font-bold">Administer Medication</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Patient:</span>
                    <span className="font-medium">{selectedMed.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Medication:</span>
                    <span className="font-medium">{selectedMed.medicationName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Dosage:</span>
                    <span className="font-medium">{selectedMed.dosage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Route:</span>
                    <span className="font-medium">{selectedMed.route}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Scheduled Time:</span>
                    <span className="font-medium">{selectedMed.scheduledTime}</span>
                  </div>
                </div>
              </div>

              {selectedMed.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-900">Special Instructions</div>
                      <div className="text-sm text-yellow-700 mt-1">{selectedMed.notes}</div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Administration Notes</label>
                <textarea
                  rows={3}
                  placeholder="Any observations or notes..."
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="bg-neutral-50 rounded-lg p-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 text-primary-500" />
                  <span className="text-sm text-neutral-700">I confirm that I have administered this medication</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4 p-6 bg-neutral-50 rounded-b-xl">
              <button
                onClick={() => {
                  setShowAdministerModal(false);
                  setSelectedMed(null);
                }}
                className="px-6 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminister}
                className="px-6 py-2 bg-gradient-to-r from-primary-500 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all"
              >
                Confirm Administration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NurseMedication;
