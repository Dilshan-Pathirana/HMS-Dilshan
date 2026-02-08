from .user import User, UserCreate, UserRead, UserBase
from .branch import Branch, BranchCreate
from .doctor import Doctor, DoctorCreate, DoctorRead
from .patient import Patient, PatientCreate, PatientRead
from .appointment import Appointment, AppointmentCreate, AppointmentRead
from .visit import Visit, VisitCreate, VisitRead, Queue, QueueCreate, QueueRead
from .pharmacy import Pharmacy, PharmacyCreate, PharmacyRead, PharmacyUpdate
from .staff_pharmacist import Pharmacist, PharmacistCreate, PharmacistRead
from .doctor_availability import (
	DoctorAvailability,
	DoctorAvailabilityCreate,
	DoctorAvailabilityRead,
)
