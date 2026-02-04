import { FaUserMd } from "react-icons/fa";
import { SelectAvailableSlotsProps } from "../../../../utils/types/Appointment/IDoctorSchedule.ts";

export const SelectAvailableSlots = ({
    allSlotsChild = [],
    bookedSlots,
    selectedSlot,
    originalSlot,
    isOriginalDate,
    hoveredOriginalSlot,
}: SelectAvailableSlotsProps) => {
    const bookedSlotNumbers = bookedSlots.map(Number);

    return (
        <div>
            <h4 className="text-lg font-semibold m-2 text-gray-800">
                Available Slots
            </h4>
            <div className="overflow-y-auto max-h-60 border border-gray-300 rounded-md p-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                    {allSlotsChild.map((slot) => {
                        const isBooked = bookedSlotNumbers.includes(slot);
                        const isOriginalSlot =
                            isOriginalDate && slot === originalSlot;
                        const isSelected = slot === selectedSlot;

                        return (
                            <div key={slot} className="relative">
                                {hoveredOriginalSlot === slot && (
                                    <div className="absolute -bottom-5 left-0 right-0 bg-blue-100 text-blue-800 text-xs text-center py-1 rounded">
                                        Your Current Slot
                                    </div>
                                )}
                                <button
                                    className={`flex flex-col items-center py-2 px-4 rounded-md shadow-md text-sm font-semibold transition w-full ${
                                        isOriginalSlot
                                            ? "bg-blue-200 text-blue-800 border-2 border-blue-300 hover:bg-blue-300"
                                            : isBooked
                                              ? "bg-yellow-200 text-gray-600 cursor-not-allowed"
                                              : isSelected
                                                ? "bg-red-600 text-white"
                                                : "bg-gray-50 text-gray-800 hover:bg-blue-500 hover:text-white"
                                    }`}
                                    disabled={isBooked && !isOriginalSlot}
                                >
                                    <div className="flex items-center justify-center space-x-2 mb-2">
                                        <FaUserMd
                                            className={`text-2xl ${
                                                isOriginalSlot
                                                    ? "text-blue-600"
                                                    : isBooked
                                                      ? "text-yellow-600"
                                                      : isSelected
                                                        ? "text-white"
                                                        : "text-green-500"
                                            }`}
                                        />
                                        <span
                                            className={`text-sm font-medium ${
                                                isSelected
                                                    ? "text-white"
                                                    : isOriginalSlot
                                                      ? "text-blue-800"
                                                      : isBooked
                                                        ? "text-gray-600"
                                                        : "text-gray-800"
                                            }`}
                                        >
                                            No.{slot}
                                        </span>
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
export default SelectAvailableSlots;
