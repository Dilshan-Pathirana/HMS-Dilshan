export type Notification = {
    id: string;
    user_id: string;
    notification_type: string;
    notification_message: string;
    notification_status: string;
};

export type NotificationModalProps = {
    notifications: Notification[];
};
