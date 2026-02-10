"""
Comprehensive Database Seed Script for HMS
===========================================
Populates the entire database with realistic data while preserving
all foreign-key relationships and business rules.

Safe to run on an empty database. Idempotent — skips if data already exists.
All user passwords: Test@123

Run inside backend container:
    docker compose exec backend python comprehensive_seed.py

Or from host (with correct DATABASE_URL):
    cd backend && python comprehensive_seed.py
"""

import asyncio
import json
from datetime import date, time, datetime, timedelta, timezone
from uuid import uuid4
from typing import List, Dict, Any

from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import async_engine as engine
from app.core.security import get_password_hash

# ── Model imports ──────────────────────────────────────────────────
from app.models.user import User
from app.models.branch import Branch
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.pharmacy import Pharmacy
from app.models.staff_pharmacist import Pharmacist
from app.models.appointment import Appointment
from app.models.appointment_extras import AppointmentSettings, AppointmentAuditLog
from app.models.doctor_schedule import DoctorSchedule
from app.models.doctor_availability import DoctorAvailability
from app.models.pharmacy_inventory import (
    Supplier, Product, ProductStock, PharmacyInventory,
    InventoryBatch, PharmacyStockTransaction, Prescription,
)
from app.models.pos import (
    BillingTransaction, TransactionItem, CashRegister,
    CashEntry, DailyCashSummary, EODReport,
)
from app.models.consultation import (
    Consultation, ConsultationDiagnosis, ConsultationPrescription,
)
from app.models.visit import Visit, Queue
from app.models.purchase_request import PurchaseRequest, PurchaseRequestItem
from app.models.hrm_leave import LeaveType, Leave
from app.models.hrm_salary import StaffSalary
from app.models.hrm_shift import EmployeeShift, Attendance, BankDetail
from app.models.notification import Notification
from app.models.website import SystemSettings, WebDoctor, WebService, ContactMessage
from app.models.chatbot import ChatbotFAQ
from app.models.nurse_domain import VitalSign
from app.models.patient_dashboard import HealthCondition, Feedback
from app.models.medical_insights import MedicalPost
from app.models.doctor_main_question import DoctorMainQuestion
from app.models.doctor_session import DoctorCreatedDisease

# ── Helpers ────────────────────────────────────────────────────────
PASSWORD_HASH = get_password_hash("Test@123")
NOW = datetime.now(timezone.utc)


def uid() -> str:
    return str(uuid4())


def future_date(days: int) -> date:
    return (NOW + timedelta(days=days)).date()


def past_date(days: int) -> date:
    return (NOW - timedelta(days=days)).date()


# ══════════════════════════════════════════════════════════════════
#  DETERMINISTIC IDS  (so FK references work without lookups)
# ══════════════════════════════════════════════════════════════════

# ── Branch IDs ─────────────────────────────────────────────────────
BRANCH_IDS = [
    "b0000001-0000-0000-0000-000000000001",
    "b0000001-0000-0000-0000-000000000002",
    "b0000001-0000-0000-0000-000000000003",
]

# ── User IDs  (role_as values: 1=SuperAdmin 2=BranchAdmin 3=Doctor
#   4=Nurse 5=Patient 6=Cashier 7=Pharmacist 8=ITSupport 9=CenterAid 10=Auditor)
SUPER_ADMIN_IDS = [
    "u1000001-0000-0000-0000-000000000001",
    "u1000001-0000-0000-0000-000000000002",
]
BRANCH_ADMIN_IDS = [
    "u2000001-0000-0000-0000-000000000001",
    "u2000001-0000-0000-0000-000000000002",
    "u2000001-0000-0000-0000-000000000003",
]
DOCTOR_USER_IDS = [f"u3000001-0000-0000-0000-{str(i).zfill(12)}" for i in range(1, 13)]
NURSE_USER_IDS = [f"u4000001-0000-0000-0000-{str(i).zfill(12)}" for i in range(1, 9)]
PATIENT_USER_IDS = [f"u5000001-0000-0000-0000-{str(i).zfill(12)}" for i in range(1, 26)]
CASHIER_USER_IDS = [f"u6000001-0000-0000-0000-{str(i).zfill(12)}" for i in range(1, 5)]
PHARMACIST_USER_IDS = [f"u7000001-0000-0000-0000-{str(i).zfill(12)}" for i in range(1, 7)]
IT_SUPPORT_IDS = ["u8000001-0000-0000-0000-000000000001"]
RECEPTIONIST_IDS = [f"u9000001-0000-0000-0000-{str(i).zfill(12)}" for i in range(1, 4)]

# ── Doctor profile IDs ────────────────────────────────────────────
DOCTOR_IDS = [f"d0000001-0000-0000-0000-{str(i).zfill(12)}" for i in range(1, 13)]

# ── Patient profile IDs ──────────────────────────────────────────
PATIENT_IDS = [f"p0000001-0000-0000-0000-{str(i).zfill(12)}" for i in range(1, 26)]

# ── Pharmacist profile IDs ───────────────────────────────────────
PHARMACIST_PROFILE_IDS = [f"ph000001-0000-0000-0000-{str(i).zfill(12)}" for i in range(1, 7)]

# ── Pharmacy IDs ─────────────────────────────────────────────────
PHARMACY_IDS = [f"rx000001-0000-0000-0000-{str(i).zfill(12)}" for i in range(1, 5)]

# ── Supplier IDs ─────────────────────────────────────────────────
SUPPLIER_IDS = [f"s0000001-0000-0000-0000-{str(i).zfill(12)}" for i in range(1, 6)]

# ── Product IDs ──────────────────────────────────────────────────
PRODUCT_IDS = [f"pr000001-0000-0000-0000-{str(i).zfill(12)}" for i in range(1, 41)]

# ── Schedule / Availability IDs ──────────────────────────────────
SCHEDULE_IDS = [f"sc000001-0000-0000-0000-{str(i).zfill(12)}" for i in range(1, 25)]
AVAILABILITY_IDS = [f"av000001-0000-0000-0000-{str(i).zfill(12)}" for i in range(1, 31)]

# ── Appointment IDs ──────────────────────────────────────────────
APPOINTMENT_IDS = [f"ap000001-0000-0000-0000-{str(i).zfill(12)}" for i in range(1, 21)]

# ── Leave Type IDs ───────────────────────────────────────────────
LEAVE_TYPE_IDS = [f"lt000001-0000-0000-0000-{str(i).zfill(12)}" for i in range(1, 7)]

# ══════════════════════════════════════════════════════════════════
#  DATA DEFINITIONS
# ══════════════════════════════════════════════════════════════════

SPECIALIZATIONS = [
    "General Medicine",
    "Cardiology",
    "Dermatology",
    "Pediatrics",
    "Orthopedics",
    "ENT",
    "Neurology",
    "Gynecology",
]


# ── Branches ─────────────────────────────────────────────────────
def get_branches() -> List[Branch]:
    data = [
        {
            "id": BRANCH_IDS[0],
            "center_name": "CURE Medical Center - Colombo",
            "register_number": "REG-CMB-001",
            "center_type": "Medical Center",
            "division": "Western",
            "division_number": "WP01",
            "owner_type": "Private",
            "owner_full_name": "Dr. Saman Perera",
            "owner_id_number": "881234567V",
            "owner_contact_number": "+94771234567",
        },
        {
            "id": BRANCH_IDS[1],
            "center_name": "CURE Medical Center - Kandy",
            "register_number": "REG-KDY-002",
            "center_type": "Medical Center",
            "division": "Central",
            "division_number": "CP02",
            "owner_type": "Private",
            "owner_full_name": "Dr. Nimal Fernando",
            "owner_id_number": "791234568V",
            "owner_contact_number": "+94772234567",
        },
        {
            "id": BRANCH_IDS[2],
            "center_name": "CURE Medical Center - Galle",
            "register_number": "REG-GLE-003",
            "center_type": "Medical Center",
            "division": "Southern",
            "division_number": "SP03",
            "owner_type": "Private",
            "owner_full_name": "Dr. Kumari Silva",
            "owner_id_number": "851234569V",
            "owner_contact_number": "+94773234567",
        },
    ]
    return [Branch(**d) for d in data]


# ── Users ────────────────────────────────────────────────────────
def _user(
    id: str,
    email: str,
    username: str,
    role_as: int,
    first_name: str,
    last_name: str,
    *,
    branch_id: str = None,
    gender: str = "Male",
    contact: str = None,
    basic_salary: float = None,
    employee_id: str = None,
    qualifications: str = None,
    years_of_experience: int = None,
) -> User:
    return User(
        id=id,
        email=email,
        username=username,
        hashed_password=PASSWORD_HASH,
        role_as=role_as,
        branch_id=branch_id,
        is_active=True,
        first_name=first_name,
        last_name=last_name,
        gender=gender,
        contact_number_mobile=contact or f"+9477{str(hash(id))[-7:]}",
        basic_salary=basic_salary,
        employee_id=employee_id,
        qualifications=qualifications,
        years_of_experience=years_of_experience,
    )


