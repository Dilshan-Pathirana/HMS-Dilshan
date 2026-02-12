import React, { useState } from 'react';
import { LogOut, Settings, Bell, Menu, ChevronDown, User, Building2, LayoutDashboard, Pill, Home } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState, persistor } from '../../../../store';
import { UserSignOut } from '../../../../utils/api/user/UserSignOut';
import { useUserRole } from '../../../../utils/state/checkAuthenticatedUserStates';
import { useBranchContext } from '../../../../context/POS/BranchContext';

interface ModernPOSNavbarProps {
    toggleSidebar?: () => void;
}

// Default avatar SVGs
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
        <circle cx="44" cy="33" r="2" fill="#3E2723"/>
        <circle cx="56" cy="33" r="2" fill="#3E2723"/>
        <path d="M46 40 Q50 43 54 40" fill="none" stroke="#C62828" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

const DefaultAvatar = ({ gender }: { gender?: string }) => {
    if (gender?.toLowerCase() === 'female' || gender?.toLowerCase() === 'f') {
        return <FemaleAvatar />;
    }
    return <MaleAvatar />;
};

const ModernPOSNavbar: React.FC<ModernPOSNavbarProps> = ({ toggleSidebar }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const authState = useSelector((state: RootState) => state.auth);
    const userRole = useUserRole();
    const { selectedBranch } = useBranchContext();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // Get user info from localStorage
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = userInfo.name || 'User';
    const userEmail = userInfo.email || '';
    const userGender = userInfo.gender || '';
    const profileImage = userInfo.profile_picture || '';
    const branchName = selectedBranch?.pharmacy_name || authState.branchName || userInfo.branch?.pharmacy_name || userInfo.branch?.center_name || 'POS System';

    const getRoleName = () => {
        switch (userRole) {
            case 1: return 'Super Admin';
            case 2: return 'Branch Admin';
            case 3: return 'Doctor';
            case 4: return 'Nurse';
            case 5: return 'Patient';
            case 6: return 'Cashier';
            case 7: return 'Pharmacist';
            case 8: return 'IT Support';
            case 9: return 'Pharmacy Aid';
            case 10: return 'Auditor';
            default: return 'User';
        }
    };

    const handleLogout = async () => {
        try {
            await dispatch(UserSignOut({
                accessToken: authState.userToken || localStorage.getItem('token') || '',
                userRole: authState.userRole
            }));
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            localStorage.clear();
            await persistor.purge();
            window.location.href = '/login';
        }
    };

    const getImageUrl = (imagePath?: string): string => {
        if (!imagePath) return '';
        if (imagePath.startsWith('blob:')) return imagePath;
        if (imagePath.startsWith('http')) return imagePath;
        if (imagePath.startsWith('/storage')) return imagePath;
        return `/storage/${imagePath}`;
    };

    return (
        <nav className="bg-white shadow-md border-b border-neutral-200 h-16">
            <div className="h-full px-4 lg:px-6 flex items-center justify-between">
                {/* Left Section */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                        <Menu className="w-5 h-5 text-neutral-600" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-primary-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {branchName.charAt(0).toUpperCase()}
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                                {branchName}
                            </h1>
                            <p className="text-xs text-neutral-500">POS Management</p>
                        </div>
                    </div>
                </div>

                {/* Center Section - Quick Navigation (Desktop) */}
                <div className="hidden lg:flex items-center gap-2">
                    {userRole === 1 && (
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Admin Dashboard
                        </Link>
                    )}
                    {userRole === 2 && (
                        <Link
                            to="/branch-admin/dashboard"
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200"
                        >
                            <Building2 className="w-4 h-4" />
                            Branch Dashboard
                        </Link>
                    )}
                    {(userRole === 1 || userRole === 7) && (
                        <Link
                            to="/pharmacy-dashboard"
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200"
                        >
                            <Pill className="w-4 h-4" />
                            Pharmacy
                        </Link>
                    )}
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-2 lg:gap-4">
                    <Link
                        to="/"
                        className="hidden sm:flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        <span className="text-sm font-medium">Home</span>
                    </Link>
                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                            <Bell className="w-5 h-5 text-neutral-600" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full"></span>
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
                                <div className="p-4 border-b border-gray-100">
                                    <h3 className="font-semibold text-neutral-800">Notifications</h3>
                                </div>
                                <div className="p-4 text-center text-neutral-500 text-sm">
                                    No new notifications
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Settings */}
                    <button
                        onClick={() => navigate('/pos/settings')}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors hidden sm:block"
                    >
                        <Settings className="w-5 h-5 text-neutral-600" />
                    </button>
                    <button
                        onClick={handleLogout}
                        className="hidden sm:flex items-center gap-2 px-3 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Logout</span>
                    </button>

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 pl-3 pr-2 py-1.5 border border-neutral-200 rounded-full hover:bg-neutral-50 transition-colors"
                        >
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium text-neutral-800 max-w-[120px] truncate">{userName}</p>
                                <p className="text-xs text-neutral-500">{getRoleName()}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center border-2 border-white shadow-sm">
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
                            <ChevronDown className="w-4 h-4 text-neutral-400 hidden sm:block" />
                        </button>

                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                                <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-gray-100">
                                    <p className="font-semibold text-neutral-800">{userName}</p>
                                    <p className="text-xs text-neutral-500">{userEmail}</p>
                                    <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                                        {getRoleName()}
                                    </span>
                                </div>

                                <div className="p-2">
                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false);
                                            // Route to POS profile for cashiers and pharmacists
                                            if (userRole === 6 || userRole === 7) {
                                                navigate('/pos/profile');
                                            } else if (userRole === 2) {
                                                navigate('/branch-admin/profile');
                                            } else {
                                                navigate('/profile');
                                            }
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                                    >
                                        <User className="w-4 h-4" />
                                        My Profile
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false);
                                            navigate('/pos/settings');
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Settings
                                    </button>
                                </div>

                                <div className="p-2 border-t border-gray-100">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Click outside to close menus */}
            {(showUserMenu || showNotifications) && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => {
                        setShowUserMenu(false);
                        setShowNotifications(false);
                    }}
                />
            )}
        </nav>
    );
};

export default ModernPOSNavbar;
