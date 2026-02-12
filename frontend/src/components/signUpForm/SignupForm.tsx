import React, { useEffect, useState } from "react";
import { FaUser, FaIdCard, FaEnvelope, FaMapMarkerAlt, FaCalendarAlt, FaTint, FaPhoneAlt, FaUserShield, FaCity, FaLock } from "react-icons/fa";
import HeroImage from "../../assets/heroImage.png";
import NavBar from "../../pages/UserWeb/NavBar.tsx";
import Footer from "../../pages/UserWeb/Footer.tsx";
import { ISignupFormProps } from "../../utils/types/users/ISignUp.ts";
import { getAllBranches } from "../../utils/api/branch/GetAllBranches.ts";
import { MultiSelect } from "react-multi-select-component";
import { MultiSelectOption } from "../../utils/types/Appointment/IAppointment.ts";
import PhoneNumberVerification from "./phoneNumberVerification/PhoneNumberVerification.tsx";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
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
    const [selectedBranches, setSelectedBranches] = useState<MultiSelectOption[]>([]);

    useEffect(() => {
        fetchBranches().then();
    }, []);

    const fetchBranches = async () => {
        try {
            const response = await getAllBranches();
            // Response is already IBranchData[] from axios interceptor
            const options = response.map(
                (branch: { id: string; center_name: string }) => ({
                    label: branch.center_name,
                    value: branch.id,
                }),
            );
            setBranchOptions(options);
        } catch (error) {
            console.error("Failed to fetch branches:", error);
        }
    };

    const handleBranchChange = (selected: MultiSelectOption[]) => {
        setSelectedBranches(selected);
        setSignupInfo((prev) => ({
            ...prev,
            branch_ids: selected.map((b) => b.value),
        }));
    }

    return (
        <>
            <NavBar />
            <section className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 px-4 py-12">
                <div className="w-full max-w-4xl">
                    <form
                        className="glass rounded-3xl shadow-2xl p-8 md:p-12 border border-white/50 backdrop-blur-xl"
                        onSubmit={handleSubmit}
                    >
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-neutral-900">Create Your Account</h2>
                            <p className="text-neutral-500 mt-2">Join us to access personalized healthcare</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                            <Input
                                label="First Name"
                                leftIcon={<FaUser className="h-4 w-4" />}
                                name="first_name"
                                value={signupInfo.first_name}
                                onChange={handleChange}
                                placeholder="Enter your first name"
                                error={errors.first_name}
                            />
                            <Input
                                label="Last Name"
                                leftIcon={<FaUser className="h-4 w-4" />}
                                name="last_name"
                                value={signupInfo.last_name}
                                onChange={handleChange}
                                placeholder="Enter your last name"
                                error={errors.last_name}
                            />
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

                        <Input
                            label="National Identity Card (NIC)"
                            leftIcon={<FaIdCard className="h-4 w-4" />}
                            name="NIC"
                            value={signupInfo.NIC}
                            onChange={handleChange}
                            placeholder="e.g. 199012345678"
                            error={errors.NIC}
                        />

                        <Input
                            label="Email Address"
                            leftIcon={<FaEnvelope className="h-4 w-4" />}
                            type="email"
                            name="email"
                            value={signupInfo.email}
                            onChange={handleChange}
                            placeholder="name@example.com"
                            error={errors.email}
                        />

                        <Input
                            label="Password"
                            leftIcon={<FaLock className="h-4 w-4" />}
                            type="password"
                            name="password"
                            value={signupInfo.password}
                            onChange={handleChange}
                            placeholder="Create a password (min 6 characters)"
                            error={errors.password}
                        />

                        <Input
                            label="Confirm Password"
                            leftIcon={<FaLock className="h-4 w-4" />}
                            type="password"
                            name="confirm_password"
                            value={signupInfo.confirm_password}
                            onChange={handleChange}
                            placeholder="Re-enter your password"
                            error={errors.confirm_password}
                        />

                        <Input
                            label="Home Address"
                            leftIcon={<FaMapMarkerAlt className="h-4 w-4" />}
                            name="address"
                            value={signupInfo.address}
                            onChange={handleChange}
                            placeholder="Enter your street address"
                            error={errors.address}
                        />

                        {/* City */}
                        <Select
                            label="City"
                            options={[{ label: "Select City", value: "" }, ...SRI_LANKAN_CITIES.map(city => ({ label: city, value: city }))]}
                            value={signupInfo.city}
                            onChange={(e) => setSignupInfo(prev => ({ ...prev, city: e.target.value }))}
                            error={errors.city}
                        />

                        {/* Date of Birth and Gender */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                                    Date of Birth
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                                        <FaCalendarAlt className="h-4 w-4" />
                                    </div>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={signupInfo.date_of_birth}
                                        onChange={handleChange}
                                        max={new Date().toISOString().split('T')[0]}
                                        className={`w-full bg-neutral-50/50 border ${errors.date_of_birth ? 'border-error-500' : 'border-neutral-200'} rounded-xl pl-11 pr-4 py-3.5 text-neutral-900 focus:outline-none focus:ring-4 ${errors.date_of_birth ? 'focus:ring-error-500/10 focus:border-error-500' : 'focus:ring-primary-500/10 focus:border-primary-500'} hover:border-primary-200 hover:bg-white transition-all duration-300 ease-out shadow-sm`}
                                    />
                                </div>
                                {errors.date_of_birth && (
                                    <p className="mt-1.5 text-xs text-error-600 font-medium animate-slide-down">
                                        {errors.date_of_birth}
                                    </p>
                                )}
                            </div>

                            <div className="mt-6 md:mt-0"> {/* Margin top adjustment for label alignment */}
                                <Select
                                    label="Gender"
                                    options={GENDER_OPTIONS}
                                    value={signupInfo.gender}
                                    onChange={(e) => setSignupInfo(prev => ({ ...prev, gender: e.target.value }))}
                                    error={errors.gender}
                                />
                            </div>
                        </div>

                        {/* Blood Type */}
                        <Select
                            label="Blood Type (Optional)"
                            options={BLOOD_TYPES.map(t => ({ label: t, value: t }))}
                            value={signupInfo.blood_type}
                            onChange={(e) => setSignupInfo(prev => ({ ...prev, blood_type: e.target.value }))}
                            error={errors.blood_type}
                        />

                        {/* Emergency Contact Section */}
                        <div className="border-t border-neutral-100 pt-6 mt-2">
                            <h3 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center">
                                <FaUserShield className="text-primary-500 mr-2" />
                                Emergency Contact (Optional)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                                <Input
                                    label="Contact Person Name"
                                    leftIcon={<FaUser className="h-4 w-4" />}
                                    name="emergency_contact_name"
                                    value={signupInfo.emergency_contact_name}
                                    onChange={handleChange}
                                    placeholder="Enter contact name"
                                    error={errors.emergency_contact_name}
                                />
                                <Input
                                    label="Contact Phone Number"
                                    leftIcon={<FaPhoneAlt className="h-4 w-4" />}
                                    type="tel"
                                    name="emergency_contact_phone"
                                    value={signupInfo.emergency_contact_phone}
                                    onChange={handleChange}
                                    placeholder="Enter contact phone"
                                    error={errors.emergency_contact_phone}
                                />
                            </div>
                        </div>

                        <div className="w-full">
                            <label className="flex items-center text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                                <FaMapMarkerAlt className="text-primary-500 mr-2" />
                                Select Branch(es)
                            </label>
                            <MultiSelect
                                options={branchOptions}
                                value={selectedBranches}
                                onChange={handleBranchChange}
                                labelledBy="Select Branch(es)"
                                className="w-full"
                            />
                            {errors.branch_ids && (
                                <p className="mt-1.5 text-xs text-error-600 font-medium animate-slide-down">
                                    {errors.branch_ids}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            isLoading={isSubmitting}
                            className="w-full shadow-primary hover:shadow-primary-hover"
                            size="lg"
                        >
                            Create Account
                        </Button>

                        {!isOtpVerified && isOtpSent && (
                            <p className="text-neutral-500 text-center text-sm">
                                Please verify your phone number to continue
                            </p>
                        )}
                    </form>
                </div>
            </section>
            <Footer />
        </>
    );
};

export default SignupForm;