def get_users() -> List[User]:
    users = []

    # ── Super Admins (role_as=1) ─────────────────────────────────
    users.append(_user(SUPER_ADMIN_IDS[0], "admin@hospital.com", "Super Admin", 1,
                       "Dilshan", "Pathirana", employee_id="CUREWP01A2501A0001"))
    users.append(_user(SUPER_ADMIN_IDS[1], "admin2@hospital.com", "Super Admin 2", 1,
                       "Kasun", "Rajapaksha", employee_id="CUREWP01A2502B0002"))

    # ── Branch Admins (role_as=2) — NOT assigned to branches yet ─
    ba_names = [("Nuwan", "Bandara"), ("Chaminda", "Jayasinghe"), ("Ruwan", "Wijesinghe")]
    for i, (fn, ln) in enumerate(ba_names):
        users.append(_user(
            BRANCH_ADMIN_IDS[i],
            f"branchadmin{i+1}@hospital.com",
            f"Branch Admin {fn}",
            2, fn, ln,
            employee_id=f"CURE-BA-{i+1:04d}",
            basic_salary=85000.0,
        ))

    # ── Doctors (role_as=3) — NOT assigned to branches ───────────
    doctor_names = [
        ("Anil", "Kumara", "General Medicine", "MBBS, MD"),
        ("Priya", "Dissanayake", "Cardiology", "MBBS, MD Cardiology"),
        ("Roshan", "de Silva", "Dermatology", "MBBS, MD Dermatology"),
        ("Malini", "Herath", "Pediatrics", "MBBS, DCH"),
        ("Suresh", "Gunasekara", "Orthopedics", "MBBS, MS Ortho"),
        ("Chamari", "Weerasinghe", "ENT", "MBBS, MS ENT"),
        ("Dinesh", "Mendis", "Neurology", "MBBS, MD Neuro"),
        ("Fathima", "Nazeer", "Gynecology", "MBBS, MS Obs/Gyn"),
        ("Lakmal", "Perera", "General Medicine", "MBBS, MD"),
        ("Thilini", "Karunaratne", "Cardiology", "MBBS, MD Cardiology"),
        ("Ranjith", "Amarasinghe", "Dermatology", "MBBS, MD"),
        ("Sampath", "Liyanage", "Pediatrics", "MBBS, DCH, MD"),
    ]
    for i, (fn, ln, spec, qual) in enumerate(doctor_names):
        users.append(_user(
            DOCTOR_USER_IDS[i],
            f"doctor{i+1}@hospital.com",
            f"Dr. {fn} {ln}",
            3, fn, ln,
            gender="Female" if fn in ("Priya", "Malini", "Chamari", "Fathima", "Thilini") else "Male",
            employee_id=f"CURE-DR-{i+1:04d}",
            basic_salary=150000.0 + i * 5000,
            qualifications=qual,
            years_of_experience=5 + i,
        ))

    # ── Nurses (role_as=4) ───────────────────────────────────────
    nurse_names = [
        ("Sanduni", "Fernando"), ("Nimali", "Cooray"), ("Hasini", "Rathnayake"),
        ("Gayani", "Seneviratne"), ("Wasana", "Wickramasinghe"), ("Dilini", "Jayawardena"),
        ("Pamodi", "Abeysinghe"), ("Chathurika", "Gunawardena"),
    ]
    for i, (fn, ln) in enumerate(nurse_names):
        users.append(_user(
            NURSE_USER_IDS[i],
            f"nurse{i+1}@hospital.com",
            f"Nurse {fn}",
            4, fn, ln,
            gender="Female",
            employee_id=f"CURE-NR-{i+1:04d}",
            basic_salary=55000.0 + i * 2000,
        ))

    # ── Patients (role_as=5) ─────────────────────────────────────
    patient_names = [
        ("Kavindu", "Silva", "Male"), ("Sachini", "Perera", "Female"),
        ("Nadeesha", "Gamage", "Female"), ("Tharuka", "Rajapaksha", "Male"),
        ("Iresha", "Bandara", "Female"), ("Chanaka", "Dissanayake", "Male"),
        ("Anusha", "Jayasinghe", "Female"), ("Lahiru", "Wijesinghe", "Male"),
        ("Dilhani", "Herath", "Female"), ("Ravindra", "Kumara", "Male"),
        ("Sandani", "de Silva", "Female"), ("Tharindu", "Gunasekara", "Male"),
        ("Ishara", "Weerasinghe", "Female"), ("Hasitha", "Mendis", "Male"),
        ("Nethmi", "Nazeer", "Female"), ("Dulanjana", "Liyanage", "Male"),
        ("Upeksha", "Amarasinghe", "Female"), ("Charith", "Karunaratne", "Male"),
        ("Rashmi", "Cooray", "Female"), ("Ashen", "Rathnayake", "Male"),
        ("Pawani", "Seneviratne", "Female"), ("Dinuka", "Wickramasinghe", "Male"),
        ("Maneesha", "Jayawardena", "Female"), ("Supun", "Abeysinghe", "Male"),
        ("Hiruni", "Gunawardena", "Female"),
    ]
    for i, (fn, ln, g) in enumerate(patient_names):
        users.append(_user(
            PATIENT_USER_IDS[i],
            f"patient{i+1}@hospital.com",
            f"Patient {fn} {ln}",
            5, fn, ln, gender=g,
        ))

    # ── Cashiers (role_as=6) ─────────────────────────────────────
    cashier_names = [("Ashan", "Fernando"), ("Madusha", "Jayasekara"),
                     ("Kumudini", "Ranasinghe"), ("Thilanka", "Ekanayake")]
    for i, (fn, ln) in enumerate(cashier_names):
        users.append(_user(
            CASHIER_USER_IDS[i],
            f"cashier{i+1}@hospital.com",
            f"Cashier {fn}",
            6, fn, ln,
            gender="Female" if fn in ("Kumudini",) else "Male",
            employee_id=f"CURE-CS-{i+1:04d}",
            basic_salary=45000.0,
        ))

    # ── Pharmacists (role_as=7) ──────────────────────────────────
    pharm_names = [
        ("Harsha", "Samarasinghe"), ("Nadeeka", "Jayakody"),
        ("Isuru", "Madushanka"), ("Thushara", "Wimalasena"),
        ("Anjali", "Ranawaka"), ("Priyanath", "Senanayake"),
    ]
    for i, (fn, ln) in enumerate(pharm_names):
        users.append(_user(
            PHARMACIST_USER_IDS[i],
            f"pharmacist{i+1}@hospital.com",
            f"Pharmacist {fn}",
            7, fn, ln,
            gender="Female" if fn in ("Nadeeka", "Anjali") else "Male",
            employee_id=f"CURE-PH-{i+1:04d}",
            basic_salary=65000.0,
            qualifications="B.Pharm",
        ))

    # ── IT Support (role_as=8) ───────────────────────────────────
    users.append(_user(
        IT_SUPPORT_IDS[0], "itsupport@hospital.com", "IT Support Asanka", 8,
        "Asanka", "Jayalath", employee_id="CURE-IT-0001", basic_salary=60000.0,
    ))

    # ── Receptionists (role_as=9 = CenterAid) ───────────────────
    rec_names = [("Nilmini", "Samarakoon"), ("Chathura", "Tennakoon"), ("Sewwandi", "Ranatunga")]
    for i, (fn, ln) in enumerate(rec_names):
        users.append(_user(
            RECEPTIONIST_IDS[i],
            f"receptionist{i+1}@hospital.com",
            f"Receptionist {fn}",
            9, fn, ln,
            gender="Female" if fn in ("Nilmini", "Sewwandi") else "Male",
            employee_id=f"CURE-RC-{i+1:04d}",
            basic_salary=40000.0,
        ))

    return users


