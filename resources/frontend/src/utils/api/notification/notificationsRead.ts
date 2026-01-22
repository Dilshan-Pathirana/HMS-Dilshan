import axios from "axios";
export const markNotificationsAsRead = async (
    userRole: number,
    notifications: { id: string }[],
): Promise<void> => {
    try {
        let endpoint = "";

        if (userRole === 1) {
            endpoint = `/api/admin-user-notifications/mark-read`;
        } else if (userRole === 3) {
            endpoint = `/api/cashier-user-notifications/mark-read`;
        } else if (userRole === 4) {
            endpoint = `/api/pharmacist-user-notifications/mark-read`;
        }

        if (notifications.length > 0) {
            const notificationIds = notifications.map(
                (notification) => notification.id,
            );
            await axios.post(endpoint, { notification_ids: notificationIds });
        }
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        throw error;
    }
};
