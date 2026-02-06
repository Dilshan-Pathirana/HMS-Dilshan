import React from "react";
import { NotificationModalProps } from "../../../utils/types/notification/Inotification.ts";

const NotificationModal: React.FC<NotificationModalProps> = ({
    notifications,
}) => {
    return (
        <div className="absolute right-0 top-10 w-72 bg-white divide-y divide-gray-100 rounded shadow dark:bg-gray-700 dark:divide-gray-600">
            <div className="px-4 py-3">
                <p className="text-sm font-medium text-neutral-700 dark:text-white">
                    Notifications
                </p>
            </div>
            <ul className="py-1">
                {notifications.length > 0 ? (
                    notifications.map((notification) => (
                        <li
                            key={notification.id}
                            className="px-4 py-2 hover:bg-neutral-100 dark:hover:bg-gray-600"
                        >
                            <p className="text-sm text-neutral-900 dark:text-white">
                                {notification.notification_message}
                            </p>
                        </li>
                    ))
                ) : (
                    <li className="px-4 py-2">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            No new notifications.
                        </p>
                    </li>
                )}
            </ul>
        </div>
    );
};

export default NotificationModal;