# ── Doctor Profiles ──────────────────────────────────────────────
def get_doctors() -> List[Doctor]:
    doctor_specs = [
        ("General Medicine", "MBBS, MD", 6),
        ("Cardiology", "MBBS, MD Cardiology", 10),
        ("Dermatology", "MBBS, MD Dermatology", 8),
        ("Pediatrics", "MBBS, DCH", 7),
        ("Orthopedics", "MBBS, MS Ortho", 12),
        ("ENT", "MBBS, MS ENT", 9),
        ("Neurology", "MBBS, MD Neuro", 11),
        ("Gynecology", "MBBS, MS Obs/Gyn", 15),
        ("General Medicine", "MBBS, MD", 5),
        ("Cardiology", "MBBS, MD Cardiology", 8),
        ("Dermatology", "MBBS, MD", 6),
        ("Pediatrics", "MBBS, DCH, MD", 10),
    ]
    doctors = []
    for i, (spec, qual, exp) in enumerate(doctor_specs):
        fn = ["Anil", "Priya", "Roshan", "Malini", "Suresh", "Chamari",
              "Dinesh", "Fathima", "Lakmal", "Thilini", "Ranjith", "Sampath"][i]
        ln = ["Kumara", "Dissanayake", "de Silva", "Herath", "Gunasekara", "Weerasinghe",
              "Mendis", "Nazeer", "Perera", "Karunaratne", "Amarasinghe", "Liyanage"][i]
        doctors.append(Doctor(
            id=DOCTOR_IDS[i],
            user_id=DOCTOR_USER_IDS[i],
            branch_id=None,  # NOT assigned to branches
            first_name=fn,
            last_name=ln,
            specialization=spec,
            qualification=qual,
            contact_number=f"+9477{1000000 + i}",
            experience_years=exp,
        ))
    return doctors


# ── Patient Profiles ─────────────────────────────────────────────
def get_patients() -> List[Patient]:
    patients = []
    blood_groups = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"]
    genders = ["Male", "Female", "Female", "Male", "Female", "Male", "Female", "Male",
               "Female", "Male", "Female", "Male", "Female", "Male", "Female", "Male",
               "Female", "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female"]
    for i in range(25):
        patients.append(Patient(
            id=PATIENT_IDS[i],
            user_id=PATIENT_USER_IDS[i],
            date_of_birth=date(1985 + (i % 30), (i % 12) + 1, (i % 28) + 1),
            gender=genders[i],
            blood_group=blood_groups[i % len(blood_groups)],
            address=f"{100 + i} Main Street, Colombo {i % 15 + 1}",
            contact_number=f"+9477{2000000 + i}",
            emergency_contact=f"+9477{3000000 + i}",
        ))
    return patients


# ── Pharmacist Profiles ──────────────────────────────────────────
def get_pharmacist_profiles() -> List[Pharmacist]:
    profiles = []
    pharm_names = [
        ("Harsha", "Samarasinghe", "Male"), ("Nadeeka", "Jayakody", "Female"),
        ("Isuru", "Madushanka", "Male"), ("Thushara", "Wimalasena", "Male"),
        ("Anjali", "Ranawaka", "Female"), ("Priyanath", "Senanayake", "Male"),
    ]
    for i, (fn, ln, g) in enumerate(pharm_names):
        profiles.append(Pharmacist(
            id=PHARMACIST_PROFILE_IDS[i],
            user_id=PHARMACIST_USER_IDS[i],
            first_name=fn,
            last_name=ln,
            gender=g,
            pharmacist_registration_number=f"SLMC-PH-{2020 + i}-{i+1:04d}",
            years_of_experience=3 + i,
            qualifications="B.Pharm",
            basic_salary=65000.0 + i * 2000,
        ))
    return profiles


# ── Pharmacies ───────────────────────────────────────────────────
def get_pharmacies() -> List[Pharmacy]:
    data = [
        ("CURE Pharmacy - Colombo Main", "PH-CMB-001", "LIC-PH-2024-001", "Colombo 07"),
        ("CURE Pharmacy - Kandy", "PH-KDY-002", "LIC-PH-2024-002", "Kandy City Center"),
        ("CURE Pharmacy - Galle", "PH-GLE-003", "LIC-PH-2024-003", "Galle Fort Junction"),
        ("CURE Pharmacy - Colombo Annex", "PH-CMB-004", "LIC-PH-2024-004", "Colombo 03"),
    ]
    pharmacies = []
    for i, (name, code, lic, loc) in enumerate(data):
        pharmacies.append(Pharmacy(
            id=PHARMACY_IDS[i],
            name=name,
            pharmacy_code=code,
            license_number=lic,
            license_expiry_date=future_date(365),
            location=loc,
            phone=f"+94112{300000 + i}",
            email=f"pharmacy{i+1}@cure.lk",
            status="active",
            branch_id=None,       # NOT assigned to branches yet
            pharmacist_id=None,   # NOT assigned yet
        ))
    return pharmacies


# ── Suppliers ────────────────────────────────────────────────────
def get_suppliers() -> List[Supplier]:
    data = [
        ("Ceylon Pharma Ltd", "Nimal Jayawardena", "+94112456001", "cpl@suppliers.lk",
         "42 Industrial Zone, Kelaniya", "Net 30"),
        ("Medipharm Holdings", "Kumari Ranasinghe", "+94112456002", "medipharm@suppliers.lk",
         "15 Hospital Road, Ragama", "Net 45"),
        ("Global Medical Supplies", "Ranjith Perera", "+94112456003", "gms@suppliers.lk",
         "78 Trade Center, Ratmalana", "COD"),
        ("Lanka Surgical Instruments", "Tharanga Silva", "+94112456004", "lsi@suppliers.lk",
         "23 Science Park, Moratuwa", "Net 30"),
        ("Ayura Naturals (Pvt) Ltd", "Sanduni Herath", "+94112456005", "ayura@suppliers.lk",
         "5 Green Avenue, Kaduwela", "Net 60"),
    ]
    suppliers = []
    for i, (name, cp, phone, email, addr, terms) in enumerate(data):
        suppliers.append(Supplier(
            id=SUPPLIER_IDS[i],
            name=name,
            contact_person=cp,
            phone=phone,
            email=email,
            address=addr,
            payment_terms=terms,
            is_active=True,
        ))
    return suppliers


# ── Products ─────────────────────────────────────────────────────
def get_products() -> List[Product]:
    product_data = [
        # (name, generic_name, category, unit, supplier_idx, requires_rx)
        ("Paracetamol 500mg", "Paracetamol", "Analgesics", "tablet", 0, False),
        ("Amoxicillin 500mg", "Amoxicillin", "Antibiotics", "capsule", 0, True),
        ("Omeprazole 20mg", "Omeprazole", "Gastrointestinal", "capsule", 0, True),
        ("Metformin 500mg", "Metformin", "Diabetes", "tablet", 1, True),
        ("Amlodipine 5mg", "Amlodipine", "Cardiovascular", "tablet", 1, True),
        ("Atorvastatin 10mg", "Atorvastatin", "Cardiovascular", "tablet", 1, True),
        ("Cetirizine 10mg", "Cetirizine", "Antihistamines", "tablet", 0, False),
        ("Ibuprofen 400mg", "Ibuprofen", "Analgesics", "tablet", 0, False),
        ("Losartan 50mg", "Losartan", "Cardiovascular", "tablet", 1, True),
        ("Salbutamol Inhaler", "Salbutamol", "Respiratory", "unit", 2, True),
        ("Diclofenac Gel 1%", "Diclofenac", "Topical", "tube", 2, False),
        ("Metoprolol 50mg", "Metoprolol", "Cardiovascular", "tablet", 1, True),
        ("Azithromycin 500mg", "Azithromycin", "Antibiotics", "tablet", 0, True),
        ("Pantoprazole 40mg", "Pantoprazole", "Gastrointestinal", "tablet", 0, True),
        ("Clopidogrel 75mg", "Clopidogrel", "Cardiovascular", "tablet", 1, True),
        ("Gabapentin 300mg", "Gabapentin", "Neurological", "capsule", 2, True),
        ("Prednisolone 5mg", "Prednisolone", "Corticosteroids", "tablet", 2, True),
        ("Fluoxetine 20mg", "Fluoxetine", "Psychiatric", "capsule", 2, True),
        ("Vitamin D3 1000IU", "Cholecalciferol", "Vitamins", "capsule", 4, False),
        ("Calcium 500mg + D3", "Calcium Carbonate", "Vitamins", "tablet", 4, False),
        ("Folic Acid 5mg", "Folic Acid", "Vitamins", "tablet", 4, False),
        ("Iron Supplement", "Ferrous Sulfate", "Vitamins", "tablet", 4, False),
        ("Betadine Solution", "Povidone-Iodine", "Antiseptics", "ml", 3, False),
        ("Normal Saline 500ml", "Sodium Chloride 0.9%", "IV Fluids", "ml", 3, False),
        ("Surgical Gloves (M)", "Latex Gloves", "Surgical Supplies", "unit", 3, False),
        ("Disposable Syringes 5ml", "Syringe", "Surgical Supplies", "unit", 3, False),
        ("Cotton Rolls 500g", "Absorbent Cotton", "Surgical Supplies", "unit", 3, False),
        ("Bandage Crepe 4in", "Crepe Bandage", "Surgical Supplies", "unit", 3, False),
        ("Hand Sanitizer 500ml", "Ethanol 70%", "Antiseptics", "ml", 4, False),
        ("Face Mask (Box 50)", "Surgical Mask", "PPE", "unit", 3, False),
        ("Ciprofloxacin 500mg", "Ciprofloxacin", "Antibiotics", "tablet", 0, True),
        ("Ranitidine 150mg", "Ranitidine", "Gastrointestinal", "tablet", 0, True),
        ("Montelukast 10mg", "Montelukast", "Respiratory", "tablet", 2, True),
        ("Warfarin 5mg", "Warfarin", "Cardiovascular", "tablet", 1, True),
        ("Levothyroxine 50mcg", "Levothyroxine", "Endocrine", "tablet", 1, True),
        ("Insulin Glargine", "Insulin", "Diabetes", "ml", 1, True),
        ("Tramadol 50mg", "Tramadol", "Analgesics", "capsule", 2, True),
        ("Diazepam 5mg", "Diazepam", "Psychiatric", "tablet", 2, True),
        ("Chlorhexidine Mouthwash", "Chlorhexidine", "Oral Care", "ml", 4, False),
        ("Multivitamin Tablets", "Multivitamin", "Vitamins", "tablet", 4, False),
    ]
    products = []
    for i, (name, gen, cat, unit, sup_idx, rx) in enumerate(product_data):
        products.append(Product(
            id=PRODUCT_IDS[i],
            name=name,
            generic_name=gen,
            category=cat,
            unit=unit,
            description=f"{name} - {gen}",
            supplier_id=SUPPLIER_IDS[sup_idx],
            requires_prescription=rx,
            is_active=True,
        ))
    return products


