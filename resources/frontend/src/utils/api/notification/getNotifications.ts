import axios from "axios";

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
            endpoint = `/api/get-admin-user-notifications/${userId}`;
            break;
        case 2: // Branch Admin
            endpoint = `/api/branch-admin/notifications/${userId}`;
            break;
        case 3: // Doctor
            endpoint = `/api/doctor/notifications/${userId}`;
            break;
        case 4: // Nurse
            endpoint = `/api/nurse/notifications/${userId}`;
            break;
        case 5: // Patient
            endpoint = `/api/patient/notifications/${userId}`;
            break;
        case 6: // Cashier
            endpoint = `/api/get-cashier-user-notifications/${userId}`;
            break;
        case 7: // Pharmacist
            endpoint = `/api/get-pharmacist-user-notifications/${userId}`;
            break;
        default:
            // Fallback for unhandled roles - use generic endpoint
            endpoint = `/api/notifications/${userId}`;
    }

    return await axios.get(endpoint).then((response) => response.data);
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
            endpoint = `/api/branch-admin/notifications-count`;
            break;
        case 3: // Doctor
            endpoint = `/api/doctor/notifications/unread-count/${userId}`;
            break;
        case 6: // Receptionist
            endpoint = `/api/receptionist/notifications/unread-count/${userId}`;
            break;
        case 7: // Patient
            endpoint = `/api/patient/notifications/unread-count/${userId}`;
            break;
        default:
            return 0;
    }

    try {
        const response = await axios.get(endpoint);
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
            endpoint = `/api/admin-user-notifications/mark-read`;
            break;
        case 2: // Branch Admin
            endpoint = `/api/branch-admin/notifications/mark-read`;
            break;
        case 3: // Doctor
            endpoint = `/api/doctor/notifications/mark-read`;
            break;
        case 4: // Nurse
            endpoint = `/api/nurse/notifications/mark-read`;
            break;
        case 5: // Patient
            endpoint = `/api/patient/notifications/mark-read`;
            break;
        case 6: // Cashier
            endpoint = `/api/cashier-user-notifications/mark-read`;
            break;
        case 7: // Pharmacist
            endpoint = `/api/pharmacist-user-notifications/mark-read`;
            break;
        default:
            return false;
    }

    try {
        await axios.post(endpoint, { notification_ids: [notificationId] });
        return true;
    } catch {
        return false;
    }
};
