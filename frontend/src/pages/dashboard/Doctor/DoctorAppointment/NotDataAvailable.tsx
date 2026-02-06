const NotDataAvailable = () => {
    return (
        <div className="flex flex-col items-center justify-center p-6">
            <div className="w-16 h-16 text-blue-400 mb-4">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-700 dark:text-gray-300 mb-2">
                No schedules available
            </h3>
            <div className="flex justify-center space-x-4 w-full"></div>
        </div>
    );
};

export default NotDataAvailable;
