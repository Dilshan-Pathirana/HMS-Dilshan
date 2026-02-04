import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BranchAdminMenuItems } from '../../../config/branchAdminNavigation';
import api from "../../../utils/api/axios";

interface BranchAdminSidebarProps {
    // Optional: pass in override menu items
    menuItems?: typeof BranchAdminMenuItems;
}

export const BranchAdminSidebar: React.FC<BranchAdminSidebarProps> = ({ menuItems }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [feedbackNotificationCount, setFeedbackNotificationCount] = useState(0);

    const items = menuItems || BranchAdminMenuItems;

    // Fetch unread feedback notifications count
    useEffect(() => {
        const fetchFeedbackNotificationCount = async () => {
            try {
                const userId = localStorage.getItem('userId');
                console.log('Fetching notifications for userId:', userId);
                if (userId) {
                    // Fetch notifications and count feedback type
                    const response = await api.get(`/branch-admin/notifications/${userId}`);
                    console.log('Notification API response:', response.data);
                    
                    if (response.data && response.data.status === 200 && response.data.notification) {
                        const notifications = response.data.notification.notifications || [];
                        // Count unread feedback notifications
                        const feedbackCount = notifications.filter(
                            (n: any) => n.notification_type === 'feedback' && n.notification_status === 'unread'
                        ).length;
                        console.log('Feedback notification count:', feedbackCount);
                        setFeedbackNotificationCount(feedbackCount);
                    } else {
                        setFeedbackNotificationCount(0);
                    }
                }
            } catch (error) {
                console.error('Error fetching feedback notification count:', error);
                setFeedbackNotificationCount(0);
            }
        };

        fetchFeedbackNotificationCount();
        // Poll every 30 seconds
        const interval = setInterval(fetchFeedbackNotificationCount, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <nav className="py-4">
            <div className="px-4 mb-4">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Navigation
                </h2>
            </div>
            <ul className="space-y-1 px-2">
                {items.map((item, index) => {
                    // Check if this is the Feedbacks menu item and has notifications
                    const isFeedbacksItem = item.label === 'Feedbacks';
                    const showBadge = isFeedbacksItem && feedbackNotificationCount > 0;

                    return (
                        <li key={index}>
                            <button
                                onClick={() => navigate(item.path)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all w-full ${
                                    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                                        ? 'bg-gradient-to-r from-emerald-100 to-blue-100 text-emerald-700'
                                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50'
                                }`}
                            >
                                <span className="flex-shrink-0 relative">
                                    {item.icon}
                                    {showBadge && (
                                        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white shadow-sm" />
                                    )}
                                </span>
                                <span className="flex-1 font-medium text-left">{item.label}</span>
                                {showBadge && (
                                    <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full min-w-[20px] text-center">
                                        {feedbackNotificationCount > 99 ? '99+' : feedbackNotificationCount}
                                    </span>
                                )}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};

export default BranchAdminSidebar;