# ── Product Stock (link products to branches) ────────────────────
def get_product_stock() -> List[ProductStock]:
    stocks = []
    for b_idx, branch_id in enumerate(BRANCH_IDS):
        for p_idx in range(len(PRODUCT_IDS)):
            qty = 50 + (p_idx * 3) + (b_idx * 10)
            stocks.append(ProductStock(
                id=uid(),
                product_id=PRODUCT_IDS[p_idx],
                branch_id=branch_id,
                pharmacy_id=PHARMACY_IDS[b_idx] if b_idx < len(PHARMACY_IDS) else None,
                quantity=qty,
                batch_number=f"BN-{2026}{(b_idx+1):02d}{(p_idx+1):03d}",
                expiry_date=future_date(180 + p_idx * 10),
                purchase_price=round(5.0 + p_idx * 2.5, 2),
                selling_price=round(8.0 + p_idx * 3.5, 2),
                reorder_level=10 + (p_idx % 5),
            ))
    return stocks


# ── Doctor Schedules (weekly recurring) ──────────────────────────
def get_doctor_schedules() -> List[DoctorSchedule]:
    schedules = []
    idx = 0
    # Each of first 8 doctors works at 2-3 branches, different days
    assignments = [
        # (doctor_idx, branch_idx, day_of_week, start_h, end_h)
        (0, 0, 0, 8, 12),   # Dr Anil @ Colombo Mon
        (0, 0, 3, 8, 12),   # Dr Anil @ Colombo Thu
        (0, 1, 2, 14, 18),  # Dr Anil @ Kandy Wed
        (1, 0, 1, 9, 13),   # Dr Priya @ Colombo Tue
        (1, 1, 4, 9, 13),   # Dr Priya @ Kandy Fri
        (2, 0, 2, 8, 12),   # Dr Roshan @ Colombo Wed
        (2, 2, 0, 14, 18),  # Dr Roshan @ Galle Mon
        (3, 1, 0, 8, 12),   # Dr Malini @ Kandy Mon
        (3, 1, 3, 14, 18),  # Dr Malini @ Kandy Thu
        (3, 2, 5, 9, 13),   # Dr Malini @ Galle Sat
        (4, 0, 4, 8, 14),   # Dr Suresh @ Colombo Fri
        (4, 2, 1, 8, 14),   # Dr Suresh @ Galle Tue
        (5, 0, 5, 8, 12),   # Dr Chamari @ Colombo Sat
        (5, 1, 1, 14, 18),  # Dr Chamari @ Kandy Tue
        (6, 2, 2, 8, 12),   # Dr Dinesh @ Galle Wed
        (6, 0, 3, 14, 18),  # Dr Dinesh @ Colombo Thu
        (7, 1, 5, 9, 13),   # Dr Fathima @ Kandy Sat
        (7, 2, 4, 9, 13),   # Dr Fathima @ Galle Fri
        (8, 0, 1, 14, 18),  # Dr Lakmal @ Colombo Tue
        (8, 2, 3, 8, 12),   # Dr Lakmal @ Galle Thu
        (9, 1, 2, 8, 12),   # Dr Thilini @ Kandy Wed
        (9, 0, 4, 14, 18),  # Dr Thilini @ Colombo Fri
        (10, 2, 0, 8, 12),  # Dr Ranjith @ Galle Mon
        (11, 1, 4, 14, 18), # Dr Sampath @ Kandy Fri
    ]
    for doc_idx, br_idx, dow, sh, eh in assignments:
        if idx < len(SCHEDULE_IDS):
            schedules.append(DoctorSchedule(
                id=SCHEDULE_IDS[idx],
                doctor_id=DOCTOR_IDS[doc_idx],
                branch_id=BRANCH_IDS[br_idx],
                day_of_week=dow,
                start_time=time(sh, 0),
                end_time=time(eh, 0),
                slot_duration_minutes=20,
                max_patients=int((eh - sh) * 60 / 20),
                status="active",
                recurrence_type="weekly",
                valid_from=past_date(30),
                valid_until=future_date(180),
            ))
            idx += 1
    return schedules


# ── Doctor Availability (specific dates, next 2 weeks) ───────────
def get_doctor_availability() -> List[DoctorAvailability]:
    avails = []
    idx = 0
    today = NOW.date()
    for day_offset in range(1, 15):
        d = today + timedelta(days=day_offset)
        dow = d.weekday()
        for doc_idx in range(min(8, len(DOCTOR_IDS))):
            # Each doctor available ~3 days/week
            if (doc_idx + dow) % 3 == 0 and idx < len(AVAILABILITY_IDS):
                br_idx = (doc_idx + day_offset) % len(BRANCH_IDS)
                spec = SPECIALIZATIONS[doc_idx % len(SPECIALIZATIONS)]
                avails.append(DoctorAvailability(
                    id=AVAILABILITY_IDS[idx],
                    doctor_id=DOCTOR_IDS[doc_idx],
                    branch_id=BRANCH_IDS[br_idx],
                    specialisation=spec,
                    availability_date=d,
                    start_time=time(9, 0),
                    end_time=time(13, 0),
                    slot_minutes=20,
                    is_blocked=False,
                ))
                idx += 1
    return avails


# ── Appointments ─────────────────────────────────────────────────
def get_appointments() -> List[Appointment]:
    appointments = []
    statuses = ["pending", "confirmed", "completed", "cancelled", "confirmed",
                "completed", "pending", "confirmed", "in_progress", "completed",
                "confirmed", "pending", "completed", "confirmed", "no_show",
                "completed", "confirmed", "pending", "completed", "confirmed"]
    pay_statuses = ["unpaid", "paid", "paid", "unpaid", "paid",
                    "paid", "unpaid", "paid", "paid", "paid",
                    "paid", "unpaid", "paid", "paid", "unpaid",
                    "paid", "paid", "unpaid", "paid", "paid"]
    today = NOW.date()
    for i in range(20):
        doc_idx = i % len(DOCTOR_IDS)
        pat_idx = i % len(PATIENT_IDS)
        br_idx = i % len(BRANCH_IDS)
        day_offset = (i - 10)  # some past, some future
        appt_date = today + timedelta(days=day_offset)
        appt_time = time(9 + (i % 4), (i * 15) % 60)
        appointments.append(Appointment(
            id=APPOINTMENT_IDS[i],
            patient_id=PATIENT_IDS[pat_idx],
            doctor_id=DOCTOR_IDS[doc_idx],
            branch_id=BRANCH_IDS[br_idx],
            appointment_date=appt_date,
            appointment_time=appt_time,
            appointment_number=f"APT-{2026}{(i+1):04d}",
            department=SPECIALIZATIONS[doc_idx % len(SPECIALIZATIONS)],
            reason="General checkup" if i % 3 == 0 else ("Follow-up visit" if i % 3 == 1 else "Consultation"),
            status=statuses[i],
            payment_status=pay_statuses[i],
            payment_amount=1500.0 + (i * 100),
            payment_method="cash" if i % 2 == 0 else "card",
            is_walk_in=(i % 5 == 0),
            queue_number=i + 1,
        ))
    return appointments


# ── Appointment Settings ─────────────────────────────────────────
def get_appointment_settings() -> List[AppointmentSettings]:
    return [
        AppointmentSettings(
            id=uid(), branch_id=BRANCH_IDS[i],
            max_daily_appointments=50 + i * 10,
            slot_duration=20,
            booking_advance_days=30,
            cancellation_deadline_hours=24,
            payment_required=(i == 0),
        )
        for i in range(3)
    ]


