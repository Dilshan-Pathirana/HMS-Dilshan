"""
Comprehensive Database Seeding Script
Seeds all tables with substantial test data for HMS
"""
import asyncio
import sys
from datetime import date, time, datetime, timedelta
from random import choice, randint, sample
from uuid import uuid4

import os
if os.path.exists('/app/backend'):
    sys.path.insert(0, '/app/backend')
else:
    sys.path.insert(0, '/var/www/hms/current/backend')

from sqlmodel import select
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.database import async_engine
from app.core.security import get_password_hash
from app.models.user import User
from app.models.branch import Branch
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.visit import Visit, Queue

# === USER DATA ===
USERS_DATA = [
    # Super Admin (role_as=1)
    {"email": "admin@hospital.com", "username": "Super Admin", "role": 1},
    {"email": "wilderman.dashawn@example.net", "username": "Leora Bernhard Elisa Lueilwitz", "role": 1},
    {"email": "asd@gmail.com", "username": "test01 qweqwe [IT Assistant]", "role": 1},
    {"email": "asdf@sd.com", "username": "sdfg xcvb [Audiologist]", "role": 1},
    {"email": "sample@coun.com", "username": "sample c counceler 01 [Counselor]", "role": 1},
    {"email": "dfg@wer.co", "username": "dfghj fghjk [Therapist]", "role": 1},
    
    # Doctors (role_as=2)
    {"email": "marvin.greenholt@example.com", "username": "Sandy Muller Chandler Koch", "role": 2},
    {"email": "monahan.wilma@example.org", "username": "Jerrell Tremblay Jr. Prof. Shawn Funk", "role": 2},
    {"email": "grant.iliana@example.net", "username": "Brandyn Witting Savanna Torphy DDS", "role": 2},
    {"email": "grimes.keira@example.org", "username": "Gaylord Hagenes V Mr. Jose Zieme PhD", "role": 2},
    {"email": "wisoky.peyton@example.com", "username": "Brielle Padberg Prof. Chance Bogan", "role": 2},
    {"email": "doctor1.branch1@hospital.com", "username": "Doctor A1", "role": 2},
    {"email": "doctor2.branch1@hospital.com", "username": "Doctor A2", "role": 2},
    {"email": "doctor3.branch1@hospital.com", "username": "Doctor A3", "role": 2},
    {"email": "doctor4.branch1@hospital.com", "username": "Doctor A4", "role": 2},
    {"email": "doctor1.branch2@hospital.com", "username": "Doctor B1", "role": 2},
    {"email": "doctor2.branch2@hospital.com", "username": "Doctor B2", "role": 2},
    {"email": "doctor3.branch2@hospital.com", "username": "Doctor B3", "role": 2},
    {"email": "doctor4.branch2@hospital.com", "username": "Doctor B4", "role": 2},
    {"email": "doctor1.branch3@hospital.com", "username": "Doctor C1", "role": 2},
    {"email": "doctor2.branch3@hospital.com", "username": "Doctor C2", "role": 2},
    {"email": "doctor3.branch3@hospital.com", "username": "Doctor C3", "role": 2},
    {"email": "doctor4.branch3@hospital.com", "username": "Doctor C4", "role": 2},
    
    # Branch Admin (role_as=3)
    {"email": "branch_admin1.branch1@hospital.com", "username": "Branch admin A1", "role": 3},
    {"email": "branch_admin1.branch2@hospital.com", "username": "Branch admin B1", "role": 3},
    {"email": "branch_admin1.branch3@hospital.com", "username": "Branch admin C1", "role": 3},
    
    # Nurse (role_as=4)
    {"email": "nurse1.branch1@hospital.com", "username": "Nurse A1", "role": 4},
    {"email": "nurse2.branch1@hospital.com", "username": "Nurse A2", "role": 4},
    {"email": "nurse3.branch1@hospital.com", "username": "Nurse A3", "role": 4},
    {"email": "nurse1.branch2@hospital.com", "username": "Nurse B1", "role": 4},
    {"email": "nurse2.branch2@hospital.com", "username": "Nurse B2", "role": 4},
    {"email": "nurse3.branch2@hospital.com", "username": "Nurse B3", "role": 4},
    {"email": "nurse1.branch3@hospital.com", "username": "Nurse C1", "role": 4},
    {"email": "nurse2.branch3@hospital.com", "username": "Nurse C2", "role": 4},
    {"email": "nurse3.branch3@hospital.com", "username": "Nurse C3", "role": 4},
    
    # Pharmacist (role_as=5)
    {"email": "pharmacist1.branch1@hospital.com", "username": "Pharmacist A1", "role": 5},
    {"email": "pharmacist2.branch1@hospital.com", "username": "Pharmacist A2", "role": 5},
    {"email": "pharmacist1.branch2@hospital.com", "username": "Pharmacist B1", "role": 5},
    {"email": "pharmacist2.branch2@hospital.com", "username": "Pharmacist B2", "role": 5},
    {"email": "pharmacist1.branch3@hospital.com", "username": "Pharmacist C1", "role": 5},
    {"email": "pharmacist2.branch3@hospital.com", "username": "Pharmacist C2", "role": 5},
    
    # Cashier (role_as=6)
    {"email": "cashier1.branch1@hospital.com", "username": "Cashier A1", "role": 6},
    {"email": "cashier2.branch1@hospital.com", "username": "Cashier A2", "role": 6},
    {"email": "cashier1.branch2@hospital.com", "username": "Cashier B1", "role": 6},
    {"email": "cashier2.branch2@hospital.com", "username": "Cashier B2", "role": 6},
    {"email": "cashier1.branch3@hospital.com", "username": "Cashier C1", "role": 6},
    {"email": "cashier2.branch3@hospital.com", "username": "Cashier C2", "role": 6},
    
    # Receptionist/Patient (role_as=7)
    {"email": "receptionist2.branch1@hospital.com", "username": "Receptionist A2", "role": 7},
    {"email": "receptionist1.branch2@hospital.com", "username": "Receptionist B1", "role": 7},
    {"email": "receptionist2.branch2@hospital.com", "username": "Receptionist B2", "role": 7},
    {"email": "receptionist1.branch3@hospital.com", "username": "Receptionist C1", "role": 7},
    {"email": "receptionist2.branch3@hospital.com", "username": "Receptionist C2", "role": 7},
    
    # IT Support/Supplier (role_as=8)
    {"email": "it_support1.branch1@hospital.com", "username": "It support A1", "role": 8},
    {"email": "it_support1.branch2@hospital.com", "username": "It support B1", "role": 8},
    {"email": "it_support1.branch3@hospital.com", "username": "It support C1", "role": 8},
    {"email": "mojitha.ekanayake@gmail.com", "username": "weer weer [supplier_entity]", "role": 8},
    {"email": "qeqw@gmail.com", "username": "test03 test03 [supplier_entity]", "role": 8},
    {"email": "moek0000@gmail.com", "username": "test 10 [supplier_entity]", "role": 8},
    
    # Center Aid (role_as=9)
    {"email": "center_aid1.branch1@hospital.com", "username": "Center aid A1", "role": 9},
    {"email": "center_aid2.branch1@hospital.com", "username": "Center aid A2", "role": 9},
    {"email": "center_aid1.branch2@hospital.com", "username": "Center aid B1", "role": 9},
    {"email": "center_aid2.branch2@hospital.com", "username": "Center aid B2", "role": 9},
    {"email": "center_aid1.branch3@hospital.com", "username": "Center aid C1", "role": 9},
    {"email": "center_aid2.branch3@hospital.com", "username": "Center aid C2", "role": 9},
    
    # Auditor (role_as=10)
    {"email": "auditor1.branch1@hospital.com", "username": "Auditor A1", "role": 10},
    {"email": "auditor1.branch2@hospital.com", "username": "Auditor B1", "role": 10},
    {"email": "auditor1.branch3@hospital.com", "username": "Auditor C1", "role": 10},
]

