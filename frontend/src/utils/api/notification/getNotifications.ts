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
            endpoint = `/api/v1/notifications/admin/${userId}`;
            break;
        case 2: // Branch Admin
            endpoint = `/api/v1/notifications/branch-admin/${userId}`;
            break;
        case 3: // Doctor
            endpoint = `/api/v1/notifications/doctor/${userId}`;
            break;
        case 4: // Nurse
            endpoint = `/api/v1/notifications/nurse/${userId}`;
            break;
        case 5: // Patient
            endpoint = `/api/v1/notifications/patient/${userId}`;
            break;
        case 6: // Cashier
            endpoint = `/api/v1/notifications/cashier/${userId}`;
            break;
        case 7: // Pharmacist
            endpoint = `/api/v1/notifications/pharmacist/${userId}`;
            break;
        default:
            // Fallback for unhandled roles - use generic endpoint
            endpoint = `/api/v1/notifications/${userId}`;
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

    let endpoint = "";

    switch (userRole) {
        case 2: // Branch Admin
            endpoint = `/api/v1/notifications/branch-admin/unread-count`;
            break;
        case 3: // Doctor
            endpoint = `/api/v1/notifications/doctor/unread-count/${userId}`;
            break;
        case 6: // Receptionist
            endpoint = `/api/v1/notifications/receptionist/unread-count/${userId}`;
            break;
        case 7: // Patient
            endpoint = `/api/v1/notifications/patient/unread-count/${userId}`;
            break;
        default:
            return 0;
    }

    try {
        const response = await api.get(endpoint);
        return response.data?.unread_count || response.data?.count || 0;
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
    let endpoint = "";

    switch (userRole) {
        case 1: // Super Admin
            endpoint = `/api/v1/notifications/admin/mark-read`;
            break;
        case 2: // Branch Admin
            endpoint = `/api/v1/notifications/branch-admin/mark-read`;
            break;
        case 3: // Doctor
            endpoint = `/api/v1/notifications/doctor/mark-read`;
            break;
        case 4: // Nurse
            endpoint = `/api/v1/notifications/nurse/mark-read`;
            break;
        case 5: // Patient
            endpoint = `/api/v1/notifications/patient/mark-read`;
            break;
        case 6: // Cashier
            endpoint = `/api/v1/notifications/cashier/mark-read`;
            break;
        case 7: // Pharmacist
            endpoint = `/api/v1/notifications/pharmacist/mark-read`;
            break;
        default:
            return false;
    }

    try {
        await api.post(endpoint, { notification_ids: [notificationId] });
        return true;
    } catch {
        return false;
    }
};