# ── Visits ───────────────────────────────────────────────────────
def get_visits() -> List[Visit]:
    visits = []
    for i in range(15):
        visits.append(Visit(
            id=uid(),
            visit_number=f"VIS-{2026}{(i+1):04d}",
            patient_id=PATIENT_IDS[i % len(PATIENT_IDS)],
            doctor_id=DOCTOR_IDS[i % len(DOCTOR_IDS)],
            branch_id=BRANCH_IDS[i % len(BRANCH_IDS)],
            appointment_id=APPOINTMENT_IDS[i] if i < len(APPOINTMENT_IDS) else None,
            visit_type="opd" if i % 3 == 0 else ("follow_up" if i % 3 == 1 else "emergency"),
            department=SPECIALIZATIONS[i % len(SPECIALIZATIONS)],
            reason="Routine checkup" if i % 2 == 0 else "Follow-up consultation",
            status="completed" if i < 10 else "registered",
        ))
    return visits


# ── Queue ────────────────────────────────────────────────────────
def get_queues() -> List[Queue]:
    queues = []
    for i in range(10):
        queues.append(Queue(
            id=uid(),
            patient_id=PATIENT_IDS[i],
            doctor_id=DOCTOR_IDS[i % len(DOCTOR_IDS)],
            branch_id=BRANCH_IDS[i % len(BRANCH_IDS)],
            token_number=i + 1,
            visit_type="appointment" if i % 2 == 0 else "walk_in",
            priority="normal" if i % 3 != 0 else "urgent",
            department=SPECIALIZATIONS[i % len(SPECIALIZATIONS)],
            status="waiting" if i > 5 else ("called" if i > 2 else "completed"),
        ))
    return queues


# ── Consultations ────────────────────────────────────────────────
def get_consultations():
    consults = []
    diagnoses = []
    prescriptions = []
    complaints = [
        "Persistent headache for 3 days", "Chest pain on exertion", "Skin rash on forearms",
        "High fever with cough", "Knee pain after fall", "Recurrent ear infection",
        "Numbness in left hand", "Irregular menstruation", "General fatigue", "Lower back pain",
    ]
    diag_data = [
        ("J06.9", "Acute upper respiratory infection"), ("I10", "Essential hypertension"),
        ("L30.9", "Dermatitis"), ("J18.9", "Pneumonia"), ("M17.1", "Knee osteoarthritis"),
        ("H66.9", "Otitis media"), ("G56.0", "Carpal tunnel syndrome"),
        ("N92.1", "Menorrhagia"), ("R53", "Malaise and fatigue"), ("M54.5", "Low back pain"),
    ]
    med_data = [
        ("Paracetamol 500mg", "500mg", "3 times daily", "5 days", 15),
        ("Amoxicillin 500mg", "500mg", "3 times daily", "7 days", 21),
        ("Omeprazole 20mg", "20mg", "Once daily", "14 days", 14),
        ("Ibuprofen 400mg", "400mg", "2 times daily", "5 days", 10),
        ("Cetirizine 10mg", "10mg", "Once daily", "10 days", 10),
    ]

    for i in range(10):
        c_id = uid()
        consults.append(Consultation(
            id=c_id,
            appointment_id=APPOINTMENT_IDS[i] if i < len(APPOINTMENT_IDS) else None,
            doctor_id=DOCTOR_IDS[i % len(DOCTOR_IDS)],
            patient_id=PATIENT_IDS[i % len(PATIENT_IDS)],
            branch_id=BRANCH_IDS[i % len(BRANCH_IDS)],
            status="completed" if i < 7 else "in_progress",
            chief_complaint=complaints[i],
            history="No significant past medical history" if i % 2 == 0 else "Known hypertension",
            examination="Vitals within normal limits" if i % 2 == 0 else "Elevated BP 150/90",
            notes="Follow up in 2 weeks" if i % 3 == 0 else None,
        ))
        code, name = diag_data[i]
        diagnoses.append(ConsultationDiagnosis(
            id=uid(),
            consultation_id=c_id,
            diagnosis_code=code,
            diagnosis_name=name,
            diagnosis_type="primary",
        ))
        med_name, dosage, freq, dur, qty = med_data[i % len(med_data)]
        prescriptions.append(ConsultationPrescription(
            id=uid(),
            consultation_id=c_id,
            medicine_name=med_name,
            dosage=dosage,
            frequency=freq,
            duration=dur,
            instructions="Take after meals",
            quantity=qty,
        ))

    return consults, diagnoses, prescriptions


# ── Leave Types ──────────────────────────────────────────────────
def get_leave_types() -> List[LeaveType]:
    data = [
        ("Annual Leave", 14, True, True),
        ("Sick Leave", 7, True, False),
        ("Casual Leave", 7, True, True),
        ("Maternity Leave", 84, True, True),
        ("Paternity Leave", 3, True, True),
        ("Unpaid Leave", 30, False, True),
    ]
    return [
        LeaveType(
            id=LEAVE_TYPE_IDS[i],
            name=name,
            max_days_per_year=days,
            is_paid=paid,
            requires_approval=approval,
            is_active=True,
        )
        for i, (name, days, paid, approval) in enumerate(data)
    ]


# ── Leave Requests ───────────────────────────────────────────────
def get_leaves() -> List[Leave]:
    leaves = []
    # Some nurse, doctor, cashier leave requests
    leave_data = [
        (NURSE_USER_IDS[0], BRANCH_IDS[0], LEAVE_TYPE_IDS[0], 5, 8, "approved"),
        (NURSE_USER_IDS[1], BRANCH_IDS[1], LEAVE_TYPE_IDS[1], 2, 3, "approved"),
        (DOCTOR_USER_IDS[0], BRANCH_IDS[0], LEAVE_TYPE_IDS[2], 15, 16, "pending"),
        (CASHIER_USER_IDS[0], BRANCH_IDS[0], LEAVE_TYPE_IDS[0], 20, 25, "approved"),
        (NURSE_USER_IDS[2], BRANCH_IDS[2], LEAVE_TYPE_IDS[1], 10, 11, "rejected"),
    ]
    for user_id, branch_id, lt_id, start_off, end_off, status in leave_data:
        leaves.append(Leave(
            id=uid(),
            user_id=user_id,
            branch_id=branch_id,
            leave_type_id=lt_id,
            start_date=future_date(start_off),
            end_date=future_date(end_off),
            reason="Personal reasons" if status != "rejected" else "Staff shortage - rejected",
            status=status,
            approved_by=BRANCH_ADMIN_IDS[0] if status == "approved" else None,
            approved_at=NOW if status == "approved" else None,
        ))
    return leaves


# ── Staff Salaries ───────────────────────────────────────────────
def get_staff_salaries() -> List[StaffSalary]:
    salaries = []
    staff_users = NURSE_USER_IDS + CASHIER_USER_IDS + PHARMACIST_USER_IDS + RECEPTIONIST_IDS
    base_salaries = [55000, 57000, 59000, 61000, 63000, 65000, 67000, 69000,  # nurses
                     45000, 45000, 45000, 45000,  # cashiers
                     65000, 67000, 69000, 71000, 73000, 75000,  # pharmacists
                     40000, 40000, 40000]  # receptionists
    for i, user_id in enumerate(staff_users):
        sal = base_salaries[i] if i < len(base_salaries) else 50000
        salaries.append(StaffSalary(
            id=uid(),
            user_id=user_id,
            basic_salary=float(sal),
            allowances=json.dumps({"housing": 5000, "transport": 3000}),
            deductions=json.dumps({"epf_employee": round(sal * 0.08, 2)}),
            epf_rate=8.0,
            etf_rate=3.0,
            effective_from=date(2025, 1, 1),
        ))
    return salaries


# ── Employee Shifts ──────────────────────────────────────────────
def get_employee_shifts() -> List[EmployeeShift]:
    shifts = []
    today = NOW.date()
    shift_config = [
        ("morning", time(6, 0), time(14, 0)),
        ("afternoon", time(14, 0), time(22, 0)),
        ("night", time(22, 0), time(6, 0)),
    ]
    # Nurses rotate shifts
    for day_offset in range(7):
        d = today + timedelta(days=day_offset)
        for nurse_idx in range(len(NURSE_USER_IDS)):
            stype, st, et = shift_config[(nurse_idx + day_offset) % 3]
            shifts.append(EmployeeShift(
                id=uid(),
                user_id=NURSE_USER_IDS[nurse_idx],
                branch_id=BRANCH_IDS[nurse_idx % len(BRANCH_IDS)],
                shift_date=d,
                start_time=st,
                end_time=et,
                shift_type=stype,
                status="scheduled" if day_offset > 2 else "acknowledged",
            ))
    return shifts


