import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import {
    Bell,
    Check,
    CheckCheck,
    Clock,
    AlertCircle,
    Calendar,
    TestTube,
    MessageSquare,
    User,
    Loader2,
    Settings,
    Filter,
    Trash2
} from 'lucide-react';
import api from "../../../utils/api/axios";

interface Notification {
    id: string;
    type: 'appointment' | 'lab_result' | 'message' | 'system' | 'urgent';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    action_url?: string;
}

const DoctorNotifications: React.FC = () => {
    const userId = useSelector((state: RootState) => state.auth.userId);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');

    useEffect(() => {
        fetchNotifications();
    }, [userId]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            // API call
            setNotifications([]);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.post(`/notifications/${id}/read`);
            setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'appointment':
                return <Calendar className="w-5 h-5 text-blue-500" />;
            case 'lab_result':
                return <TestTube className="w-5 h-5 text-purple-500" />;
            case 'message':
                return <MessageSquare className="w-5 h-5 text-green-500" />;
            case 'urgent':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.read;
        if (filter === 'urgent') return n.type === 'urgent';
        return true;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
                    <p className="text-gray-500">
                        {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'All caught up!'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={markAllAsRead}
                        disabled={unreadCount === 0}
                        className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Mark all as read
                    </button>
                    <button
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex gap-2">
                    {[
                        { key: 'all', label: 'All', count: notifications.length },
                        { key: 'unread', label: 'Unread', count: unreadCount },
                        { key: 'urgent', label: 'Urgent', count: notifications.filter(n => n.type === 'urgent').length }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                filter === tab.key
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                                    filter === tab.key ? 'bg-blue-500' : 'bg-gray-200'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notifications List */}
            {filteredNotifications.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No notifications</h3>
                    <p className="text-gray-500">
                        {filter === 'unread' 
                            ? "You've read all your notifications"
                            : filter === 'urgent'
                                ? "No urgent notifications"
                                : "You're all caught up!"}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                    {filteredNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`p-4 hover:bg-gray-50 transition-colors ${
                                !notification.read ? 'bg-blue-50/30' : ''
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg ${
                                    notification.type === 'urgent' ? 'bg-red-100' :
                                    notification.type === 'appointment' ? 'bg-blue-100' :
                                    notification.type === 'lab_result' ? 'bg-purple-100' :
                                    notification.type === 'message' ? 'bg-green-100' :
                                    'bg-gray-100'
                                }`}>
                                    {getNotificationIcon(notification.type)}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                            {notification.title}
                                        </h4>
                                        {!notification.read && (
                                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-400">{notification.timestamp}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    {!notification.read && (
                                        <button
                                            onClick={() => markAsRead(notification.id)}
                                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
                                            title="Mark as read"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteNotification(notification.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Notification Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                    {[
                        { label: 'Appointment reminders', description: 'Get notified before scheduled appointments', enabled: true },
                        { label: 'Lab results', description: 'Notify when lab results are available', enabled: true },
                        { label: 'Patient messages', description: 'Receive messages from patients', enabled: true },
                        { label: 'System updates', description: 'Important system announcements', enabled: false }
                    ].map((pref, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2">
                            <div>
                                <p className="font-medium text-gray-700">{pref.label}</p>
                                <p className="text-sm text-gray-500">{pref.description}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked={pref.enabled} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DoctorNotifications;
