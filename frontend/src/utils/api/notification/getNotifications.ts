import api from "../axios";

/**
 * Role constants for notification endpoints
 * role_as values: 1=SuperAdmin, 2=BranchAdmin, 3=Doctor, 4=Nurse, 5=Patient, 6=Cashier, 7=Pharmacist
 */
export const getNotificationsByRole = async (
    userId: string,
    userRole: number,
) => {
    if (!userId) {
        throw new Error("User ID is required.");
    }

    let endpoint = "";

    switch (userRole) {
        case 1: // Super Admin
            endpoint = `/notifications/admin/${userId}`;
            break;
        case 2: // Branch Admin
            // FIXED: Match backend endpoint /api/v1/branch-admin/notifications/{user_id}
            endpoint = `/branch-admin/notifications/${userId}`;
            break;
        case 3: // Doctor
            endpoint = `/notifications/doctor/${userId}`;
            break;
        case 4: // Nurse
            endpoint = `/notifications/nurse/${userId}`;
            break;
        case 5: // Patient
            endpoint = `/notifications/patient/${userId}`;
            break;
        case 6: // Cashier
            endpoint = `/notifications/cashier/${userId}`;
            break;
        case 7: // Pharmacist
            endpoint = `/notifications/pharmacist/${userId}`;
            break;
        default:
            // Fallback for unhandled roles - use generic endpoint
            endpoint = `/notifications/${userId}`;
    }

    return await api.get(endpoint).then((response) => response.data);
};

/**
 * Get unread notification count for a user
 */
export const getUnreadNotificationCount = async (
    userId: string,
    userRole: number,
): Promise<number> => {
    if (!userId) {
        return 0;
    }

    // Backend exposes a generic per-user endpoint (no role-specific routes required).
    // See backend: GET /api/v1/notifications/unread-count
    const endpoint = `/notifications/unread-count`;

    try {
        const response = await api.get(endpoint);
        return response.data?.unread || 0;
    } catch {
        return 0;
    }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
    notificationId: string,
    userRole: number,
): Promise<boolean> => {
    // FIXED: Use generic endpoint for all roles as backend supports it at /api/v1/notifications/{id}/read
    const endpoint = `/notifications/${notificationId}/read`;

    try {
        await api.put(endpoint);
        return true;
    } catch {
        return false;
    }
};
