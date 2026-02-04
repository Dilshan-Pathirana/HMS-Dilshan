import React, { useState } from 'react';
import AppointmentWizard from './AppointmentWizard';
import PatientMyAppointments from './PatientMyAppointments';
import NavBar from '../../UserWeb/NavBar';
import Footer from '../../UserWeb/Footer';

type TabType = 'book' | 'my-appointments';

const PatientAppointmentModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('my-appointments');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      
      <div className="flex-grow pt-20 pb-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Tabs */}
          <div className="flex space-x-4 mb-6">
            <button
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'my-appointments'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('my-appointments')}
            >
              My Appointments
            </button>
            <button
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'book'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('book')}
            >
              Book New Appointment
            </button>
          </div>

          {/* Content */}
          {activeTab === 'my-appointments' && (
            <PatientMyAppointments onBookNew={() => setActiveTab('book')} />
          )}
          {activeTab === 'book' && <AppointmentWizard />}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PatientAppointmentModule;
