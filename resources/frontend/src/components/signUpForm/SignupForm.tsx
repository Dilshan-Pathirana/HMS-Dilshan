import React, { useEffect, useState } from "react";
import { FaUser, FaIdCard, FaEnvelope, FaMapMarkerAlt, FaCalendarAlt, FaVenusMars, FaTint, FaPhoneAlt, FaUserShield, FaCity } from "react-icons/fa";
import HeroImage from "../../assets/heroImage.png";
import NavBar from "../../pages/UserWeb/NavBar.tsx";
import Footer from "../../pages/UserWeb/Footer.tsx";
import { ISignupFormProps } from "../../utils/types/users/ISignUp.ts";
import { getAllBranches } from "../../utils/api/branch/GetAllBranches.ts";
import { MultiSelect } from "react-multi-select-component";
import { MultiSelectOption } from "../../utils/types/Appointment/IAppointment.ts";
import PhoneNumberVerification from "./phoneNumberVerification/PhoneNumberVerification.tsx";

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDER_OPTIONS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
];

// Sri Lankan cities list
const SRI_LANKAN_CITIES = [
    'Colombo', 'Dehiwala-Mount Lavinia', 'Moratuwa', 'Sri Jayawardenepura Kotte', 'Negombo',
    'Kandy', 'Kalmunai', 'Vavuniya', 'Galle', 'Trincomalee', 'Batticaloa', 'Jaffna',
    'Katunayake', 'Dambulla', 'Kolonnawa', 'Anuradhapura', 'Ratnapura', 'Badulla',
    'Matara', 'Puttalam', 'Chavakachcheri', 'Kattankudy', 'Hambantota', 'Samanthurai',
    'Bentota', 'Gampaha', 'Kurunegala', 'Matale', 'Kalutara', 'Nuwara Eliya',
    'Polonnaruwa', 'Ampara', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Chilaw',
    'Panadura', 'Horana', 'Kaduwela', 'Kelaniya', 'Maharagama', 'Kottawa',
    'Nugegoda', 'Piliyandala', 'Ragama', 'Wattala', 'Ja-Ela', 'Kandana',
    'Battaramulla', 'Boralesgamuwa', 'Wellampitiya', 'Avissawella', 'Homagama',
    'Kesbewa', 'Beruwala', 'Aluthgama', 'Ambalangoda', 'Hikkaduwa', 'Unawatuna',
    'Weligama', 'Mirissa', 'Tangalle', 'Tissamaharama', 'Ella', 'Haputale',
    'Bandarawela', 'Welimada', 'Mahiyanganaya', 'Passara', 'Monaragala',
    'Embilipitiya', 'Balangoda', 'Pelmadulla', 'Eheliyagoda', 'Kegalle',
    'Mawanella', 'Rambukkana', 'Warakapola', 'Gampola', 'Nawalapitiya',
    'Hatton', 'Nanu Oya', 'Talawakele', 'Maskeliya', 'Harispattuwa',
    'Kundasale', 'Peradeniya', 'Digana', 'Akurana', 'Kadugannawa',
    'Narammala', 'Kuliyapitiya', 'Pannala', 'Nittambuwa', 'Minuwangoda',
    'Divulapitiya', 'Veyangoda', 'Giriulla', 'Alawwa', 'Polgahawela',
    'Hettipola', 'Ibbagamuwa', 'Ridigama', 'Nikaweratiya', 'Maho',
    'Medawachchiya', 'Mihintale', 'Kekirawa', 'Habarana', 'Sigiriya',
    'Galenbindunuwewa', 'Talawa', 'Thirappane', 'Padaviya', 'Kebithigollewa',
    'Point Pedro', 'Nallur', 'Chunnakam', 'Kopay', 'Manipay', 'Kayts',
    'Karainagar', 'Velanai', 'Valvettithurai', 'Kodikamam', 'Tellippalai',
    'Elephant Pass', 'Pooneryn', 'Nedunkerny', 'Oddusuddan', 'Puthukkudiyiruppu',
    'Akkaraipattu', 'Pottuvil', 'Uhana', 'Padiyathalawa', 'Dehiattakandiya',
    'Eravur', 'Valaichchenai', 'Kinniya', 'Muttur', 'Kantale', 'Seruvila',
    'Other'
].sort();

