import React, { useState, useEffect, useRef } from 'react';
import {
    UserPlus,
    Search,
    Save,
    X,
    Edit2,
    Phone,
    Mail,
    MapPin,
    Calendar,
    User,
    CreditCard,
    AlertCircle,
    CheckCircle,
    Lock,
    Eye,
    EyeOff,
    Info,
    Building2
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
    const [branches, setBranches] = useState<Array<{id: string; name: string}>>([]);

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
        <div className="space-y-6">
            {/* Error Popup Modal */}
            {errorPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4 animate-pulse">
                        <div className="flex items-center justify-center mb-4">
                            <div className="p-3 rounded-full bg-red-100">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-red-600 text-center mb-3">Registration Error</h3>
                        <p className="text-gray-700 text-center mb-6">{errorPopup}</p>
                        <button
                            onClick={() => setErrorPopup(null)}
                            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                            <UserPlus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Patient Registration</h1>
                            <p className="text-sm text-gray-500">Register new patients or update existing records</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setMode('register'); resetForm(); }}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                mode === 'register'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <UserPlus className="w-4 h-4 inline mr-2" />
                            New Patient
                        </button>
                        <button
                            onClick={() => {
                                setMode('search');
                                resetForm();
                                // Auto-load all patients when switching to search mode
                                handleSearch('');
                            }}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                mode === 'search'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <Search className="w-4 h-4 inline mr-2" />
                            Find Patient
                        </button>
                    </div>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                    message.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                    {message.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    {message.text}
                </div>
            )}

            {/* Search Section */}
            {mode === 'search' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Search & Filter Patients</h3>

                    {/* Filter Options - Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name / Phone / NIC</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search by name, phone, or NIC..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        handleSearch(e.target.value, filterBranchId, filterCity);
                                    }}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <select
                                    value={filterBranchId}
                                    onChange={(e) => {
                                        setFilterBranchId(e.target.value);
                                        handleSearch(searchQuery, e.target.value, filterCity);
                                    }}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm appearance-none bg-white"
                                >
                                    <option value="">All Branches</option>
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <select
                                    value={filterCity}
                                    onChange={(e) => {
                                        setFilterCity(e.target.value);
                                        handleSearch(searchQuery, filterBranchId, e.target.value);
                                    }}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm appearance-none bg-white"
                                >
                                    <option value="">All Cities</option>
                                    {sriLankanCities.map((city) => (
                                        <option key={city} value={city}>
                                            {city}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 mb-4">
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setFilterBranchId('');
                                setFilterCity('');
                                handleSearch('', '', '');
                            }}
                            disabled={loading}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all text-sm font-medium disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : 'Show All Patients'}
                        </button>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setFilterBranchId('');
                                setFilterCity('');
                                setSearchResults([]);
                            }}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                        >
                            Clear Filters
                        </button>
                    </div>

                    {/* Patient count */}
                    <div className="mb-3 text-sm text-gray-500 flex items-center gap-2">
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                            {searchResults.length}
                        </span>
                        {loading ? 'Loading patients...' : 'patient(s) found'}
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                            {searchResults.map((patient) => (
                                <div
                                    key={patient.id}
                                    className="p-4 hover:bg-gray-50 flex items-center justify-between cursor-pointer"
                                    onClick={() => handleSelectPatient(patient)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                                            {patient.name?.charAt(0)?.toUpperCase() || patient.first_name?.charAt(0)?.toUpperCase() || 'P'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{patient.name || `${patient.first_name} ${patient.last_name}`.trim()}</p>
                                            <p className="text-sm text-gray-500">
                                                {patient.patient_id || patient.unique_registration_number} • {patient.phone || patient.phone_number}
                                                {patient.nic && ` • NIC: ${patient.nic}`}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {(patient as any).city && <span className="inline-flex items-center"><MapPin className="w-3 h-3 mr-1" />{(patient as any).city}</span>}
                                                {(patient as any).branch_name && <span className="inline-flex items-center ml-2"><Building2 className="w-3 h-3 mr-1" />{(patient as any).branch_name}</span>}
                                                {!(patient as any).city && !(patient as any).branch_name && <span className="italic">Self-registered / No location</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            patient.gender === 'male'
                                                ? 'bg-blue-100 text-blue-700'
                                                : patient.gender === 'female'
                                                    ? 'bg-pink-100 text-pink-700'
                                                    : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {patient.gender}
                                        </span>
                                        <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* No results message */}
                    {!loading && searchResults.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No patients found. Try a different search term or register a new patient.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Registration Form - Only show when in register mode */}
            {mode === 'register' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {selectedPatient ? `Update Patient: ${selectedPatient.name}` : 'Patient Information'}
                    </h2>
                    {selectedPatient && (
                        <button
                            onClick={resetForm}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <form onSubmit={handleRegister} className="space-y-6" autoComplete="off">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={(e) => {
                                        handleInputChange(e);
                                        if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: undefined }));
                                    }}
                                    disabled={!!selectedPatient}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="Enter full name"
                                    required
                                />
                            </div>
                            {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date of Birth <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="date"
                                    name="date_of_birth"
                                    value={formData.date_of_birth}
                                    onChange={(e) => {
                                        handleInputChange(e);
                                        if (fieldErrors.date_of_birth) setFieldErrors(prev => ({ ...prev, date_of_birth: undefined }));
                                    }}
                                    disabled={!!selectedPatient}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 ${fieldErrors.date_of_birth ? 'border-red-500' : 'border-gray-300'}`}
                                    required
                                />
                            </div>
                            {fieldErrors.date_of_birth && <p className="text-red-500 text-xs mt-1">{fieldErrors.date_of_birth}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Age
                            </label>
                            <input
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleInputChange}
                                disabled={!!selectedPatient}
                                min="0"
                                max="150"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                                placeholder="Age"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Gender <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={(e) => {
                                    handleInputChange(e);
                                    if (fieldErrors.gender) setFieldErrors(prev => ({ ...prev, gender: undefined }));
                                }}
                                disabled={!!selectedPatient}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 ${fieldErrors.gender ? 'border-red-500' : 'border-gray-300'}`}
                                required
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                            {fieldErrors.gender && <p className="text-red-500 text-xs mt-1">{fieldErrors.gender}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        handleInputChange(e);
                                        if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: undefined }));
                                    }}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="07X XXX XXXX"
                                    required
                                />
                            </div>
                            {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                {/* Hidden dummy fields to trick browser autofill */}
                                <input type="text" name="fakeusernameremembered" style={{display: 'none'}} />
                                <input type="password" name="fakepasswordremembered" style={{display: 'none'}} />
                                <input
                                    ref={emailInputRef}
                                    type="text"
                                    id={`patient_email_${Date.now()}`}
                                    name="patient_email_field_no_autofill"
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    spellCheck={false}
                                    data-lpignore="true"
                                    data-form-type="other"
                                    data-1p-ignore="true"
                                    aria-autocomplete="none"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="patient@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                NIC Number
                            </label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    name="nic"
                                    value={formData.nic}
                                    onChange={handleInputChange}
                                    disabled={!!selectedPatient}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                                    placeholder="XXXXXXXXXX"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Blood Type
                            </label>
                            <select
                                name="blood_type"
                                value={formData.blood_type}
                                onChange={handleInputChange}
                                disabled={!!selectedPatient}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                            >
                                <option value="">Select</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Branch
                            </label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={userBranchName || 'Loading...'}
                                    disabled
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                                />
                                <input
                                    type="hidden"
                                    name="branch_id"
                                    value={formData.branch_id}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Branch is auto-assigned based on your registration</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                City
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <select
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="">Select City</option>
                                    {sriLankanCities.map((city) => (
                                        <option key={city} value={city}>
                                            {city}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                rows={2}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Full address"
                            />
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Emergency Contact Name
                            </label>
                            <input
                                type="text"
                                name="emergency_contact_name"
                                value={formData.emergency_contact_name}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Contact person name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Emergency Contact Phone
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="tel"
                                    name="emergency_contact"
                                    value={formData.emergency_contact}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="07X XXX XXXX"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Patient Account Password - Only for new patients */}
                    {!selectedPatient && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3 mb-4">
                                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                    <h3 className="font-medium text-blue-800">Patient Login Credentials</h3>
                                    <p className="text-sm text-blue-600">
                                        The patient can use their <strong>Phone Number</strong> as username and the password below to log into their dashboard.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={formData.password}
                                            onChange={(e) => {
                                                handleInputChange(e);
                                                if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                                            }}
                                            className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="Min. 6 characters"
                                            minLength={6}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            name="confirm_password"
                                            value={formData.confirm_password}
                                            onChange={(e) => {
                                                handleInputChange(e);
                                                if (fieldErrors.confirm_password) setFieldErrors(prev => ({ ...prev, confirm_password: undefined }));
                                            }}
                                            className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${fieldErrors.confirm_password ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="Confirm password"
                                            minLength={6}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {fieldErrors.confirm_password && <p className="text-red-500 text-xs mt-1">{fieldErrors.confirm_password}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                        >
                            <X className="w-4 h-4 inline mr-2" />
                            Cancel
                        </button>
                        {selectedPatient ? (
                            <button
                                type="button"
                                onClick={handleUpdate}
                                disabled={saving}
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium disabled:opacity-50"
                            >
                                <Save className="w-4 h-4 inline mr-2" />
                                {saving ? 'Updating...' : 'Update Patient'}
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all font-medium disabled:opacity-50"
                            >
                                <Save className="w-4 h-4 inline mr-2" />
                                {saving ? 'Registering...' : 'Register Patient'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
            )}
        </div>
    );
};

export default PatientRegistration;