# ── Attendance ───────────────────────────────────────────────────
def get_attendance() -> List[Attendance]:
    records = []
    today = NOW.date()
    all_staff = NURSE_USER_IDS + CASHIER_USER_IDS[:2] + RECEPTIONIST_IDS[:2]
    for day_offset in range(1, 8):
        d = today - timedelta(days=day_offset)
        for user_id in all_staff:
            status = "present" if hash(user_id + str(d)) % 10 > 1 else "late"
            records.append(Attendance(
                id=uid(),
                user_id=user_id,
                attendance_date=d,
                check_in=datetime(d.year, d.month, d.day, 7, 50 + abs(hash(user_id)) % 10,
                                  tzinfo=timezone.utc),
                check_out=datetime(d.year, d.month, d.day, 16, abs(hash(user_id)) % 30,
                                   tzinfo=timezone.utc),
                status=status,
            ))
    return records


# ── Bank Details ─────────────────────────────────────────────────
def get_bank_details() -> List[BankDetail]:
    banks = ["Bank of Ceylon", "Commercial Bank", "Sampath Bank", "HNB", "NDB"]
    details = []
    staff = NURSE_USER_IDS[:4] + CASHIER_USER_IDS[:2] + PHARMACIST_USER_IDS[:3]
    for i, user_id in enumerate(staff):
        details.append(BankDetail(
            id=uid(),
            user_id=user_id,
            bank_name=banks[i % len(banks)],
            branch_name=f"Colombo {i + 1}" if i < 5 else "Kandy",
            account_number=f"10{i+1:02d}00{5000 + i * 111}",
            account_type="savings" if i % 2 == 0 else "current",
        ))
    return details


# ── Billing Transactions (POS) ───────────────────────────────────
def get_billing_transactions():
    transactions = []
    items = []
    for i in range(12):
        t_id = uid()
        br_idx = i % len(BRANCH_IDS)
        cs_idx = i % len(CASHIER_USER_IDS)
        pat_idx = i % len(PATIENT_IDS)
        amt = round(1500 + i * 350.50, 2)
        disc = round(amt * 0.05, 2) if i % 3 == 0 else 0
        net = round(amt - disc, 2)
        transactions.append(BillingTransaction(
            id=t_id,
            branch_id=BRANCH_IDS[br_idx],
            patient_id=PATIENT_IDS[pat_idx],
            cashier_id=CASHIER_USER_IDS[cs_idx],
            transaction_type="consultation" if i % 3 == 0 else ("pharmacy" if i % 3 == 1 else "other"),
            total_amount=amt,
            discount_amount=disc,
            net_amount=net,
            payment_method="cash" if i % 2 == 0 else "card",
            status="completed",
            invoice_number=f"INV-{2026}{(i+1):04d}",
        ))
        # 1-3 items per transaction
        for j in range(1, (i % 3) + 2):
            p_idx = (i * 3 + j) % len(PRODUCT_IDS)
            qty = 1 + j
            price = round(8.0 + p_idx * 3.5, 2)
            items.append(TransactionItem(
                id=uid(),
                transaction_id=t_id,
                product_id=PRODUCT_IDS[p_idx],
                description=f"Product item #{p_idx + 1}",
                quantity=qty,
                unit_price=price,
                discount=0,
                total=round(qty * price, 2),
            ))
    return transactions, items


# ── Cash Registers ───────────────────────────────────────────────
def get_cash_registers() -> List[CashRegister]:
    registers = []
    for i in range(len(BRANCH_IDS)):
        registers.append(CashRegister(
            id=uid(),
            branch_id=BRANCH_IDS[i],
            cashier_id=CASHIER_USER_IDS[i % len(CASHIER_USER_IDS)],
            opening_balance=10000.0,
            closing_balance=None,
            status="open",
        ))
    return registers


# ── Purchase Requests ────────────────────────────────────────────
def get_purchase_requests():
    requests = []
    request_items = []
    statuses = ["submitted", "approved", "draft", "submitted", "approved"]
    for i in range(5):
        pr_id = uid()
        br_idx = i % len(BRANCH_IDS)
        sup_idx = i % len(SUPPLIER_IDS)
        total = 0.0
        pr_items = []
        for j in range(3):
            p_idx = (i * 3 + j) % len(PRODUCT_IDS)
            qty = 10 + j * 5
            price = round(5.0 + p_idx * 2.5, 2)
            item_total = round(qty * price, 2)
            total += item_total
            pr_items.append(PurchaseRequestItem(
                id=uid(),
                request_id=pr_id,
                product_id=PRODUCT_IDS[p_idx],
                product_name=f"Product #{p_idx + 1}",
                quantity=qty,
                unit_price=price,
                total=item_total,
            ))
        requests.append(PurchaseRequest(
            id=pr_id,
            branch_id=BRANCH_IDS[br_idx],
            requested_by=BRANCH_ADMIN_IDS[br_idx],
            supplier_id=SUPPLIER_IDS[sup_idx],
            status=statuses[i],
            total_amount=round(total, 2),
            notes=f"Regular stock replenishment #{i + 1}",
            approved_by=SUPER_ADMIN_IDS[0] if statuses[i] == "approved" else None,
            approved_at=NOW if statuses[i] == "approved" else None,
            submitted_at=NOW - timedelta(days=i + 1) if statuses[i] != "draft" else None,
        ))
        request_items.extend(pr_items)
    return requests, request_items


# ── Notifications ────────────────────────────────────────────────
def get_notifications() -> List[Notification]:
    notifs = []
    messages = [
        ("Welcome to HMS!", "Your account has been created successfully.", "success"),
        ("New Appointment", "You have a new appointment scheduled.", "info"),
        ("Leave Approved", "Your annual leave request has been approved.", "success"),
        ("Stock Alert", "Paracetamol 500mg is running low.", "warning"),
        ("Schedule Update", "Your schedule for next week has been updated.", "info"),
    ]
    target_users = [SUPER_ADMIN_IDS[0], DOCTOR_USER_IDS[0], NURSE_USER_IDS[0],
                    PHARMACIST_USER_IDS[0], BRANCH_ADMIN_IDS[0]]
    for i, (title, msg, ntype) in enumerate(messages):
        notifs.append(Notification(
            id=uid(),
            user_id=target_users[i],
            title=title,
            message=msg,
            type=ntype,
            is_read=(i < 2),
            read_at=NOW if i < 2 else None,
        ))
    return notifs


# ── System Settings ──────────────────────────────────────────────
def get_system_settings() -> List[SystemSettings]:
    data = [
        ("pos_pricing_strategy", "FIFO", "pos", "Default pricing strategy for POS"),
        ("pos_max_cashier_discount_percent", "10", "pos", "Maximum discount % a cashier can apply"),
        ("pos_override_request_expiry_minutes", "30", "pos", "Override request expiry in minutes"),
        ("appointment_slot_duration", "20", "appointment", "Default slot duration in minutes"),
        ("appointment_booking_advance_days", "30", "appointment", "How many days in advance can book"),
        ("sms_notifications_enabled", "true", "notifications", "Enable SMS notifications"),
        ("system_timezone", "Asia/Colombo", "system", "Default system timezone"),
        ("currency", "LKR", "system", "System currency"),
    ]
    return [
        SystemSettings(id=uid(), key=k, value=v, category=c, description=d)
        for k, v, c, d in data
    ]


# ── Web Doctors ──────────────────────────────────────────────────
def get_web_doctors() -> List[WebDoctor]:
    docs = []
    for i in range(6):
        fn = ["Anil", "Priya", "Roshan", "Malini", "Suresh", "Chamari"][i]
        ln = ["Kumara", "Dissanayake", "de Silva", "Herath", "Gunasekara", "Weerasinghe"][i]
        spec = SPECIALIZATIONS[i]
        docs.append(WebDoctor(
            id=uid(),
            doctor_id=DOCTOR_IDS[i],
            display_name=f"Dr. {fn} {ln}",
            bio=f"Experienced {spec} specialist with over {5+i} years of practice.",
            specialization=spec,
            display_order=i + 1,
        ))
    return docs


# ── Web Services ─────────────────────────────────────────────────
def get_web_services() -> List[WebService]:
    data = [
        ("General Consultation", "Comprehensive medical checkups and consultations.", "stethoscope", 1),
        ("Laboratory Services", "Complete blood work and diagnostic testing.", "flask", 2),
        ("Pharmacy", "Full-service pharmacy with prescription fulfillment.", "pills", 3),
        ("Emergency Care", "24/7 emergency medical care.", "ambulance", 4),
        ("Specialist Clinics", "Specialized clinics across multiple specialties.", "user-md", 5),
    ]
    return [
        WebService(id=uid(), title=t, description=d, icon=ic, display_order=o, is_active=True)
        for t, d, ic, o in data
    ]