const SignupForm: React.FC<ISignupFormProps> = ({
    signupInfo,
    errors,
    handleChange,
    handleSubmit,
    setSignupInfo,
    verifyOtp,
    isOtpSent,
    isOtpVerified,
    isSubmitting,
    otpError,
    formRef,
    autoSendOtp,
    phoneExistsError,
}) => {
    const [branchOptions, setBranchOptions] = useState<MultiSelectOption[]>([]);
    const [selectedBranches, setSelectedBranches] = useState<
        MultiSelectOption[]
    >([]);

    useEffect(() => {
        fetchBranches().then();
    }, []);

    const fetchBranches = async () => {
        try {
            const response = await getAllBranches();
            if (response.status === 200) {
                const options = response.data.branches.map(
                    (branch: { id: string; center_name: string }) => ({
                        label: branch.center_name,
                        value: branch.id,
                    }),
                );
                setBranchOptions(options);
            }
        } catch (error) {
            console.error("Failed to fetch branches:", error);
        }
    };

    const handleBranchChange = (selected: MultiSelectOption[]) => {
        if (selected.length > 0) {
            const lastSelected = selected.slice(-1)[0];
            setSelectedBranches([lastSelected]);
            setSignupInfo((prev) => ({
                ...prev,
                branch_id: lastSelected.value,
            }));
        } else {
            setSignupInfo((prev) => ({ ...prev, branch_id: "" }));
        }
    };

    return (
        <>
            <NavBar />
            <section className="flex flex-col md:flex-row items-center justify-between px-6 md:px-12 text-center md:text-left">
                <div className="w-full md:w-1/2 pt-24 pb-12 px-4">
                    <form
                        className="space-y-7 max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg"
                        onSubmit={handleSubmit}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="w-full">
                                <div
                                    className="flex items-center border-2 rounded-xl p-3.5 w-full focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-300">
                                    <FaUser className="text-blue-500 mr-3 text-lg" />
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={signupInfo.first_name}
                                        onChange={handleChange}
                                        placeholder="First Name"
                                        className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400 text-base"
                                    />
                                </div>
                                {errors.first_name && (
                                    <p className="text-red-500 text-sm mt-2 ml-1">
                                        {errors.first_name}
                                    </p>
                                )}
                            </div>

                            <div className="w-full">
                                <div
                                    className="flex items-center border-2 rounded-xl p-3.5 w-full focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-300">
                                    <FaUser className="text-blue-500 mr-3 text-lg" />
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={signupInfo.last_name}
                                        onChange={handleChange}
                                        placeholder="Last Name"
                                        className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400 text-base"
                                    />
                                </div>
                                {errors.last_name && (
                                    <p className="text-red-500 text-sm mt-2 ml-1">
                                        {errors.last_name}
                                    </p>
                                )}
                            </div>
                        </div>

                        <PhoneNumberVerification
                            signupInfo={signupInfo}
                            errors={errors}
                            isOtpSent={isOtpSent}
                            verifyOtp={verifyOtp}
                            isOtpVerified={isOtpVerified}
                            otpError={otpError}
                            formRef={formRef}
                            autoSendOtp={autoSendOtp}
                            handleChange={handleChange}
                            phoneExistsError={phoneExistsError}
                        />

                        <div className="w-full">
                            <div
                                className="flex items-center border-2 rounded-xl p-3.5 w-full focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-300">
                                <FaIdCard className="text-blue-500 mr-3 text-lg" />
                                <input
                                    type="text"
                                    name="NIC"
                                    value={signupInfo.NIC}
                                    onChange={handleChange}
                                    placeholder="National ID Card Number"
                                    className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400 text-base"
                                />
                            </div>
                            {errors.NIC && (
                                <p className="text-red-500 text-sm mt-2 ml-1">
                                    {"NIC Number is required."}
                                </p>
                            )}
                        </div>

                        <div className="w-full">
                            <div
                                className="flex items-center border-2 rounded-xl p-3.5 w-full focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-300">
                                <FaEnvelope className="text-blue-500 mr-3 text-lg" />
                                <input
                                    type="email"
                                    name="email"
                                    value={signupInfo.email}
                                    onChange={handleChange}
                                    placeholder="name@company.com"
                                    className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400 text-base"
                                />
                            </div>
                            {errors.email && (
                                <p className="text-red-500 text-sm mt-2 ml-1">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div className="w-full">
                            <div
                                className="flex items-center border-2 rounded-xl p-3.5 w-full focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-300">
                                <FaMapMarkerAlt className="text-blue-500 mr-3 text-lg" />
                                <input
                                    type="text"
                                    name="address"
                                    value={signupInfo.address}
                                    onChange={handleChange}
                                    placeholder="Enter your full address"
                                    className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400 text-base"
                                />
                            </div>
                            {errors.address && (
                                <p className="text-red-500 text-sm mt-2 ml-1">
                                    {errors.address}
                                </p>
                            )}
                        </div>

                        {/* City */}
                        <div className="w-full">
                            <div
                                className="flex items-center border-2 rounded-xl p-3.5 w-full focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-300">
                                <FaCity className="text-blue-500 mr-3 text-lg" />
                                <select
                                    name="city"
                                    value={signupInfo.city}
                                    onChange={(e) => setSignupInfo(prev => ({ ...prev, city: e.target.value }))}
                                    className="w-full bg-transparent outline-none text-gray-800 text-base cursor-pointer"
                                >
                                    <option value="">Select City</option>
                                    {SRI_LANKAN_CITIES.map((city) => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                            {errors.city && (
                                <p className="text-red-500 text-sm mt-2 ml-1">
                                    {errors.city}
                                </p>
                            )}
                        </div>

                        {/* Date of Birth and Gender */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="w-full">
                                <label className="block text-sm font-medium text-gray-600 mb-1.5 ml-1">
                                    Date of Birth
                                </label>
                                <div
                                    className="flex items-center border-2 rounded-xl p-3.5 w-full focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-300">
                                    <FaCalendarAlt className="text-blue-500 mr-3 text-lg" />
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={signupInfo.date_of_birth}
                                        onChange={handleChange}
                                        max={new Date().toISOString().split('T')[0]}
                                        placeholder="Enter your birthday"
                                        title="Enter your date of birth"
                                        className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400 text-base"
                                    />
                                </div>
                                {errors.date_of_birth && (
                                    <p className="text-red-500 text-sm mt-2 ml-1">
                                        {errors.date_of_birth}
                                    </p>
                                )}
                            </div>

                            <div className="w-full">
                                <div
                                    className="flex items-center border-2 rounded-xl p-3.5 w-full focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-300">
                                    <FaVenusMars className="text-blue-500 mr-3 text-lg" />
                                    <select
                                        name="gender"
                                        value={signupInfo.gender}
                                        onChange={(e) => setSignupInfo(prev => ({ ...prev, gender: e.target.value }))}
                                        className="w-full bg-transparent outline-none text-gray-800 text-base cursor-pointer"
                                    >
                                        <option value="">Select Gender</option>
                                        {GENDER_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                                {errors.gender && (
                                    <p className="text-red-500 text-sm mt-2 ml-1">
                                        {errors.gender}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Blood Type */}
                        <div className="w-full">
                            <div
                                className="flex items-center border-2 rounded-xl p-3.5 w-full focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-300">
                                <FaTint className="text-blue-500 mr-3 text-lg" />
                                <select
                                    name="blood_type"
                                    value={signupInfo.blood_type}
                                    onChange={(e) => setSignupInfo(prev => ({ ...prev, blood_type: e.target.value }))}
                                    className="w-full bg-transparent outline-none text-gray-800 text-base cursor-pointer"
                                >
                                    <option value="">Select Blood Type (Optional)</option>
                                    {BLOOD_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            {errors.blood_type && (
                                <p className="text-red-500 text-sm mt-2 ml-1">
                                    {errors.blood_type}
                                </p>
                            )}
                        </div>

                        {/* Emergency Contact Section */}
                        <div className="border-t border-gray-200 pt-5 mt-2">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                                <FaUserShield className="text-blue-500 mr-2" />
                                Emergency Contact (Optional)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="w-full">
                                    <div
                                        className="flex items-center border-2 rounded-xl p-3.5 w-full focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-300">
                                        <FaUser className="text-blue-500 mr-3 text-lg" />
                                        <input
                                            type="text"
                                            name="emergency_contact_name"
                                            value={signupInfo.emergency_contact_name}
                                            onChange={handleChange}
                                            placeholder="Contact Name"
                                            className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400 text-base"
                                        />
                                    </div>
                                    {errors.emergency_contact_name && (
                                        <p className="text-red-500 text-sm mt-2 ml-1">
                                            {errors.emergency_contact_name}
                                        </p>
                                    )}
                                </div>

                                <div className="w-full">
                                    <div
                                        className="flex items-center border-2 rounded-xl p-3.5 w-full focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-300">
                                        <FaPhoneAlt className="text-blue-500 mr-3 text-lg" />
                                        <input
                                            type="tel"
                                            name="emergency_contact_phone"
                                            value={signupInfo.emergency_contact_phone}
                                            onChange={handleChange}
                                            placeholder="Contact Phone"
                                            className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400 text-base"
                                        />
                                    </div>
                                    {errors.emergency_contact_phone && (
                                        <p className="text-red-500 text-sm mt-2 ml-1">
                                            {errors.emergency_contact_phone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="w-full">
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                <FaMapMarkerAlt className="text-blue-500 mr-2 text-lg" />
                                Select Branch
                            </label>
                            <MultiSelect
                                options={branchOptions}
                                value={selectedBranches}
                                onChange={handleBranchChange}
                                labelledBy="Select Branch"
                                className="w-full rounded-xl"
                            />
                        </div>
                        {errors.branch_id && (
                            <p className="text-red-500 text-sm mt-2 ml-1">
                                {errors.branch_id}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-4 rounded-xl font-semibold text-base transition-all duration-300 transform hover:scale-[1.02] ${
                                isSubmitting
                                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-200"
                            }`}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center">
                                    <svg
                                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Creating Account...
                                </span>
                            ) : (
                                "Create Account"
                            )}
                        </button>

                        {!isOtpVerified && isOtpSent && (
                            <p className="text-gray-600 text-center text-sm">
                                Please verify your phone number to continue
                            </p>
                        )}
                    </form>
                </div>
                <img
                    src={HeroImage}
                    alt="Hero"
                    className="w-full md:w-[50%] h-screen object-cover"
                />
            </section>
            <Footer />
        </>
    );
};

export default SignupForm;
