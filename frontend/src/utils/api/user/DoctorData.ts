export const doctorCreateFormInitialState = {
    first_name: "",
    last_name: "",
    password: "",
    date_of_birth: "",
    gender: "",
    nic_number: "",
    contact_number_mobile: "",
    landline_number: "",
    email: "",
    medical_registration_number: "",
    home_address: "",
    emergency_contact_info: "",
    recent_photo: null,
    nic_photo: [null, null],
    medical_reg_number: "",
    qualifications: "",
    years_of_experience: 0,
    specialization: [] as string[],
    work_experience: "",
    working_branch: "",
    license_validity_date: "",
    joining_date: "",
    contact_number_landline: "",
    previous_employment: "",
    probation_start_date: "",
    probation_end_date: "",
    branch_id: "[]",
    employee_id: "",
    contract_type: "",
    contract_duration: "",
    probation_period: { start: "", end: "" },
    compensation_package: "",
};

export const qualificationsOptions: string[] = [
    "Homeopathy Practitioner (HP) / Diploma Holder",
    "BHMS Graduate",
    "MSc in Homeopathy",
    "MD in Homeopathy",
    "PhD in Homeopathy",
    "Specialist Fellowships",
];

export const specializationOptions: { label: string; value: string }[] = [
    // General & Family Homeopathy
    { label: "General Homeopathic Practice", value: "General Homeopathic Practice" },
    { label: "Family Medicine (Homeopathy)", value: "Family Medicine Homeopathy" },
    { label: "Chronic Disease Management", value: "Chronic Disease Management" },
    { label: "Acute Disease Treatment", value: "Acute Disease Treatment" },

    // Skin & Hair Disorders
    { label: "Skin Diseases (Eczema, Psoriasis, Acne, Vitiligo)", value: "Skin Diseases" },
    { label: "Hair & Scalp Disorders (Hair Fall, Alopecia, Dandruff)", value: "Hair Scalp Disorders" },
    { label: "Allergic Skin Conditions", value: "Allergic Skin Conditions" },

    // Respiratory & Allergy
    { label: "Asthma & Bronchial Disorders", value: "Asthma Bronchial Disorders" },
    { label: "Allergic Rhinitis (Sinus, Hay Fever)", value: "Allergic Rhinitis" },
    { label: "Chronic Cough & Cold", value: "Chronic Cough Cold" },
    { label: "Tonsillitis & Throat Infections", value: "Tonsillitis Throat Infections" },

    // Digestive & Metabolic
    { label: "Gastritis & Acidity", value: "Gastritis Acidity" },
    { label: "IBS & Constipation", value: "IBS Constipation" },
    { label: "Liver Disorders", value: "Liver Disorders" },
    { label: "Diabetes (Supportive Care)", value: "Diabetes Supportive" },
    { label: "Thyroid Disorders", value: "Thyroid Disorders" },

    // Women's Health & Hormonal
    { label: "PCOS & Menstrual Disorders", value: "PCOS Menstrual Disorders" },
    { label: "Infertility (Female)", value: "Female Infertility" },
    { label: "Menopause Management", value: "Menopause Management" },
    { label: "Uterine Fibroids", value: "Uterine Fibroids" },
    { label: "Leucorrhoea", value: "Leucorrhoea" },

    // Men's Health
    { label: "Prostate Disorders", value: "Prostate Disorders" },
    { label: "Male Infertility", value: "Male Infertility" },
    { label: "Sexual Health Disorders", value: "Sexual Health Disorders" },

    // Pediatrics (Children's Diseases)
    { label: "Recurrent Infections (Pediatric)", value: "Recurrent Infections Pediatric" },
    { label: "Growth & Development Disorders", value: "Growth Development Disorders" },
    { label: "Bedwetting (Enuresis)", value: "Bedwetting Enuresis" },
    { label: "ADHD & Learning Difficulties", value: "ADHD Learning Difficulties" },

    // Mental & Emotional Health
    { label: "Anxiety Disorders", value: "Anxiety Disorders" },
    { label: "Depression", value: "Depression" },
    { label: "Stress & Sleep Disorders", value: "Stress Sleep Disorders" },
    { label: "Phobias", value: "Phobias" },
    { label: "Behavioral Disorders", value: "Behavioral Disorders" },

    // Musculoskeletal & Pain
    { label: "Arthritis", value: "Arthritis" },
    { label: "Back Pain & Sciatica", value: "Back Pain Sciatica" },
    { label: "Joint Pain", value: "Joint Pain" },
    { label: "Rheumatism", value: "Rheumatism" },

    // Neurological & Nerve Disorders
    { label: "Migraine & Headache", value: "Migraine Headache" },
    { label: "Vertigo", value: "Vertigo" },
    { label: "Epilepsy (Supportive)", value: "Epilepsy Supportive" },
    { label: "Parkinson's (Supportive)", value: "Parkinsons Supportive" },

    // ENT & Eye
    { label: "Sinusitis", value: "Sinusitis" },
    { label: "Hearing Disorders", value: "Hearing Disorders" },
    { label: "Tinnitus", value: "Tinnitus" },
    { label: "Eye Strain & Vision Complaints", value: "Eye Strain Vision" },

    // Lifestyle & Wellness
    { label: "Obesity Management", value: "Obesity Management" },
    { label: "Smoking & Alcohol De-addiction", value: "Smoking Alcohol Deaddiction" },
    { label: "Immunity Boosting", value: "Immunity Boosting" },
    { label: "Stress Management", value: "Stress Management" },

    // Chronic & Autoimmune (Supportive)
    { label: "Rheumatoid Arthritis", value: "Rheumatoid Arthritis" },
    { label: "Psoriasis", value: "Psoriasis" },
    { label: "Lupus", value: "Lupus" },
    { label: "Ulcerative Colitis", value: "Ulcerative Colitis" },

    // Legacy / General Medical Specializations
    { label: "Pediatrics (Child Health)", value: "Pediatrics" },
    { label: "Dermatology (Skin, Hair, and Nail Health)", value: "Dermatology" },
    { label: "Women's Health and Gynecology", value: "Womens Health" },
    { label: "Geriatrics (Elderly Health)", value: "Geriatrics" },
    { label: "Psychiatry and Mental Health", value: "Psychiatry" },
    { label: "Gastroenterology (Digestive Health)", value: "Gastroenterology" },
    { label: "Respiratory Medicine", value: "Respiratory Medicine" },
    { label: "Endocrinology (Hormonal Health)", value: "Endocrinology" },
    { label: "Cardiology (Heart Health)", value: "Cardiology" },
    { label: "Oncology (Cancer Support)", value: "Oncology" },
    { label: "Immunology and Allergy Management", value: "Immunology" },
    { label: "Addiction and Substance Abuse Treatment", value: "Addiction" },
    { label: "Homeopathic Dentistry", value: "Dentistry" },
    { label: "Neurology (Nervous System Disorders)", value: "Neurology" },
    { label: "Obstetrics and Midwifery", value: "Obstetrics" },
    { label: "Sports Medicine", value: "Sports Medicine" },
    { label: "Urology (Urinary and Reproductive System)", value: "Urology" },
    { label: "Homeopathic Surgery (Post-Surgical Recovery Support)", value: "Surgery" },
    { label: "Rheumatology", value: "Rheumatology" },
    { label: "Infertility and Reproductive Health", value: "Infertility" },
    { label: "Chronic Fatigue Syndrome and Fibromyalgia", value: "Chronic Fatigue" },
    { label: "Environmental Medicine", value: "Environmental Medicine" },
    { label: "Aesthetic Homeopathy", value: "Aesthetic Homeopathy" },
    { label: "Therapy", value: "Therapy" },
];
export const workingBranches: {
    branch_id: number;
    branch_location: string;
    symbol: string;
}[] = [
    { branch_id: 1, branch_location: "Kurunegala", symbol: "267" },
    { branch_id: 2, branch_location: "Rambukkana", symbol: "38" },
    { branch_id: 3, branch_location: "Ratmalana", symbol: "158" },
    { branch_id: 4, branch_location: "Rathnapura", symbol: "192" },
];
