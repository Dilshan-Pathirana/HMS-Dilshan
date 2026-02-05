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
            endpoint = `/notifications/branch-admin/${userId}`;
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

    let endpoint = "";

    switch (userRole) {
        case 2: // Branch Admin
            endpoint = `/notifications/branch-admin/unread-count`;
            break;
        case 3: // Doctor
            endpoint = `/notifications/doctor/unread-count/${userId}`;
            break;
        case 6: // Receptionist
            endpoint = `/notifications/receptionist/unread-count/${userId}`;
            break;
        case 7: // Patient
            endpoint = `/notifications/patient/unread-count/${userId}`;
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
            endpoint = `/notifications/admin/mark-read`;
            break;
        case 2: // Branch Admin
            endpoint = `/notifications/branch-admin/mark-read`;
            break;
        case 3: // Doctor
            endpoint = `/notifications/doctor/mark-read`;
            break;
        case 4: // Nurse
            endpoint = `/notifications/nurse/mark-read`;
            break;
        case 5: // Patient
            endpoint = `/notifications/patient/mark-read`;
            break;
        case 6: // Cashier
            endpoint = `/notifications/cashier/mark-read`;
            break;
        case 7: // Pharmacist
            endpoint = `/notifications/pharmacist/mark-read`;
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