# ── Contact Messages ────────────────────────────────────────────
def get_contact_messages() -> List[ContactMessage]:
    data = [
        ("Kamal Perera", "kamal@gmail.com", "+94771111111", "Appointment Inquiry",
         "I would like to know about the doctor availability for next week.", "new"),
        ("Nisha Fernando", "nisha@gmail.com", "+94772222222", "Feedback",
         "Great service at the Colombo branch. Thank you!", "read"),
        ("Arun Gupta", "arun@gmail.com", "+94773333333", "General Inquiry",
         "What are your operating hours?", "responded"),
    ]
    return [
        ContactMessage(id=uid(), name=n, email=e, phone=p, subject=s, message=m, status=st)
        for n, e, p, s, m, st in data
    ]


# ── Chatbot FAQs ────────────────────────────────────────────────
def get_chatbot_faqs() -> List[ChatbotFAQ]:
    data = [
        ("What are your operating hours?",
         "Our medical centers are open Monday to Saturday, 8:00 AM to 8:00 PM. Emergency services are available 24/7.",
         "general"),
        ("How do I book an appointment?",
         "You can book an appointment through our website, by calling any of our branches, or by visiting in person.",
         "appointments"),
        ("What payment methods do you accept?",
         "We accept cash, credit/debit cards, mobile payments, and QR code payments.",
         "billing"),
        ("How can I get my medical records?",
         "You can request your medical records from the reception desk at any branch. Please bring your ID for verification.",
         "records"),
        ("Do you offer emergency services?",
         "Yes, all our branches provide emergency medical services around the clock.",
         "services"),
        ("What specialties are available?",
         "We offer General Medicine, Cardiology, Dermatology, Pediatrics, Orthopedics, ENT, Neurology, and Gynecology.",
         "services"),
    ]
    return [
        ChatbotFAQ(id=uid(), question=q, answer=a, category=c, language="en", is_active=True)
        for q, a, c in data
    ]


# ── Vital Signs (Nurse domain) ──────────────────────────────────
def get_vital_signs() -> List[VitalSign]:
    vitals = []
    for i in range(10):
        vitals.append(VitalSign(
            id=uid(),
            patient_id=PATIENT_IDS[i],
            nurse_id=NURSE_USER_IDS[i % len(NURSE_USER_IDS)],
            appointment_id=APPOINTMENT_IDS[i] if i < 10 else None,
            temperature=round(36.5 + (i % 5) * 0.3, 1),
            blood_pressure_systolic=110 + (i * 5),
            blood_pressure_diastolic=70 + (i * 3),
            pulse_rate=60 + (i * 4),
            respiratory_rate=14 + (i % 4),
            oxygen_saturation=round(96 + (i % 4) * 0.5, 1),
            weight=round(55 + i * 3.5, 1),
            height=round(155 + i * 2.5, 1),
            bmi=round(22 + (i % 5) * 0.8, 1),
            blood_sugar=round(90 + i * 5.0, 1),
            notes="Normal vitals" if i % 2 == 0 else "Slightly elevated BP",
        ))
    return vitals


# ── Health Conditions ────────────────────────────────────────────
def get_health_conditions() -> List[HealthCondition]:
    data = [
        ("Hypertension", "moderate"), ("Type 2 Diabetes", "moderate"),
        ("Asthma", "mild"), ("Migraine", "mild"),
        ("Osteoarthritis", "severe"), ("Eczema", "mild"),
    ]
    conditions = []
    for i, (name, severity) in enumerate(data):
        conditions.append(HealthCondition(
            id=uid(),
            patient_id=PATIENT_IDS[i],
            condition_name=name,
            severity=severity,
            diagnosed_date=past_date(365 + i * 30),
            notes=f"Diagnosed and under treatment for {name}",
            is_active=True,
        ))
    return conditions


# ── Feedback ─────────────────────────────────────────────────────
def get_feedback() -> List[Feedback]:
    data = [
        ("Excellent Service", "Very happy with Dr. Kumara's consultation.", "doctor", "reviewed"),
        ("Clean Facility", "The Colombo branch is very clean and well-maintained.", "facility", "pending"),
        ("Long Wait Time", "Had to wait over an hour for my appointment.", "service", "reviewed"),
        ("Great Staff", "The nursing staff were very caring.", "general", "resolved"),
    ]
    feedbacks = []
    for i, (subj, msg, cat, status) in enumerate(data):
        feedbacks.append(Feedback(
            id=uid(),
            user_id=PATIENT_USER_IDS[i],
            branch_id=BRANCH_IDS[i % len(BRANCH_IDS)],
            doctor_id=DOCTOR_IDS[i % len(DOCTOR_IDS)] if cat == "doctor" else None,
            subject=subj,
            message=msg,
            category=cat,
            status=status,
            admin_response="Thank you for your feedback." if status in ("reviewed", "resolved") else None,
        ))
    return feedbacks


# ── Medical Posts ────────────────────────────────────────────────
def get_medical_posts() -> List[MedicalPost]:
    data = [
        ("Understanding Hypertension", "A comprehensive guide to managing high blood pressure.",
         "Cardiovascular", "published"),
        ("Diabetes Prevention Tips", "Simple lifestyle changes to prevent Type 2 Diabetes.",
         "Endocrinology", "published"),
        ("Child Vaccination Schedule", "Complete vaccination schedule for children in Sri Lanka.",
         "Pediatrics", "published"),
        ("Skin Care in Tropical Climate", "Tips for maintaining healthy skin in humid weather.",
         "Dermatology", "draft"),
    ]
    posts = []
    for i, (title, summary, cat, status) in enumerate(data):
        slug = title.lower().replace(" ", "-")
        posts.append(MedicalPost(
            id=uid(),
            doctor_id=DOCTOR_IDS[i],
            title=title,
            slug=slug,
            content=f"<h2>{title}</h2><p>{summary} This is a detailed article about {title.lower()}.</p>",
            summary=summary,
            category=cat,
            status=status,
            likes_count=10 + i * 5,
            rating_avg=round(3.5 + i * 0.3, 1),
            published_at=NOW - timedelta(days=30 - i * 7) if status == "published" else None,
        ))
    return posts


# ── Doctor Main Questions ────────────────────────────────────────
def get_doctor_questions() -> List[DoctorMainQuestion]:
    questions = []
    q_data = [
        "Do you have any allergies?",
        "Are you currently on any medications?",
        "Have you had any surgeries in the past?",
        "Is there a family history of this condition?",
        "When did the symptoms first appear?",
    ]
    for doc_idx in range(4):
        for q_idx, q_text in enumerate(q_data):
            questions.append(DoctorMainQuestion(
                id=uid(),
                doctor_id=DOCTOR_IDS[doc_idx],
                question=q_text,
                description=f"Standard intake question #{q_idx + 1}",
                order=q_idx + 1,
                status=1,
            ))
    return questions


# ── Doctor Created Diseases ──────────────────────────────────────
def get_doctor_diseases() -> List[DoctorCreatedDisease]:
    data = [
        ("Tropical Sprue", "A malabsorption disease common in tropical regions",
         '["diarrhea","weight loss","fatigue","nutrient deficiency"]'),
        ("Dengue Fever", "Mosquito-borne viral infection",
         '["high fever","severe headache","joint pain","rash"]'),
        ("Leptospirosis", "Bacterial disease spread through contaminated water",
         '["fever","chills","muscle aches","jaundice"]'),
    ]
    diseases = []
    for i, (name, desc, symptoms) in enumerate(data):
        diseases.append(DoctorCreatedDisease(
            id=uid(),
            doctor_id=DOCTOR_IDS[i],
            disease_name=name,
            description=desc,
            symptoms=symptoms,
        ))
    return diseases


