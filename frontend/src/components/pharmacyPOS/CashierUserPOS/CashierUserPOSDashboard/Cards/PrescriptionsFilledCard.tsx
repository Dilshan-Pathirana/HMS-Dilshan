const PrescriptionsFilledCard = () => {
    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between pb-2">
                <span className="text-sm font-medium">
                    Prescriptions Filled
                </span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-neutral-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                >
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
            <div className="text-2xl font-bold">892</div>
            <p className="text-xs text-neutral-400">48 pending review</p>
        </div>
    );
};

export default PrescriptionsFilledCard;
