import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import {
    Bell,
    Calendar,
    FileText,
    Pill,
    MessageSquare,
    AlertCircle,
    CheckCircle,
    Clock,
    Trash2,
    Check,
    Settings,
    Filter,
    X
} from 'lucide-react';
import api from "../../../utils/api/axios";

interface Notification {
    id: string;
    type: 'appointment' | 'report' | 'medication' | 'general' | 'reminder' | 'alert';
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    action_url?: string;
    priority: 'low' | 'medium' | 'high';
}

const PatientNotifications: React.FC = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [showSettings, setShowSettings] = useState(false);

    // Notification preferences
    const [preferences, setPreferences] = useState({
        appointment_reminders: true,
        lab_results: true,
        medication_reminders: true,
        promotional: false,
        email_notifications: true,
        sms_notifications: false
    });

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await api.get(`/patient/notifications/${userId}`);
                const items = response.data?.notifications || [];
                setNotifications(items);
            } catch (error) {
                // Mock data for demo
                setNotifications([
                    {
                        id: '1',
                        type: 'appointment',
                        title: 'Appointment Reminder',
                        message: 'Your appointment with Dr. Sarah Johnson is tomorrow at 10:00 AM at Main Hospital - City Center.',
                        is_read: false,
                        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                        priority: 'high'
                    },
                    {
                        id: '2',
                        type: 'report',
                        title: 'Lab Results Available',
                        message: 'Your blood test results from January 15 are now available. Please check your medical records.',
                        is_read: false,
                        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                        priority: 'medium'
                    },
                    {
                        id: '3',
                        type: 'medication',
                        title: 'Medication Reminder',
                        message: 'Time to take your Metformin (500mg). Remember to take it with your meal.',
                        is_read: true,
                        created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
                        priority: 'medium'
                    },
                    {
                        id: '4',
                        type: 'general',
                        title: 'Health Tip of the Day',
                        message: 'Stay hydrated! Aim to drink at least 8 glasses of water daily for optimal health.',
                        is_read: true,
                        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                        priority: 'low'
                    },
                    {
                        id: '5',
                        type: 'reminder',
                        title: 'Prescription Refill Needed',
                        message: 'Your Lisinopril prescription will run out in 5 days. Please contact your doctor for a refill.',
                        is_read: false,
                        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                        priority: 'high'
                    },
                    {
                        id: '6',
                        type: 'appointment',
                        title: 'Appointment Confirmed',
                        message: 'Your appointment with Dr. Michael Chen on January 25 at 2:30 PM has been confirmed.',
                        is_read: true,
                        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                        priority: 'medium'
                    },
                    {
                        id: '7',
                        type: 'alert',
                        title: 'Important: Health Advisory',
                        message: 'Flu season is here. Consider getting your flu vaccination at any of our clinics.',
                        is_read: true,
                        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                        priority: 'medium'
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchNotifications();
        }
    }, [userId]);

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/patient/notifications/${id}/read`);
        } catch (error) {
            // Continue with local update
        }
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, is_read: true } : n
        ));
    };

    const markAllAsRead = async () => {
        try {
            await api.put(`/patient/notifications/mark-all-read`, { user_id: userId });
        } catch (error) {
            // Continue with local update
        }
        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    };

    const deleteNotification = async (id: string) => {
        try {
            await api.delete(`/patient/notifications/${id}`);
        } catch (error) {
            // Continue with local update
        }
        setNotifications(notifications.filter(n => n.id !== id));
    };

    const clearAllRead = async () => {
        if (!confirm('Clear all read notifications?')) return;
        try {
            await api.delete(`/patient/notifications/clear-read`, { data: { user_id: userId } });
        } catch (error) {
            // Continue with local update
        }
        setNotifications(notifications.filter(n => !n.is_read));
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'appointment': return Calendar;
            case 'report': return FileText;
            case 'medication': return Pill;
            case 'reminder': return Clock;
            case 'alert': return AlertCircle;
            default: return Bell;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'appointment': return 'bg-blue-100 text-primary-500';
            case 'report': return 'bg-purple-100 text-purple-600';
            case 'medication': return 'bg-green-100 text-green-600';
            case 'reminder': return 'bg-orange-100 text-orange-600';
            case 'alert': return 'bg-error-100 text-error-600';
            default: return 'bg-neutral-100 text-neutral-600';
        }
    };

    const getPriorityIndicator = (priority: string) => {
        switch (priority) {
            case 'high': return 'border-l-4 border-l-red-500';
            case 'medium': return 'border-l-4 border-l-yellow-500';
            default: return 'border-l-4 border-l-gray-300';
        }
    };

    const formatTimeAgo = (date: string) => {
        const now = new Date();
        const then = new Date(date);
        const diffMs = now.getTime() - then.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesReadFilter =
            filter === 'all' ||
            (filter === 'unread' && !n.is_read) ||
            (filter === 'read' && n.is_read);
        const matchesTypeFilter = typeFilter === 'all' || n.type === typeFilter;
        return matchesReadFilter && matchesTypeFilter;
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-800">Notifications</h1>
                    <p className="text-neutral-500">
                        {unreadCount > 0
                            ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                            : 'You\'re all caught up!'
                        }
                    </p>
                </div>
                <button
                    onClick={() => setShowSettings(true)}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Notification Settings"
                >
                    <Settings className="w-6 h-6 text-neutral-500" />
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Bell className="w-5 h-5 text-primary-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-neutral-800">{notifications.length}</p>
                            <p className="text-xs text-neutral-500">Total</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-error-50 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-error-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-error-600">{unreadCount}</p>
                            <p className="text-xs text-neutral-500">Unread</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">
                                {notifications.filter(n => n.is_read).length}
                            </p>
                            <p className="text-xs text-neutral-500">Read</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-orange-600">
                                {notifications.filter(n => n.priority === 'high' && !n.is_read).length}
                            </p>
                            <p className="text-xs text-neutral-500">Urgent</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Actions Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex flex-wrap gap-2">
                        {/* Read/Unread Filter */}
                        <div className="flex gap-1 bg-neutral-100 rounded-lg p-1">
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'unread', label: 'Unread' },
                                { key: 'read', label: 'Read' }
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setFilter(tab.key as any)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                        filter === tab.key
                                            ? 'bg-white text-neutral-800 shadow-sm'
                                            : 'text-neutral-600 hover:text-neutral-800'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Type Filter */}
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="all">All Types</option>
                            <option value="appointment">Appointments</option>
                            <option value="report">Reports</option>
                            <option value="medication">Medications</option>
                            <option value="reminder">Reminders</option>
                            <option value="alert">Alerts</option>
                            <option value="general">General</option>
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                                <Check className="w-4 h-4" />
                                Mark all as read
                            </button>
                        )}
                        {notifications.some(n => n.is_read) && (
                            <button
                                onClick={clearAllRead}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Clear read
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            {filteredNotifications.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-neutral-800 mb-2">No notifications</h3>
                    <p className="text-neutral-500">
                        {filter === 'unread'
                            ? 'You have no unread notifications'
                            : 'You have no notifications yet'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredNotifications.map((notification) => {
                        const IconComponent = getTypeIcon(notification.type);
                        return (
                            <div
                                key={notification.id}
                                className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${getPriorityIndicator(notification.priority)} ${
                                    !notification.is_read ? 'bg-blue-50/30' : ''
                                }`}
                            >
                                <div className="p-4">
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className={`p-2 rounded-lg flex-shrink-0 ${getTypeColor(notification.type)}`}>
                                            <IconComponent className="w-5 h-5" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className={`font-medium ${!notification.is_read ? 'text-neutral-900' : 'text-neutral-700'}`}>
                                                        {notification.title}
                                                        {!notification.is_read && (
                                                            <span className="ml-2 inline-block w-2 h-2 bg-primary-500 rounded-full"></span>
                                                        )}
                                                    </h3>
                                                    <p className="text-sm text-neutral-600 mt-1">{notification.message}</p>
                                                    <p className="text-xs text-neutral-400 mt-2">
                                                        {formatTimeAgo(notification.created_at)}
                                                    </p>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    {!notification.is_read && (
                                                        <button
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="p-1.5 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                            title="Mark as read"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deleteNotification(notification.id)}
                                                        className="p-1.5 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-neutral-800">Notification Settings</h2>
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-neutral-500" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Notification Types */}
                            <div>
                                <h3 className="font-medium text-neutral-800 mb-4">Notification Types</h3>
                                <div className="space-y-3">
                                    {[
                                        { key: 'appointment_reminders', label: 'Appointment Reminders', desc: 'Get reminders before your appointments' },
                                        { key: 'lab_results', label: 'Lab Results', desc: 'Be notified when lab results are ready' },
                                        { key: 'medication_reminders', label: 'Medication Reminders', desc: 'Receive medication reminders' },
                                        { key: 'promotional', label: 'Health Tips & Updates', desc: 'Receive health tips and hospital updates' }
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-neutral-700">{item.label}</p>
                                                <p className="text-xs text-neutral-500">{item.desc}</p>
                                            </div>
                                            <button
                                                onClick={() => setPreferences(prev => ({
                                                    ...prev,
                                                    [item.key]: !prev[item.key as keyof typeof prev]
                                                }))}
                                                className={`relative w-11 h-6 rounded-full transition-colors ${
                                                    preferences[item.key as keyof typeof preferences]
                                                        ? 'bg-emerald-500'
                                                        : 'bg-neutral-300'
                                                }`}
                                            >
                                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                                    preferences[item.key as keyof typeof preferences]
                                                        ? 'translate-x-5'
                                                        : 'translate-x-0.5'
                                                }`}></div>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Delivery Methods */}
                            <div className="pt-4 border-t border-gray-100">
                                <h3 className="font-medium text-neutral-800 mb-4">Delivery Methods</h3>
                                <div className="space-y-3">
                                    {[
                                        { key: 'email_notifications', label: 'Email Notifications' },
                                        { key: 'sms_notifications', label: 'SMS Notifications' }
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between">
                                            <p className="font-medium text-neutral-700">{item.label}</p>
                                            <button
                                                onClick={() => setPreferences(prev => ({
                                                    ...prev,
                                                    [item.key]: !prev[item.key as keyof typeof prev]
                                                }))}
                                                className={`relative w-11 h-6 rounded-full transition-colors ${
                                                    preferences[item.key as keyof typeof preferences]
                                                        ? 'bg-emerald-500'
                                                        : 'bg-neutral-300'
                                                }`}
                                            >
                                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                                    preferences[item.key as keyof typeof preferences]
                                                        ? 'translate-x-5'
                                                        : 'translate-x-0.5'
                                                }`}></div>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                Save Preferences
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientNotifications;
