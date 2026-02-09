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
from .token_blacklist import TokenBlacklist
from app.core.audit import ChangeLog
from .doctor_schedule import (
    DoctorSchedule,
    DoctorScheduleCreate,
    DoctorScheduleRead,
    DoctorScheduleCancellation,
    DoctorScheduleCancellationCreate,
    DoctorScheduleCancellationRead,
    SlotLock,
    SlotLockCreate,
    SlotLockRead,
    ScheduleModification,
    ScheduleModificationCreate,
    ScheduleModificationRead,
)
from .appointment_extras import (
    AppointmentAuditLog,
    AppointmentAuditLogRead,
    AppointmentSettings,
    AppointmentSettingsCreate,
    AppointmentSettingsRead,
)
from .patient_dashboard import (
    HealthCondition,
    HealthConditionCreate,
    HealthConditionRead,
    Feedback,
    FeedbackCreate,
    FeedbackRead,
)
from .consultation import (
    Consultation,
    ConsultationCreate,
    ConsultationRead,
    ConsultationDiagnosis,
    ConsultationDiagnosisCreate,
    ConsultationDiagnosisRead,
    ConsultationPrescription,
    ConsultationPrescriptionCreate,
    ConsultationPrescriptionRead,
    ConsultationQuestion,
    ConsultationQuestionCreate,
    ConsultationQuestionRead,
    Investigation,
    InvestigationCreate,
    InvestigationRead,
)
from .pharmacy_inventory import (
    Product,
    ProductCreate,
    ProductRead,
    Supplier,
    SupplierCreate,
    SupplierRead,
    ProductStock,
    ProductStockCreate,
    ProductStockRead,
    PharmacyInventory,
    InventoryBatch,
    InventoryBatchRead,
    PharmacyStockTransaction,
    PharmacyStockTransactionRead,
    DailyPurchaseProduct,
    DailyPurchaseProductCreate,
    DailyPurchaseProductRead,
    Prescription,
    PrescriptionCreate,
    PrescriptionRead,
)
from .notification import (
    Notification,
    NotificationCreate,
    NotificationRead,
)
from .nurse_domain import (
    VitalSign,
    VitalSignCreate,
    VitalSignRead,
    NurseHandover,
    NurseHandoverCreate,
    NurseHandoverRead,
)
from .pos import (
    BillingTransaction,
    BillingTransactionCreate,
    BillingTransactionRead,
    TransactionItem,
    TransactionItemCreate,
    TransactionItemRead,
    CashRegister,
    CashRegisterCreate,
    CashRegisterRead,
    CashEntry,
    CashEntryCreate,
    CashEntryRead,
    DailyCashSummary,
    DailyCashSummaryCreate,
    DailyCashSummaryRead,
    EODReport,
    EODReportCreate,
    EODReportRead,
    POSAuditLog,
    POSAuditLogCreate,
    POSAuditLogRead,
)
from .hrm_leave import (
    LeaveType,
    LeaveTypeCreate,
    LeaveTypeRead,
    Leave,
    LeaveCreate,
    LeaveRead,
    AdminLeave,
    AdminLeaveCreate,
    AdminLeaveRead,
)
from .hrm_salary import (
    StaffSalary,
    StaffSalaryCreate,
    StaffSalaryRead,
    SalaryPay,
    SalaryPayCreate,
    SalaryPayRead,
    EmployeeOT,
    EmployeeOTCreate,
    EmployeeOTRead,
)
from .hrm_shift import (
    EmployeeShift,
    EmployeeShiftCreate,
    EmployeeShiftRead,
    Attendance,
    AttendanceCreate,
    AttendanceRead,
    BankDetail,
    BankDetailCreate,
    BankDetailRead,
)
from .hrm_policy import (
    HRPolicy,
    HRPolicyCreate,
    HRPolicyRead,
    ServiceLetterRequest,
    ServiceLetterRequestCreate,
    ServiceLetterRequestRead,
)
from .purchase_request import (
    PurchaseRequest,
    PurchaseRequestCreate,
    PurchaseRequestRead,
    PurchaseRequestItem,
    PurchaseRequestItemCreate,
    PurchaseRequestItemRead,
)
from .medical_insights import (
    MedicalPost,
    MedicalPostCreate,
    MedicalPostRead,
    PostComment,
    PostCommentCreate,
    PostCommentRead,
    QuestionAnswer,
    QuestionAnswerCreate,
    QuestionAnswerRead,
)
from .doctor_session import (
    DoctorSession,
    DoctorSessionCreate,
    DoctorSessionRead,
    DoctorCreatedDisease,
    DoctorCreatedDiseaseCreate,
    DoctorCreatedDiseaseRead,
)
from .chatbot import (
    ChatbotFAQ,
    ChatbotFAQCreate,
    ChatbotFAQRead,
    ChatbotLog,
    ChatbotLogCreate,
    ChatbotLogRead,
)
from .sms_log import (
    SmsLog,
    SmsLogCreate,
    SmsLogRead,
)

from .doctor_main_question import (
    DoctorMainQuestion,
    DoctorMainQuestionCreate,
    DoctorMainQuestionUpdate,
    DoctorMainQuestionAnswer,
    DoctorMainQuestionAnswerCreate,
)
from .website import (
    SystemSettings,
    SystemSettingsCreate,
    SystemSettingsRead,
    WebDoctor,
    WebDoctorCreate,
    WebDoctorRead,
    WebService,
    WebServiceCreate,
    WebServiceRead,
    ContactMessage,
    ContactMessageCreate,
    ContactMessageRead,
)
