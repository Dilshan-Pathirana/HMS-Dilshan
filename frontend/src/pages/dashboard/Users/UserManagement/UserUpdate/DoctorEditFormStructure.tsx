import React from "react";

const DoctorEditFormStructure: React.FC<{
    userDetails: { photo?: string; nic_photo?: string };
}> = ({ userDetails }) => {
    return (
        <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-200">
                <h3 className="text-sm font-medium text-neutral-700 mb-3">
                    Profile Photo
                </h3>
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <div className="h-24 w-24 rounded-full bg-neutral-100 overflow-hidden border-2 border-neutral-300 flex items-center justify-center">
                            {userDetails?.photo ? (
                                <img
                                    src={userDetails.photo}
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <svg
                                    className="h-12 w-12 text-neutral-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            <input type="file" className="sr-only" />
                            Change Photo
                        </label>
                        {userDetails?.photo && (
                            <button className="ml-2 text-sm text-error-600 hover:text-red-800">
                                Remove
                            </button>
                        )}
                    </div>
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                    JPG, GIF or PNG. Max size of 2MB
                </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-200">
                <h3 className="text-sm font-medium text-neutral-700 mb-3">
                    NIC Document
                </h3>
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <div className="h-24 w-32 bg-neutral-100 rounded-md overflow-hidden border-2 border-neutral-300 flex items-center justify-center">
                            {userDetails?.nic_photo ? (
                                <img
                                    src={userDetails.nic_photo}
                                    alt="NIC"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <svg
                                    className="h-12 w-12 text-neutral-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            <input type="file" className="sr-only" />
                            Upload NIC
                        </label>
                        {userDetails?.nic_photo && (
                            <button className="ml-2 text-sm text-error-600 hover:text-red-800">
                                Remove
                            </button>
                        )}
                    </div>
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                    JPG, GIF or PNG. Max size of 5MB
                </p>
            </div>
        </div>
    );
};

export default DoctorEditFormStructure;
