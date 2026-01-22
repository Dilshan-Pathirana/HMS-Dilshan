import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { LogOut, Settings, Bell, X, MessageSquare, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState, persistor } from '../../../store';
import { UserSignOut } from '../../../utils/api/user/UserSignOut';
import { getNotificationsByRole, markNotificationAsRead } from '../../../utils/api/notification/getNotifications';

interface Notification {
    id: string;
    notification_type: string;
    notification_message: string;
    notification_status: string;
    created_at?: string;
}

interface DashboardLayoutProps {
    children: ReactNode;
    userName: string;
    userRole: string;
    profileImage?: string;
    sidebarContent: ReactNode;
    branchName?: string;
    branchLogo?: string;
    userGender?: string;
}

// Default avatar SVGs for male and female
const MaleAvatar = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="50" fill="#E8F5E9"/>
        <circle cx="50" cy="35" r="18" fill="#4CAF50"/>
        <ellipse cx="50" cy="75" rx="28" ry="20" fill="#4CAF50"/>
        <circle cx="50" cy="35" r="15" fill="#FFCCBC"/>
        <rect x="42" y="48" width="16" height="8" fill="#FFCCBC"/>
        <path d="M35 30 Q50 15 65 30" fill="#4E342E" stroke="#4E342E" strokeWidth="2"/>
        <circle cx="44" cy="33" r="2" fill="#3E2723"/>
        <circle cx="56" cy="33" r="2" fill="#3E2723"/>
        <path d="M46 40 Q50 43 54 40" fill="none" stroke="#5D4037" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

const FemaleAvatar = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="50" fill="#FCE4EC"/>
        <circle cx="50" cy="35" r="18" fill="#E91E63"/>
        <ellipse cx="50" cy="75" rx="26" ry="20" fill="#E91E63"/>
        <circle cx="50" cy="35" r="15" fill="#FFCCBC"/>
        <rect x="43" y="48" width="14" height="7" fill="#FFCCBC"/>
        <path d="M30 35 Q30 15 50 15 Q70 15 70 35 Q70 25 50 30 Q30 25 30 35" fill="#4E342E"/>
        <path d="M32 35 Q35 45 40 40" fill="#4E342E"/>
        <path d="M68 35 Q65 45 60 40" fill="#4E342E"/>
        <circle cx="44" cy="33" r="2" fill="#3E2723"/>
        <circle cx="56" cy="33" r="2" fill="#3E2723"/>
        <path d="M46 40 Q50 43 54 40" fill="none" stroke="#C62828" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="38" cy="38" r="3" fill="#FFCDD2" opacity="0.6"/>
        <circle cx="62" cy="38" r="3" fill="#FFCDD2" opacity="0.6"/>
    </svg>
);

const DefaultAvatar = ({ gender }: { gender?: string }) => {
    if (gender?.toLowerCase() === 'female' || gender?.toLowerCase() === 'f') {
        return <FemaleAvatar />;
    }
    return <MaleAvatar />;
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    userName,
    userRole,
    profileImage,
    sidebarContent,
    branchName,
    branchLogo,
    userGender
}) => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const authState = useSelector((state: RootState) => state.auth);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    // Fetch notifications on component mount
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const userId = authState.userId || localStorage.getItem('userId');
                const roleNum = authState.userRole || parseInt(localStorage.getItem('userRole') || '0');
                
                if (userId && roleNum) {
                    const data = await getNotificationsByRole(userId.toString(), roleNum);
                    if (data && data.notification) {
                        setNotifications(data.notification.notifications || []);
                        setNotificationCount(data.notification.notification_count || 0);
                    }
                }
            } catch (error) {
                console.error('Error fetching notifications:', error);
            }
        };

        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [authState.userId, authState.userRole]);

    // Close notification dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            const roleNum = authState.userRole || parseInt(localStorage.getItem('userRole') || '0');
            await markNotificationAsRead(notificationId, roleNum);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            setNotificationCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleLogout = async () => {
        try {
            // Call logout API to clear session on server
            await dispatch(UserSignOut({ 
                accessToken: authState.userToken || localStorage.getItem('token') || '', 
                userRole: authState.userRole 
            }));
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Always clear local state regardless of API result
            localStorage.clear();
            // Purge redux-persist storage
            await persistor.purge();
            // Redirect to login page and reload
            window.location.href = '/login';
        }
    };

    const displayName = branchName || 'Hospital Management';
    const displayInitial = branchName ? branchName.charAt(0).toUpperCase() : 'H';

    // Helper function to get proper image URL
    const getImageUrl = (imagePath?: string): string => {
        if (!imagePath) return '';
        if (imagePath.startsWith('blob:')) return imagePath;
        if (imagePath.startsWith('http')) return imagePath;
        if (imagePath.startsWith('/storage')) return imagePath;
        return `/storage/${imagePath}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-white">
            {/* Top Navigation Bar */}
            <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
                            {branchLogo ? (
                                <img 
                                    src={getImageUrl(branchLogo)} 
                                    alt={displayName} 
                                    className="w-10 h-10 rounded-lg object-cover shadow-md"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
                                    {displayInitial}
                                </div>
                            )}
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                                    {displayName}
                                </h1>
                                <p className="text-xs text-gray-500">{userRole} Dashboard</p>
                            </div>
                        </a>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <div className="relative" ref={notificationRef}>
                            <button 
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Bell className="w-6 h-6 text-gray-600" />
                                {notificationCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                                        {notificationCount > 9 ? '9+' : notificationCount}
                                    </span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
                                    <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-blue-50">
                                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                                        {notificationCount > 0 && (
                                            <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                                                {notificationCount} new
                                            </span>
                                        )}
                                    </div>
                                    <div className="max-h-72 overflow-y-auto">
                                        {notifications.length > 0 ? (
                                            notifications.map((notification) => (
                                                <div 
                                                    key={notification.id} 
                                                    className="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2 rounded-full ${
                                                            notification.notification_type === 'feedback' 
                                                                ? 'bg-emerald-100 text-emerald-600' 
                                                                : 'bg-blue-100 text-blue-600'
                                                        }`}>
                                                            {notification.notification_type === 'feedback' ? (
                                                                <MessageSquare className="w-4 h-4" />
                                                            ) : (
                                                                <AlertCircle className="w-4 h-4" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-gray-800 line-clamp-2">
                                                                {notification.notification_message}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {notification.created_at 
                                                                    ? new Date(notification.created_at).toLocaleString() 
                                                                    : 'Just now'}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleMarkAsRead(notification.id)}
                                                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                            title="Dismiss"
                                                        >
                                                            <X className="w-4 h-4 text-gray-400" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-6 text-center text-gray-500">
                                                <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                                <p>No new notifications</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Settings */}
                        <button 
                            onClick={() => navigate('/profile/settings')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Settings className="w-6 h-6 text-gray-600" />
                        </button>

                        {/* User Profile */}
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                            <div className="text-right">
                                <p className="text-sm font-semibold text-gray-800">{userName}</p>
                                <p className="text-xs text-gray-500">{userRole}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center border-2 border-white shadow-md">
                                {profileImage ? (
                                    <img 
                                        src={getImageUrl(profileImage)} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    <DefaultAvatar gender={userGender} />
                                )}
                            </div>
                        </div>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-sm"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 min-h-[calc(100vh-73px)] bg-white shadow-lg border-r border-gray-200 flex-shrink-0">
                    {sidebarContent}
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4">
                    {children}
                </main>
            </div>
        </div>
    );
};
