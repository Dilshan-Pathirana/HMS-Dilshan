import { useState } from "react";
import UserTable from "./UserView/UserTable.tsx";
import UsersTab from "../../../../components/dashboard/sideBar/users/UsersTab.tsx";
import { X } from "lucide-react";

const UserManagement = () => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleAddUserClick = () => {
        setShowCreateModal(true);
    };

    const handleCloseModal = () => {
        setShowCreateModal(false);
    };

    const handleUserCreated = () => {
        setShowCreateModal(false);
        setRefreshKey(prev => prev + 1); // Trigger refresh of user table
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">User Management</h1>
                <button
                    onClick={handleAddUserClick}
                    className="px-6 py-2 bg-primary-500 rounded-lg hover:bg-primary-600 text-white"
                >
                    Add User
                </button>
            </div>
            <div className="overflow-x-auto max-h-[calc(100vh-200px)]">
                <UserTable key={refreshKey} />
            </div>

            {/* Add User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
                        <div className="sticky top-0 bg-white p-4 border-b border-neutral-200 flex justify-between items-center z-10">
                            <h2 className="text-xl font-bold text-neutral-900">Add New User</h2>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-neutral-500" />
                            </button>
                        </div>
                        <div className="p-2">
                            <UsersTab onUserCreated={handleUserCreated} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