BRANCHES_DATA = [
    {
        "center_name": "HMS Colombo Main Center",
        "register_number": "BR-001-2024",
        "center_type": "Main Hospital",
        "division": "Western Province",
        "division_number": "WP-01",
        "owner_type": "Government",
        "owner_full_name": "Ministry of Health",
        "owner_id_number": "GOV-MH-001",
        "owner_contact_number": "+94112345678",
    },
    {
        "center_name": "HMS Kandy Branch Center",
        "register_number": "BR-002-2024",
        "center_type": "Branch Hospital",
        "division": "Central Province",
        "division_number": "CP-02",
        "owner_type": "Private",
        "owner_full_name": "Kandy Medical Holdings Pvt Ltd",
        "owner_id_number": "PVT-KMH-002",
        "owner_contact_number": "+94812345678",
    },
    {
        "center_name": "HMS Galle Branch Center",
        "register_number": "BR-003-2024",
        "center_type": "Branch Hospital",
        "division": "Southern Province",
        "division_number": "SP-03",
        "owner_type": "Private",
        "owner_full_name": "Galle Healthcare Services Ltd",
        "owner_id_number": "PVT-GHS-003",
        "owner_contact_number": "+94912345678",
    },
]

SPECIALIZATIONS = ["Cardiology", "Neurology", "Pediatrics", "Orthopedics", "Dermatology", 
                  "General Medicine", "Surgery", "Psychiatry", "ENT", "Ophthalmology",
                  "Gastroenterology", "Pulmonology"]

