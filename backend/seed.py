
import asyncio
from app.core.database import async_engine as engine
from app.models.user import User
from app.core.security import get_password_hash
from sqlmodel import select
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

# Role mapping based on your system:
# 1 = SuperAdmin, 2 = Doctor, 3 = Branch Admin, 4 = Nurse, 5 = Pharmacist, 6 = Cashier, 7 = Receptionist/Patient, 8 = IT Support/Supplier, 9 = Center Aid, 10 = Auditor
ROLE_MAP = {
    "superadmin": 1,
    "doctor": 2,
    "branch_admin": 3,
    "nurse": 4,
    "pharmacist": 5,
    "cashier": 6,
    "receptionist": 7,
    "it_support": 8,
    "center_aid": 9,
    "auditor": 10,
    "supplier": 8,  # supplier_entity mapped to IT Support/Supplier
}

USERS = [
    # SUPER ADMIN (6 users)
    {"email": "admin@hospital.com", "username": "Super Admin", "role": ROLE_MAP["superadmin"]},
    {"email": "wilderman.dashawn@example.net", "username": "Leora Bernhard Elisa Lueilwitz", "role": ROLE_MAP["superadmin"]},
    {"email": "asd@gmail.com", "username": "test01 qweqwe", "role": ROLE_MAP["superadmin"]},
    {"email": "asdf@sd.com", "username": "sdfg xcvb", "role": ROLE_MAP["superadmin"]},
    {"email": "sample@coun.com", "username": "sample c counceler 01", "role": ROLE_MAP["superadmin"]},
    {"email": "dfg@wer.co", "username": "dfghj fghjk", "role": ROLE_MAP["superadmin"]},

    # DOCTOR (17 users)
    {"email": "marvin.greenholt@example.com", "username": "Sandy Muller Chandler Koch", "role": ROLE_MAP["doctor"]},
    {"email": "monahan.wilma@example.org", "username": "Jerrell Tremblay Jr. Prof. Shawn Funk", "role": ROLE_MAP["doctor"]},
    {"email": "grant.iliana@example.net", "username": "Brandyn Witting Savanna Torphy DDS", "role": ROLE_MAP["doctor"]},
    {"email": "grimes.keira@example.org", "username": "Gaylord Hagenes V Mr. Jose Zieme PhD", "role": ROLE_MAP["doctor"]},
    {"email": "wisoky.peyton@example.com", "username": "Brielle Padberg Prof. Chance Bogan", "role": ROLE_MAP["doctor"]},
    {"email": "doctor1.branch1@hospital.com", "username": "Doctor A1", "role": ROLE_MAP["doctor"]},
    {"email": "doctor2.branch1@hospital.com", "username": "Doctor A2", "role": ROLE_MAP["doctor"]},
    {"email": "doctor3.branch1@hospital.com", "username": "Doctor A3", "role": ROLE_MAP["doctor"]},
    {"email": "doctor4.branch1@hospital.com", "username": "Doctor A4", "role": ROLE_MAP["doctor"]},
    {"email": "doctor1.branch2@hospital.com", "username": "Doctor B1", "role": ROLE_MAP["doctor"]},
    {"email": "doctor2.branch2@hospital.com", "username": "Doctor B2", "role": ROLE_MAP["doctor"]},
    {"email": "doctor3.branch2@hospital.com", "username": "Doctor B3", "role": ROLE_MAP["doctor"]},
    {"email": "doctor4.branch2@hospital.com", "username": "Doctor B4", "role": ROLE_MAP["doctor"]},
    {"email": "doctor1.branch3@hospital.com", "username": "Doctor C1", "role": ROLE_MAP["doctor"]},
    {"email": "doctor2.branch3@hospital.com", "username": "Doctor C2", "role": ROLE_MAP["doctor"]},
    {"email": "doctor3.branch3@hospital.com", "username": "Doctor C3", "role": ROLE_MAP["doctor"]},
    {"email": "doctor4.branch3@hospital.com", "username": "Doctor C4", "role": ROLE_MAP["doctor"]},

    # BRANCH ADMIN (3 users)
    {"email": "IT Assistant Registration Form", "username": "Branch admin A1", "role": ROLE_MAP["branch_admin"]},
    {"email": "branch_admin1.branch2@hospital.com", "username": "Branch admin B1", "role": ROLE_MAP["branch_admin"]},
    {"email": "branch_admin1.branch3@hospital.com", "username": "Branch admin C1", "role": ROLE_MAP["branch_admin"]},

    # NURSE (9 users)
    {"email": "nurse1.branch1@hospital.com", "username": "Nurse A1", "role": ROLE_MAP["nurse"]},
    {"email": "nurse2.branch1@hospital.com", "username": "Nurse A2", "role": ROLE_MAP["nurse"]},
    {"email": "nurse3.branch1@hospital.com", "username": "Nurse A3", "role": ROLE_MAP["nurse"]},
    {"email": "nurse1.branch2@hospital.com", "username": "Nurse B1", "role": ROLE_MAP["nurse"]},
    {"email": "nurse2.branch2@hospital.com", "username": "Nurse B2", "role": ROLE_MAP["nurse"]},
    {"email": "nurse3.branch2@hospital.com", "username": "Nurse B3", "role": ROLE_MAP["nurse"]},
    {"email": "nurse1.branch3@hospital.com", "username": "Nurse C1", "role": ROLE_MAP["nurse"]},
    {"email": "nurse2.branch3@hospital.com", "username": "Nurse C2", "role": ROLE_MAP["nurse"]},
    {"email": "nurse3.branch3@hospital.com", "username": "Nurse C3", "role": ROLE_MAP["nurse"]},

    # PHARMACIST (6 users)
    {"email": "pharmacist1.branch1@hospital.com", "username": "Pharmacist A1", "role": ROLE_MAP["pharmacist"]},
    {"email": "pharmacist2.branch1@hospital.com", "username": "Pharmacist A2", "role": ROLE_MAP["pharmacist"]},
    {"email": "pharmacist1.branch2@hospital.com", "username": "Pharmacist B1", "role": ROLE_MAP["pharmacist"]},
    {"email": "pharmacist2.branch2@hospital.com", "username": "Pharmacist B2", "role": ROLE_MAP["pharmacist"]},
    {"email": "pharmacist1.branch3@hospital.com", "username": "Pharmacist C1", "role": ROLE_MAP["pharmacist"]},
    {"email": "pharmacist2.branch3@hospital.com", "username": "Pharmacist C2", "role": ROLE_MAP["pharmacist"]},

    # CASHIER (6 users)
    {"email": "cashier1.branch1@hospital.com", "username": "Cashier A1", "role": ROLE_MAP["cashier"]},
    {"email": "cashier2.branch1@hospital.com", "username": "Cashier A2", "role": ROLE_MAP["cashier"]},
    {"email": "cashier1.branch2@hospital.com", "username": "Cashier B1", "role": ROLE_MAP["cashier"]},
    {"email": "cashier2.branch2@hospital.com", "username": "Cashier B2", "role": ROLE_MAP["cashier"]},
    {"email": "cashier1.branch3@hospital.com", "username": "Cashier C1", "role": ROLE_MAP["cashier"]},
    {"email": "cashier2.branch3@hospital.com", "username": "Cashier C2", "role": ROLE_MAP["cashier"]},

    # RECEPTIONIST/PATIENT (5 users)
    {"email": "receptionist2.branch1@hospital.com", "username": "Receptionist A2", "role": ROLE_MAP["receptionist"]},
    {"email": "receptionist1.branch2@hospital.com", "username": "Receptionist B1", "role": ROLE_MAP["receptionist"]},
    {"email": "receptionist2.branch2@hospital.com", "username": "Receptionist B2", "role": ROLE_MAP["receptionist"]},
    {"email": "receptionist1.branch3@hospital.com", "username": "Receptionist C1", "role": ROLE_MAP["receptionist"]},
    {"email": "receptionist2.branch3@hospital.com", "username": "Receptionist C2", "role": ROLE_MAP["receptionist"]},

    # IT SUPPORT/SUPPLIER (6 users)
    {"email": "it_support1.branch1@hospital.com", "username": "It support A1", "role": ROLE_MAP["it_support"]},
    {"email": "it_support1.branch2@hospital.com", "username": "It support B1", "role": ROLE_MAP["it_support"]},
    {"email": "it_support1.branch3@hospital.com", "username": "It support C1", "role": ROLE_MAP["it_support"]},
    {"email": "mojitha.ekanayake@gmail.com", "username": "weer weer", "role": ROLE_MAP["supplier"]},
    {"email": "qeqw@gmail.com", "username": "test03 test03", "role": ROLE_MAP["supplier"]},
    {"email": "moek0000@gmail.com", "username": "test 10", "role": ROLE_MAP["supplier"]},

    # CENTER AID (6 users)
    {"email": "center_aid1.branch1@hospital.com", "username": "Center aid A1", "role": ROLE_MAP["center_aid"]},
    {"email": "center_aid2.branch1@hospital.com", "username": "Center aid A2", "role": ROLE_MAP["center_aid"]},
    {"email": "center_aid1.branch2@hospital.com", "username": "Center aid B1", "role": ROLE_MAP["center_aid"]},
    {"email": "center_aid2.branch2@hospital.com", "username": "Center aid B2", "role": ROLE_MAP["center_aid"]},
    {"email": "center_aid1.branch3@hospital.com", "username": "Center aid C1", "role": ROLE_MAP["center_aid"]},
    {"email": "center_aid2.branch3@hospital.com", "username": "Center aid C2", "role": ROLE_MAP["center_aid"]},

    # AUDITOR (3 users)
    {"email": "auditor1.branch1@hospital.com", "username": "Auditor A1", "role": ROLE_MAP["auditor"]},
    {"email": "auditor1.branch2@hospital.com", "username": "Auditor B1", "role": ROLE_MAP["auditor"]},
    {"email": "auditor1.branch3@hospital.com", "username": "Auditor C1", "role": ROLE_MAP["auditor"]},
]

DEFAULT_PASSWORD = "Test@123"

async def main():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        for user in USERS:
            result = await session.exec(select(User).where(User.email == user["email"]))
            exists = result.first()
            if not exists:
                new_user = User(
                    email=user["email"],
                    username=user["username"],
                    hashed_password=get_password_hash(DEFAULT_PASSWORD),
                    role_as=user["role"],
                    is_active=True
                )
                session.add(new_user)
                print(f"Added user: {user['email']} ({user['username']})")
        await session.commit()
        print("All users seeded.")

if __name__ == "__main__":
    asyncio.run(main())
