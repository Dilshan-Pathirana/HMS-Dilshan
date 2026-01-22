import React from "react";
import Select from "react-select";
import { CommonFormFieldsProps } from "../../../../../utils/types/users/IUserEdit.ts";
export const CommonFormFields: React.FC<CommonFormFieldsProps> = ({
    userDetails,
    branchOptions,
    handleInputChange,
    handleBranchChange,
}) => {
    return (
        <>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={userDetails?.email || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="contact_number_mobile"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Mobile Number
                    </label>
                    <input
                        type="text"
                        id="contact_number_mobile"
                        name="contact_number_mobile"
                        value={
                            userDetails?.contact_number_mobile ||
                            userDetails?.phone ||
                            ""
                        }
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label
                        htmlFor="home_address"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Home Address
                    </label>
                    <input
                        type="text"
                        id="home_address"
                        name="home_address"
                        value={
                            userDetails?.home_address ||
                            userDetails?.address ||
                            ""
                        }
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="nic_number"
                        className="block text-sm font-medium text-gray-700"
                    >
                        NIC Number
                    </label>
                    <input
                        type="text"
                        id="nic_number"
                        name="nic_number"
                        value={
                            userDetails?.nic_number || userDetails?.NIC || ""
                        }
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
            </div>

            <div className="col-span-1 mb-4">
                <label className="block text-sm font-medium text-gray-700">
                    Branch
                </label>
                <Select
                    value={branchOptions.find(
                        (option) => option.value === userDetails?.branch_id,
                    )}
                    onChange={handleBranchChange}
                    options={branchOptions}
                    className="mt-1"
                    placeholder="Select Branch"
                    isClearable
                />
            </div>
        </>
    );
};