QUALIFICATIONS = ["MBBS, MD", "MBBS, MS", "MBBS, FRCS", "MBBS, MD, FCCP", "MBBS, DM"]

BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]

GENDERS = ["Male", "Female"]

DEPARTMENTS = ["Cardiology", "Neurology", "Pediatrics", "Orthopedics", "General Medicine", "Surgery", "Emergency"]

APPOINTMENT_STATUSES = ["pending", "confirmed", "in_progress", "completed", "cancelled"]

VISIT_TYPES = ["opd", "emergency", "follow_up"]

VISIT_STATUSES = ["registered", "in_progress", "completed"]

QUEUE_STATUSES = ["waiting", "called", "completed"]


async def main():
    print("=" * 60)
    print("HMS DATABASE COMPREHENSIVE SEEDING")
    print("=" * 60)
    
    async_session = sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        
        # === PHASE 1: BRANCHES ===
        print("\n[1/7] Seeding Branches...")
        branch_ids = {}
        for i, branch_data in enumerate(["branch1", "branch2", "branch3"]):
            result = await session.exec(select(Branch).where(Branch.center_name == BRANCHES_DATA[i]["center_name"]))
            existing_branch = result.first()
            
            if not existing_branch:
                branch = Branch(**BRANCHES_DATA[i])
                session.add(branch)
                await session.flush()
                branch_ids[branch_data] = branch.id
                print(f"  ✓ Created: {branch.center_name}")
            else:
                branch_ids[branch_data] = existing_branch.id
                print(f"  • Exists: {existing_branch.center_name}")
        
        await session.commit()
        print(f"✅ Branches: {len(branch_ids)} total")
        
        # === PHASE 2: USERS ===
        print("\n[2/7] Seeding Users...")
        user_ids = {}
        user_count = 0
        
        for user_data in USERS_DATA:
            result = await session.exec(select(User).where(User.email == user_data["email"]))
            existing_user = result.first()
            
            if not existing_user:
                user = User(
                    email=user_data["email"],
                    username=user_data["username"],
                    hashed_password=get_password_hash("Test@123"),
                    role_as=user_data["role"],
                    is_active=True,
                )
                session.add(user)
                await session.flush()
                user_ids[user_data["email"]] = user.id
                user_count += 1
                print(f"  ✓ Created: {user.email} (role: {user.role_as})")
            else:
                user_ids[user_data["email"]] = existing_user.id
                print(f"  • Exists: {existing_user.email}")
        
        await session.commit()
        print(f"✅ Users: {user_count} new, {len(user_ids)} total")
        
        # === PHASE 3: DOCTORS ===
        print("\n[3/7] Seeding Doctors...")
        doctor_ids = []
        doctor_count = 0
        
        doctor_emails = [u["email"] for u in USERS_DATA if u["role"] == 2]
        branch_assignments = {
            "branch1": doctor_emails[:6],
            "branch2": doctor_emails[6:12],
            "branch3": doctor_emails[12:],
        }
        
        for branch_key, emails in branch_assignments.items():
            for email in emails:
                result = await session.exec(select(Doctor).where(Doctor.user_id == user_ids[email]))
                if not result.first():
                    doctor = Doctor(
                        user_id=user_ids[email],
                        branch_id=branch_ids[branch_key],
                        specialization=choice(SPECIALIZATIONS),
                        qualification=choice(QUALIFICATIONS),
                        contact_number=f"+9477{randint(1000000, 9999999)}",
                        experience_years=randint(5, 25),
                    )
                    session.add(doctor)
                    await session.flush()
                    doctor_ids.append(doctor.id)
                    doctor_count += 1
                    print(f"  ✓ Created doctor: {email} - {doctor.specialization}")
        
        await session.commit()
        print(f"✅ Doctors: {doctor_count} new")
        
        # === PHASE 4: PATIENTS ===
        print("\n[4/7] Seeding Patients...")
        patient_ids = []
        patient_count = 0
        
        # Create patients from receptionist users
        receptionist_emails = [u["email"] for u in USERS_DATA if u["role"] == 7]
        for email in receptionist_emails:
            result = await session.exec(select(Patient).where(Patient.user_id == user_ids[email]))
            if not result.first():
                patient = Patient(
                    user_id=user_ids[email],
                    date_of_birth=date(randint(1960, 2010), randint(1, 12), randint(1, 28)),
                    gender=choice(GENDERS),
                    blood_group=choice(BLOOD_GROUPS),
                    address=f"{randint(1, 500)} Main Street, Colombo {randint(1, 15)}",
                    contact_number=f"+9477{randint(1000000, 9999999)}",
                    emergency_contact=f"+9471{randint(1000000, 9999999)}",
                )
                session.add(patient)
                await session.flush()
                patient_ids.append(patient.id)
                patient_count += 1
        
        # Create additional anonymous patients
        for i in range(25):
            patient = Patient(
                user_id=str(uuid4()),  # Dummy user IDs for anonymous patients
                date_of_birth=date(randint(1950, 2015), randint(1, 12), randint(1, 28)),
                gender=choice(GENDERS),
                blood_group=choice(BLOOD_GROUPS),
                address=f"{randint(1, 500)} Street {i+1}, City {choice(['Colombo', 'Kandy', 'Galle'])}",
                contact_number=f"+9477{randint(1000000, 9999999)}",
                emergency_contact=f"+9471{randint(1000000, 9999999)}",
            )
            # Need to create dummy user first
            dummy_user = User(
                email=f"patient{i+1}@test.com",
                username=f"Patient {i+1}",
                hashed_password=get_password_hash("Test@123"),
                role_as=0,  # Regular patient
                is_active=True,
            )
            session.add(dummy_user)
            await session.flush()
            patient.user_id = dummy_user.id
            session.add(patient)
            await session.flush()
            patient_ids.append(patient.id)
            patient_count += 1
        
        await session.commit()
        print(f"✅ Patients: {patient_count} new")
        
        # === PHASE 5: APPOINTMENTS ===
        print("\n[5/7] Seeding Appointments...")
        appointment_ids = []
        appointment_count = 0
        
        # Create 80 appointments
        for i in range(80):
            days_offset = randint(-30, 30)  # Past and future appointments
            appt_date = date.today() + timedelta(days=days_offset)
            appt_hour = randint(9, 16)
            
            appointment = Appointment(
                patient_id=choice(patient_ids),
                doctor_id=choice(doctor_ids),
                branch_id=choice(list(branch_ids.values())),
                appointment_date=appt_date,
                appointment_time=time(appt_hour, choice([0, 15, 30, 45])),
                appointment_number=f"APT-{date.today().year}-{i+1:04d}",
                department=choice(DEPARTMENTS),
                reason=choice(["General Checkup", "Follow-up", "New Consultation", "Emergency", "Routine Visit"]),
                notes=choice(["Patient requested morning slot", "Referred by GP", "Follow-up required", ""]),
                status=choice(APPOINTMENT_STATUSES) if days_offset < 0 else choice(["pending", "confirmed"]),
            )
            session.add(appointment)
            await session.flush()
            appointment_ids.append(appointment.id)
            appointment_count += 1
        
        await session.commit()
        print(f"✅ Appointments: {appointment_count} new")
        
        # === PHASE 6: VISITS ===
        print("\n[6/7] Seeding Visits...")
        visit_count = 0
        
        # Create 40 visits
        for i in range(40):
            days_offset = randint(-20, 0)  # Only past visits
            visit_date = datetime.now() + timedelta(days=days_offset)
            
            visit = Visit(
                visit_number=f"VST-{date.today().year}-{i+1:05d}",
                patient_id=choice(patient_ids),
                doctor_id=choice(doctor_ids),
                branch_id=choice(list(branch_ids.values())),
                appointment_id=choice(appointment_ids) if randint(0, 1) else None,
                visit_type=choice(VISIT_TYPES),
                department=choice(DEPARTMENTS),
                reason=choice(["Fever", "Headache", "Chest pain", "Followup checkup", "Routine examination"]),
                notes=choice(["Prescribed medication", "Recommended tests", "Admitted to ward", ""]),
                status=choice(VISIT_STATUSES),
                created_at=visit_date,
                updated_at=visit_date,
            )
            session.add(visit)
            visit_count += 1
        
        await session.commit()
        print(f"✅ Visits: {visit_count} new")
        
        # === PHASE 7: QUEUE ===
        print("\n[7/7] Seeding Queue...")
        queue_count = 0
        
        # Create 18 queue entries for today
        today = datetime.now()
        for i in range(18):
            queue = Queue(
                patient_id=choice(patient_ids),
                doctor_id=choice(doctor_ids),
                branch_id=choice(list(branch_ids.values())),
                token_number=i + 1,
                visit_type=choice(["appointment", "walk-in"]),
                priority=choice(["normal", "urgent", "emergency"]),
                department=choice(DEPARTMENTS),
                status=choice(QUEUE_STATUSES),
                created_at=today,
                called_at=today + timedelta(minutes=i*10) if i < 12 else None,
                completed_at=today + timedelta(minutes=i*10 + 20) if i < 8 else None,
            )
            session.add(queue)
            queue_count += 1
        
        await session.commit()
        print(f"✅ Queue: {queue_count} new")
        
        # === SUMMARY ===
        print("\n" + "=" * 60)
        print("SEEDING COMPLETE!")
        print("=" * 60)
        print(f"Branches:      {len(branch_ids)}")
        print(f"Users:         {len(user_ids)}")
        print(f"Doctors:       {len(doctor_ids)}")
        print(f"Patients:      {len(patient_ids)}")
        print(f"Appointments:  {appointment_count}")
        print(f"Visits:        {visit_count}")
        print(f"Queue entries: {queue_count}")
        print("=" * 60)
        print("\n✅ Database seeded successfully!")
        print("\nTest Login:")
        print("  Email: admin@hospital.com")
        print("  Password: Test@123")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
