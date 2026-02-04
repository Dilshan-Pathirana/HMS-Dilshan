import React, { useState } from 'react';
import { CheckSquare, Clock, AlertCircle, Plus, Search, Filter } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  patientName?: string;
  bed?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  dueTime: string;
  category: 'medication' | 'vitals' | 'procedure' | 'documentation' | 'other';
  assignedBy: string;
  createdAt: string;
}

const NurseTasks: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // Mock data
  const tasks: Task[] = [
    {
      id: 'T001',
      title: 'Administer Morning Medications',
      description: 'Complete medication round for Ward A patients',
      patientName: 'Multiple Patients',
      bed: 'Ward A',
      priority: 'high',
      status: 'pending',
      dueTime: '08:00 AM',
      category: 'medication',
      assignedBy: 'Dr. Williams',
      createdAt: '2024-01-15 06:00 AM'
    },
    {
      id: 'T002',
      title: 'Record Vital Signs - John Smith',
      description: 'Temperature, BP, Pulse, SpO2',
      patientName: 'John Smith',
      bed: 'Ward A - Bed 12',
      priority: 'medium',
      status: 'in-progress',
      dueTime: '09:00 AM',
      category: 'vitals',
      assignedBy: 'Charge Nurse',
      createdAt: '2024-01-15 07:00 AM'
    },
    {
      id: 'T003',
      title: 'Wound Dressing Change',
      description: 'Post-operative wound care for surgical patient',
      patientName: 'Emily Davis',
      bed: 'Ward B - Bed 5',
      priority: 'high',
      status: 'pending',
      dueTime: '10:00 AM',
      category: 'procedure',
      assignedBy: 'Dr. Martinez',
      createdAt: '2024-01-15 07:30 AM'
    },
    {
      id: 'T004',
      title: 'Complete Nursing Notes',
      description: 'Document shift handover notes',
      priority: 'low',
      status: 'completed',
      dueTime: '02:00 PM',
      category: 'documentation',
      assignedBy: 'System',
      createdAt: '2024-01-15 01:00 PM'
    }
  ];

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    patientName: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    dueTime: '',
    category: 'other' as 'medication' | 'vitals' | 'procedure' | 'documentation' | 'other'
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'in-progress':
        return 'bg-teal-100 text-teal-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'medication':
        return '💊';
      case 'vitals':
        return '❤️';
      case 'procedure':
        return '🔬';
      case 'documentation':
        return '📋';
      default:
        return '📌';
    }
  };

  const handleAddTask = () => {
    console.log('Adding task:', newTask);
    setShowAddTaskModal(false);
    setNewTask({
      title: '',
      description: '',
      patientName: '',
      priority: 'medium',
      dueTime: '',
      category: 'other'
    });
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.patientName && task.patientName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const highPriorityCount = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen sm:ml-64 mt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Task Management</h1>
            <p className="text-teal-100">Organize and track your daily nursing tasks</p>
          </div>
          <CheckSquare className="w-16 h-16 opacity-20" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{pendingCount}</span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium">Pending Tasks</h3>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{inProgressCount}</span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium">In Progress</h3>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{completedCount}</span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium">Completed Today</h3>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{highPriorityCount}</span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium">High Priority</h3>
        </div>
      </div>

      {/* Search, Filter and Add */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Task
          </button>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getCategoryIcon(task.category)}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadge(task.priority)}`}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(task.status)}`}>
                  {task.status === 'in-progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{task.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{task.description}</p>
              </div>

              {task.patientName && (
                <div className="bg-blue-50 rounded-lg p-3 space-y-1">
                  <div className="text-sm font-medium text-gray-900">{task.patientName}</div>
                  {task.bed && <div className="text-xs text-gray-600">{task.bed}</div>}
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{task.dueTime}</span>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Assigned by: {task.assignedBy}
              </div>

              {task.status !== 'completed' && (
                <div className="flex gap-2 pt-2 border-t">
                  {task.status === 'pending' && (
                    <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                      Start Task
                    </button>
                  )}
                  {task.status === 'in-progress' && (
                    <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
                      Mark Complete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
              <h2 className="text-2xl font-bold">Add New Task</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                <input
                  type="text"
                  placeholder="Enter task title..."
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  placeholder="Task description..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="medication">Medication</option>
                    <option value="vitals">Vital Signs</option>
                    <option value="procedure">Procedure</option>
                    <option value="documentation">Documentation</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="Patient name..."
                    value={newTask.patientName}
                    onChange={(e) => setNewTask({ ...newTask, patientName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Time</label>
                  <input
                    type="time"
                    value={newTask.dueTime}
                    onChange={(e) => setNewTask({ ...newTask, dueTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 p-6 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NurseTasks;