# ══════════════════════════════════════════════════════════════════
#  MAIN SEED RUNNER
# ══════════════════════════════════════════════════════════════════
async def seed():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # ── Idempotency check ─────────────────────────────────────
        existing = (await session.exec(select(User))).first()
        if existing:
            print("⚠  Database already has data. Skipping seed to avoid duplicates.")
            print("   To re-seed, truncate all tables first.")
            return

        print("═══════════════════════════════════════════════════")
        print("  HMS COMPREHENSIVE DATABASE SEED")
        print("═══════════════════════════════════════════════════\n")

        # ── Phase 1: Independent tables (no FK deps) ─────────────
        print("Phase 1: Branches, Suppliers, Leave Types, System Settings...")
        branches = get_branches()
        suppliers = get_suppliers()
        leave_types = get_leave_types()
        settings_list = get_system_settings()

        for obj in branches + suppliers + leave_types + settings_list:
            session.add(obj)
        await session.flush()
        print(f"  ✓ {len(branches)} branches")
        print(f"  ✓ {len(suppliers)} suppliers")
        print(f"  ✓ {len(leave_types)} leave types")
        print(f"  ✓ {len(settings_list)} system settings")

        # ── Phase 2: Users ───────────────────────────────────────
        print("\nPhase 2: Users (all roles)...")
        users = get_users()
        for u in users:
            session.add(u)
        await session.flush()
        print(f"  ✓ {len(users)} users (password: Test@123)")
        print(f"    - 2 Super Admins, 3 Branch Admins, 12 Doctors")
        print(f"    - 8 Nurses, 25 Patients, 4 Cashiers")
        print(f"    - 6 Pharmacists, 1 IT Support, 3 Receptionists")

        # ── Phase 3: Doctor & Patient profiles ───────────────────
        print("\nPhase 3: Doctor, Patient, Pharmacist profiles...")
        doctors = get_doctors()
        patients = get_patients()
        pharmacist_profiles = get_pharmacist_profiles()
        for obj in doctors + patients + pharmacist_profiles:
            session.add(obj)
        await session.flush()
        print(f"  ✓ {len(doctors)} doctor profiles")
        print(f"  ✓ {len(patients)} patient profiles")
        print(f"  ✓ {len(pharmacist_profiles)} pharmacist profiles")

        # ── Phase 4: Pharmacies ──────────────────────────────────
        print("\nPhase 4: Pharmacies...")
        pharmacies = get_pharmacies()
        for ph in pharmacies:
            session.add(ph)
        await session.flush()
        print(f"  ✓ {len(pharmacies)} pharmacies (unassigned)")

        # ── Phase 5: Products & Stock (depends on supplier, branch, pharmacy)
        print("\nPhase 5: Products & Product Stock...")
        products = get_products()
        for p in products:
            session.add(p)
        await session.flush()
        product_stocks = get_product_stock()
        for ps in product_stocks:
            session.add(ps)
        await session.flush()
        print(f"  ✓ {len(products)} products")
        print(f"  ✓ {len(product_stocks)} product stock entries")

        # ── Phase 6: Doctor Schedules & Availability ─────────────
        print("\nPhase 6: Doctor Schedules & Availability...")
        schedules = get_doctor_schedules()
        availability = get_doctor_availability()
        for obj in schedules + availability:
            session.add(obj)
        await session.flush()
        print(f"  ✓ {len(schedules)} weekly schedules")
        print(f"  ✓ {len(availability)} availability slots")

        # ── Phase 7: Appointments ────────────────────────────────
        print("\nPhase 7: Appointments & Settings...")
        appointments = get_appointments()
        appt_settings = get_appointment_settings()
        for obj in appointments + appt_settings:
            session.add(obj)
        await session.flush()
        print(f"  ✓ {len(appointments)} appointments")
        print(f"  ✓ {len(appt_settings)} appointment settings")

        # ── Phase 8: Visits & Queue ──────────────────────────────
        print("\nPhase 8: Visits & Queue...")
        visits = get_visits()
        queues = get_queues()
        for obj in visits + queues:
            session.add(obj)
        await session.flush()
        print(f"  ✓ {len(visits)} visits")
        print(f"  ✓ {len(queues)} queue entries")

        # ── Phase 9: Consultations ───────────────────────────────
        print("\nPhase 9: Consultations, Diagnoses, Prescriptions...")
        consults, diags, rx_items = get_consultations()
        for obj in consults:
            session.add(obj)
        await session.flush()
        for obj in diags + rx_items:
            session.add(obj)
        await session.flush()
        print(f"  ✓ {len(consults)} consultations")
        print(f"  ✓ {len(diags)} diagnoses")
        print(f"  ✓ {len(rx_items)} consultation prescriptions")

        # ── Phase 10: POS / Billing ──────────────────────────────
        print("\nPhase 10: POS - Billing Transactions...")
        transactions, tx_items = get_billing_transactions()
        cash_registers = get_cash_registers()
        for obj in transactions:
            session.add(obj)
        await session.flush()
        for obj in tx_items + cash_registers:
            session.add(obj)
        await session.flush()
        print(f"  ✓ {len(transactions)} billing transactions")
        print(f"  ✓ {len(tx_items)} transaction items")
        print(f"  ✓ {len(cash_registers)} cash registers")

        # ── Phase 11: Purchase Requests ──────────────────────────
        print("\nPhase 11: Purchase Requests...")
        pr_requests, pr_items = get_purchase_requests()
        for obj in pr_requests:
            session.add(obj)
        await session.flush()
        for obj in pr_items:
            session.add(obj)
        await session.flush()
        print(f"  ✓ {len(pr_requests)} purchase requests")
        print(f"  ✓ {len(pr_items)} purchase request items")

        # ── Phase 12: HRM ────────────────────────────────────────
        print("\nPhase 12: HRM - Leaves, Salaries, Shifts, Attendance, Bank Details...")
        leaves = get_leaves()
        salaries = get_staff_salaries()
        shifts = get_employee_shifts()
        attendance_recs = get_attendance()
        bank_details = get_bank_details()
        for obj in leaves + salaries + shifts + attendance_recs + bank_details:
            session.add(obj)
        await session.flush()
        print(f"  ✓ {len(leaves)} leave requests")
        print(f"  ✓ {len(salaries)} salary records")
        print(f"  ✓ {len(shifts)} shift entries")
        print(f"  ✓ {len(attendance_recs)} attendance records")
        print(f"  ✓ {len(bank_details)} bank details")

        # ── Phase 13: Nurse Domain ───────────────────────────────
        print("\nPhase 13: Nurse Domain - Vital Signs...")
        vitals = get_vital_signs()
        for obj in vitals:
            session.add(obj)
        await session.flush()
        print(f"  ✓ {len(vitals)} vital sign records")

        # ── Phase 14: Patient Dashboard ──────────────────────────
        print("\nPhase 14: Patient Dashboard - Conditions, Feedback...")
        conditions = get_health_conditions()
        fb = get_feedback()
        for obj in conditions + fb:
            session.add(obj)
        await session.flush()
        print(f"  ✓ {len(conditions)} health conditions")
        print(f"  ✓ {len(fb)} feedback entries")

        # ── Phase 15: Notifications ──────────────────────────────
        print("\nPhase 15: Notifications...")
        notifs = get_notifications()
        for obj in notifs:
            session.add(obj)
        await session.flush()
        print(f"  ✓ {len(notifs)} notifications")

        # ── Phase 16: Website & Chatbot ──────────────────────────
        print("\nPhase 16: Website, Chatbot FAQs, Contact Messages...")
        web_docs = get_web_doctors()
        web_svc = get_web_services()
        contact_msgs = get_contact_messages()
        faqs = get_chatbot_faqs()
        for obj in web_docs + web_svc + contact_msgs + faqs:
            session.add(obj)
        await session.flush()
        print(f"  ✓ {len(web_docs)} web doctors")
        print(f"  ✓ {len(web_svc)} web services")
        print(f"  ✓ {len(contact_msgs)} contact messages")
        print(f"  ✓ {len(faqs)} chatbot FAQs")

        # ── Phase 17: Medical Insights & Doctor Tools ────────────
        print("\nPhase 17: Medical Posts, Doctor Questions, Diseases...")
        posts = get_medical_posts()
        questions = get_doctor_questions()
        diseases = get_doctor_diseases()
        for obj in posts + questions + diseases:
            session.add(obj)
        await session.flush()
        print(f"  ✓ {len(posts)} medical posts")
        print(f"  ✓ {len(questions)} doctor questions")
        print(f"  ✓ {len(diseases)} doctor-created diseases")

        # ── COMMIT ───────────────────────────────────────────────
        await session.commit()

        print("\n═══════════════════════════════════════════════════")
        print("  SEED COMPLETE!")
        print("═══════════════════════════════════════════════════")
        print("\n  Login Credentials (all passwords: Test@123):")
        print("  ─────────────────────────────────────────────────")
        print("  Super Admin:    admin@hospital.com")
        print("  Super Admin 2:  admin2@hospital.com")
        print("  Branch Admin:   branchadmin1@hospital.com")
        print("  Doctor:         doctor1@hospital.com  …  doctor12@hospital.com")
        print("  Nurse:          nurse1@hospital.com   …  nurse8@hospital.com")
        print("  Patient:        patient1@hospital.com …  patient25@hospital.com")
        print("  Cashier:        cashier1@hospital.com …  cashier4@hospital.com")
        print("  Pharmacist:     pharmacist1@hospital.com … pharmacist6@hospital.com")
        print("  IT Support:     itsupport@hospital.com")
        print("  Receptionist:   receptionist1@hospital.com … receptionist3@hospital.com")
        print("═══════════════════════════════════════════════════\n")


if __name__ == "__main__":
    asyncio.run(seed())
