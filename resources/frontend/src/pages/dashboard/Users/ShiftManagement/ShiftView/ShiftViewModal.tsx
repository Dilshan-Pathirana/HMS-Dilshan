import {ShiftViewModalProps} from "../../../../../utils/types/Dashboard/StaffAndUser/IShift.ts";

const ShiftViewModal: React.FC<ShiftViewModalProps> = ({ isOpen, notes, days, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
                <h2 className="text-lg font-semibold mb-4">Details</h2>
                <div>
                    <strong>Notes:</strong>
                    <p className="mt-2">{notes}</p>
                </div>
                <div className="mt-4">
                    <strong>Days:</strong>
                    <ul className="list-disc list-inside mt-2">
                        {days.map((day, index) => (
                            <li key={index}>{day}</li>
                        ))}
                    </ul>
                </div>
                <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default ShiftViewModal;
