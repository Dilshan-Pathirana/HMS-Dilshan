import React, { useState, useEffect, useRef } from 'react';
import {
    UserPlus, Search, Save, X, Edit2, Phone, Mail, MapPin, Calendar,
    User, CreditCard, AlertCircle, CheckCircle, Lock, Eye, EyeOff,
    Info, Building2, ChevronRight, Activity, FileText, Filter
} from 'lucide-react';
import receptionistService, { Patient } from '../../../services/receptionistService';

const PatientRegistration: React.FC = () => {
    const [mode, setMode] = useState<'register' | 'search'>('register');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const emailInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: '',
        date_of_birth: '',
        age: '',
        gender: 'male' as 'male' | 'female' | 'other',
        phone: '',
        email: '',
        address: '',
        city: '',
        nic: '',
        blood_type: '',
        branch_id: '',
        emergency_contact: '',
        emergency_contact_name: '',
        password: '',
        confirm_password: '',
    });
    const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);

    // Sri Lankan cities list
    const sriLankanCities = [
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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorPopup, setErrorPopup] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{
        name?: string;
        phone?: string;
        gender?: string;
        date_of_birth?: string;
        password?: string;
        confirm_password?: string;
    }>({});
    const [userBranchId, setUserBranchId] = useState<string>('');
    const [userBranchName, setUserBranchName] = useState<string>('');

    // Filter states for patient search
    const [filterBranchId, setFilterBranchId] = useState<string>('');
    const [filterCity, setFilterCity] = useState<string>('');

    // Get logged-in user's branch on mount
    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        if (userInfo.branch_id) {
            setUserBranchId(userInfo.branch_id.toString());
            setFormData(prev => ({ ...prev, branch_id: userInfo.branch_id.toString() }));
        }
    }, []);

    // Set branch name when branches are loaded
    useEffect(() => {
        if (userBranchId && branches.length > 0) {
            const userBranch = branches.find(b => b.id.toString() === userBranchId);
            if (userBranch) {
                setUserBranchName(userBranch.name);
            }
        }
    }, [userBranchId, branches]);

    // Clear email field on mount to prevent browser autofill
    useEffect(() => {
        // Multiple attempts to clear autofill at different timings
        const clearEmail = () => {
            if (emailInputRef.current && !selectedPatient) {
                emailInputRef.current.value = '';
                setFormData(prev => ({ ...prev, email: '' }));
            }
        };

        // Clear immediately
        clearEmail();

        // Clear after short delays to catch delayed autofill
        const timer1 = setTimeout(clearEmail, 50);
        const timer2 = setTimeout(clearEmail, 100);
        const timer3 = setTimeout(clearEmail, 300);
        const timer4 = setTimeout(clearEmail, 500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
        };
    }, [selectedPatient]);

    // Fetch branches on mount
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const response = await receptionistService.getBranches();
                setBranches(response || []);
            } catch (error) {
                console.error('Failed to fetch branches:', error);
            }
        };
        fetchBranches();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Auto-calculate age from date of birth
        if (name === 'date_of_birth' && value) {
            const birthDate = new Date(value);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            setFormData(prev => ({ ...prev, age: age.toString() }));
        }
    };

    const handleSearch = async (query?: string, branchId?: string, city?: string) => {
        const searchTerm = query !== undefined ? query : searchQuery;
        const branch = branchId !== undefined ? branchId : filterBranchId;
        const cityFilter = city !== undefined ? city : filterCity;

        setLoading(true);
        try {
            const results = await receptionistService.searchPatients(searchTerm, branch, cityFilter);
            setSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
            setMessage({ type: 'error', text: 'Failed to search patients' });
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setFormData({
            name: patient.name || '',
            date_of_birth: patient.date_of_birth || '',
            age: patient.age?.toString() || '',
            gender: patient.gender || 'male',
            phone: patient.phone || '',
            email: patient.email || '',
            address: patient.address || '',
            city: (patient as any).city || '',
            nic: patient.nic || '',
            blood_type: patient.blood_type || '',
            branch_id: patient.branch_id?.toString() || '',
            emergency_contact: patient.emergency_contact || '',
            emergency_contact_name: patient.emergency_contact_name || '',
            password: '',
            confirm_password: '',
        });
        setSearchResults([]);
        setSearchQuery('');
        setMode('register');
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        // Clear previous field errors
        const errors: typeof fieldErrors = {};
        let hasErrors = false;

        // Validate required fields
        if (!formData.name.trim()) {
            errors.name = 'Full name is required';
            hasErrors = true;
        }
        if (!formData.phone.trim()) {
            errors.phone = 'Phone number is required';
            hasErrors = true;
        }
        if (!formData.gender) {
            errors.gender = 'Gender is required';
            hasErrors = true;
        }
        if (!formData.date_of_birth) {
            errors.date_of_birth = 'Date of birth is required';
            hasErrors = true;
        }
        if (!formData.password) {
            errors.password = 'Password is required';
            hasErrors = true;
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
            hasErrors = true;
        }
        if (!formData.confirm_password) {
            errors.confirm_password = 'Please confirm your password';
            hasErrors = true;
        } else if (formData.password !== formData.confirm_password) {
            errors.confirm_password = 'Passwords do not match';
            hasErrors = true;
        }

        setFieldErrors(errors);

        if (hasErrors) {
            setMessage({ type: 'error', text: 'Please fill in all required fields' });
            return;
        }

        setSaving(true);
        try {
            const patientData = {
                name: formData.name,
                date_of_birth: formData.date_of_birth || undefined,
                age: formData.age ? parseInt(formData.age) : undefined,
                gender: formData.gender,
                phone: formData.phone,
                email: formData.email || undefined,
                address: formData.address || undefined,
                city: formData.city || undefined,
                branch_id: formData.branch_id ? parseInt(formData.branch_id) : undefined,
                nic: formData.nic || undefined,
                blood_type: formData.blood_type || undefined,
                emergency_contact: formData.emergency_contact || undefined,
                emergency_contact_name: formData.emergency_contact_name || undefined,
                password: formData.password,
            };

            const newPatient = await receptionistService.registerPatient(patientData);
            setMessage({ type: 'success', text: `Patient registered successfully! ID: ${newPatient.patient_id}. Login: Phone: ${formData.phone}, Password: (as provided)` });
            resetForm();
        } catch (error: any) {
            console.error('Registration error:', error);
            const errorMessage = error?.response?.data?.message || 'Failed to register patient. Please check your information and try again.';
            setErrorPopup(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedPatient) return;

        setSaving(true);
        try {
            await receptionistService.updatePatient(selectedPatient.id, {
                phone: formData.phone,
                email: formData.email,
                address: formData.address,
                emergency_contact: formData.emergency_contact,
                emergency_contact_name: formData.emergency_contact_name,
            });
            setMessage({ type: 'success', text: 'Patient information updated successfully!' });
            setSelectedPatient(null);
            resetForm();
        } catch (error: any) {
            console.error('Update error:', error);
            const errorMessage = error?.response?.data?.message || 'Failed to update patient. Please check your information and try again.';
            setErrorPopup(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            date_of_birth: '',
            age: '',
            gender: 'male',
            phone: '',
            email: '',
            address: '',
            city: '',
            nic: '',
            blood_type: '',
            branch_id: userBranchId,
            emergency_contact: '',
            emergency_contact_name: '',
            password: '',
            confirm_password: '',
        });
        setSelectedPatient(null);
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    return (
        <div className="flex h-[calc(100vh-theme(spacing.24))] gap-6 font-sans">
            {/* Error Popup */}
            {errorPopup && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-neutral-100 animate-in zoom-in-95">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-neutral-900">Registration Error</h3>
                                <p className="text-sm text-neutral-500">Something went wrong during the process</p>
                            </div>
                        </div>
                        <p className="text-neutral-600 mb-6 bg-red-50 p-4 rounded-xl text-sm leading-relaxed">
                            {errorPopup}
                        </p>
                        <button
                            onClick={() => setErrorPopup(null)}
                            className="w-full py-3 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition font-medium"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* Left Column - Search & List */}
            <div className="w-96 flex flex-col bg-white rounded-2xl shadow-sm border border-neutral-200/60 overflow-hidden shrink-0">
                <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
                    <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-wide flex items-center gap-2 mb-3">
                        <Search className="w-4 h-4 text-emerald-600" /> Patient Lookup
                    </h2>

                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search by name, phone, NIC..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    if (e.target.value.length >= 2) handleSearch(e.target.value, filterBranchId, filterCity);
                                }}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white placeholder:text-neutral-400"
                            />
                        </div>

                        <div className="flex gap-2">
                            <select
                                value={filterCity}
                                onChange={(e) => {
                                    setFilterCity(e.target.value);
                                    handleSearch(searchQuery, filterBranchId, e.target.value);
                                }}
                                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:ring-1 focus:ring-emerald-500 text-neutral-600 bg-white"
                            >
                                <option value="">All Cities</option>
                                {sriLankanCities.map(city => <option key={city} value={city}>{city}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loading && (
                        <div className="text-center py-8">
                            <Activity className="w-6 h-6 text-emerald-500 animate-spin mx-auto mb-2" />
                            <p className="text-xs text-neutral-400">Searching patients...</p>
                        </div>
                    )}

                    {!loading && searchResults.length === 0 && searchQuery && (
                        <div className="text-center py-8 px-4 text-neutral-400">
                            <p className="text-sm">No patients found</p>
                            <p className="text-xs mt-1">Try a different search term or register new</p>
                        </div>
                    )}

                    {searchResults.map((patient) => (
                        <button
                            key={patient.id}
                            onClick={() => handleSelectPatient(patient)}
                            className="w-full text-left p-3 rounded-xl hover:bg-neutral-50 border border-transparent hover:border-neutral-200 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                                    {patient.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-medium text-neutral-900 group-hover:text-emerald-700 transition-colors truncate text-sm">
                                        {patient.name}
                                    </h4>
                                    <p className="text-xs text-neutral-500 truncate">{patient.phone}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-neutral-300 ml-auto group-hover:text-emerald-500" />
                            </div>
                        </button>
                    ))}

                    {!searchQuery && (
                        <div className="text-center py-12 px-6 text-neutral-400 opacity-60">
                            <User className="w-12 h-12 mx-auto mb-3 stroke-1" />
                            <p className="text-sm">Search to find patients</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column - Registration Form */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-neutral-200/60 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                            {selectedPatient ? (
                                <>
                                    <Edit2 className="w-5 h-5 text-emerald-600" />
                                    Edit Patient
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5 text-emerald-600" />
                                    New Registration
                                </>
                            )}
                        </h1>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            {selectedPatient ? `Updating records for ${selectedPatient.name}` : 'Enter new patient details into the system'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {selectedPatient && (
                            <button
                                onClick={resetForm}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50 border border-neutral-200 transition-colors"
                            >
                                <X className="w-4 h-4 inline mr-2" />
                                Cancel Edit
                            </button>
                        )}
                        <button
                            onClick={() => { resetForm(); setMode('register'); }}
                            className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors text-sm font-medium"
                        >
                            Clear Form
                        </button>
                    </div>
                </div>

                {/* Main Form Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <form onSubmit={handleRegister} id="patient-form" className="max-w-4xl mx-auto space-y-8">

                        {/* Section 1: Personal Details */}
                        <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-500">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                    <User className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-bold text-neutral-800">Personal Information</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1.5">Full Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors ${fieldErrors.name ? 'border-red-500' : 'border-neutral-200'}`}
                                        placeholder="E.g. John Doe"
                                        disabled={!!selectedPatient}
                                    />
                                    {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1.5">Gender <span className="text-red-500">*</span></label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                                        disabled={!!selectedPatient}
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1.5">Date of Birth <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={formData.date_of_birth}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${fieldErrors.date_of_birth ? 'border-red-500' : 'border-neutral-200'}`}
                                        disabled={!!selectedPatient}
                                    />
                                    {fieldErrors.date_of_birth && <p className="text-red-500 text-xs mt-1">{fieldErrors.date_of_birth}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1.5">Age</label>
                                    <input
                                        type="number"
                                        name="age"
                                        value={formData.age}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl bg-neutral-50"
                                        placeholder="Auto-calc"
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1.5">NIC / ID</label>
                                    <input
                                        type="text"
                                        name="nic"
                                        value={formData.nic}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        placeholder="National ID"
                                        disabled={!!selectedPatient}
                                    />
                                </div>
                            </div>
                        </div>

                        <hr className="border-neutral-100" />

                        {/* Section 2: Contact Details */}
                        <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-500 delay-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-bold text-neutral-800">Contact Details</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${fieldErrors.phone ? 'border-red-500' : 'border-neutral-200'}`}
                                        placeholder="Mobile Number"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1.5">Email Address</label>
                                    <input
                                        ref={emailInputRef}
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        placeholder="Optional email"
                                        autoComplete="off"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1.5">Address</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        rows={2}
                                        className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                                        placeholder="Street address"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1.5">City</label>
                                    <select
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                                    >
                                        <option value="">Select City</option>
                                        {sriLankanCities.map(city => <option key={city} value={city}>{city}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <hr className="border-neutral-100" />

                        {/* Section 3: Medical & Emergency */}
                        <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-500 delay-200">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-red-50 rounded-lg text-red-600">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-bold text-neutral-800">Medical & Emergency</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1.5">Blood Type</label>
                                    <select
                                        name="blood_type"
                                        value={formData.blood_type}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                                        disabled={!!selectedPatient}
                                    >
                                        <option value="">Unknown</option>
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1.5">Emergency Contact Name</label>
                                    <input
                                        type="text"
                                        name="emergency_contact_name"
                                        value={formData.emergency_contact_name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        placeholder="Contact Person"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1.5">Emergency Phone</label>
                                    <input
                                        type="tel"
                                        name="emergency_contact"
                                        value={formData.emergency_contact}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        placeholder="Emergency Number"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Account Password (New Only) */}
                        {!selectedPatient && (
                            <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200 animate-in slide-in-from-bottom-2 duration-500 delay-300">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-white border border-neutral-200 rounded-lg shadow-sm text-neutral-600">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-neutral-800">Account Credentials</h3>
                                        <p className="text-xs text-neutral-500">Set password for patient portal access</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1.5">Password <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${fieldErrors.password ? 'border-red-500' : 'border-neutral-200'}`}
                                                placeholder="Min 6 characters"
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                name="confirm_password"
                                                value={formData.confirm_password}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${fieldErrors.confirm_password ? 'border-red-500' : 'border-neutral-200'}`}
                                                placeholder="Repeat password"
                                            />
                                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600">
                                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bottom Bar Spacing */}
                        <div className="h-12"></div>
                    </form>
                </div>

                {/* Floating Bottom Action Bar */}
                <div className="p-4 border-t border-neutral-200 bg-white/80 backdrop-blur-md absolute bottom-0 w-full flex justify-between items-center z-20">
                    <p className="text-xs text-neutral-500 hidden md:block">
                        <span className="text-red-500">*</span> Required fields
                    </p>
                    <div className="flex gap-3 ml-auto w-full md:w-auto">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="flex-1 md:flex-none px-6 py-3 border border-neutral-200 text-neutral-700 font-bold rounded-xl hover:bg-neutral-50 transition-all"
                        >
                            Cancel
                        </button>
                        {selectedPatient ? (
                            <button
                                type="button"
                                onClick={handleUpdate}
                                disabled={saving}
                                className="flex-1 md:flex-none px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saving ? <Activity className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Update Record
                            </button>
                        ) : (
                            <button
                                type="submit"
                                form="patient-form"
                                disabled={saving}
                                className="flex-1 md:flex-none px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saving ? <Activity className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                                Register Patient
                            </button>
                        )}
                    </div>
                </div>

                {/* Success Message Toast */}
                {message && (
                    <div className={`absolute top-4 right-4 md:left-1/2 md:-translate-x-1/2 md:top-6 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 z-50 ${message.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="font-medium text-sm">{message.text}</span>
                        <button onClick={() => setMessage(null)}><X className="w-4 h-4 opacity-50 hover:opacity-100" /></button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientRegistration;
