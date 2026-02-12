import React, { useState, useEffect } from 'react';
import api from '../../../utils/api/axios';

interface ConsultationMonitorProps {
  title: string;
  showBranchFilter: boolean;
}

interface Branch {
  id: string;
  name: string;
}

interface ConsultationRecord {
  id: string;
  patient_name: string;
  doctor_name: string;
  branch_name: string;
  status: string;
  started_at: string;
  notes: string;
}

const ConsultationMonitor: React.FC<ConsultationMonitorProps> = ({
  title,
  showBranchFilter,
}) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showBranchFilter) {
      loadBranches();
    }
    loadConsultations();
  }, []);

  useEffect(() => {
    loadConsultations();
  }, [selectedBranch]);

  const loadBranches = async () => {
    try {
      const res = await api.get('/branches');
      const payload = (res as any)?.data ? (res as any).data : res;
      setBranches(payload.branches || payload || []);
    } catch {
      // ignore
    }
  };

  const loadConsultations = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (selectedBranch !== 'all') params.branch_id = selectedBranch;
      const res = await api.get('/consultations/monitoring', { params });
      const payload = (res as any)?.data ? (res as any).data : res;
      setConsultations(payload.consultations || []);
    } catch {
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'waiting': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-neutral-100 text-neutral-600';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">{title}</h1>
        {showBranchFilter && (
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-neutral-400">Loading...</div>
        ) : consultations.length === 0 ? (
          <div className="p-8 text-center text-neutral-400">
            No active consultations found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 text-left">Patient</th>
                <th className="px-4 py-3 text-left">Doctor</th>
                {showBranchFilter && <th className="px-4 py-3 text-left">Branch</th>}
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {consultations.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">{c.patient_name}</td>
                  <td className="px-4 py-3">{c.doctor_name}</td>
                  {showBranchFilter && <td className="px-4 py-3">{c.branch_name}</td>}
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(c.status)}`}>
                      {c.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {c.started_at ? new Date(c.started_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ConsultationMonitor;
