<?php

namespace App\Core\Enums;

enum UserRole: string
{
    case SUPER_ADMIN = 'super_admin';
    case TENANT_ADMIN = 'tenant_admin';
    case CENTER_ADMIN = 'center_admin';
    case DOCTOR = 'doctor';
    case RECEPTIONIST = 'receptionist';
    case PHARMACIST = 'pharmacist';
    case CASHIER = 'cashier';
    case PATIENT = 'patient';
    case NURSE = 'nurse';
    case LAB_TECHNICIAN = 'lab_technician';
    case IT_SUPPORT = 'it_support';
    case MEDICAL_CENTER_AIDE = 'medical_center_aide';

    public function label(): string
    {
        return match ($this) {
            self::SUPER_ADMIN => 'Super Admin',
            self::TENANT_ADMIN => 'Tenant Admin',
            self::CENTER_ADMIN => 'Center Admin',
            self::DOCTOR => 'Doctor',
            self::RECEPTIONIST => 'Receptionist',
            self::PHARMACIST => 'Pharmacist',
            self::CASHIER => 'Cashier',
            self::PATIENT => 'Patient',
            self::NURSE => 'Nurse',
            self::LAB_TECHNICIAN => 'Lab Technician',
            self::IT_SUPPORT => 'IT Support',
            self::MEDICAL_CENTER_AIDE => 'Medical Center Aide',
        };
    }

    public function permissions(): array
    {
        return match ($this) {
            self::SUPER_ADMIN => ['*'],
            self::TENANT_ADMIN => [
                'centers.create', 'centers.update', 'centers.delete', 'centers.read',
                'staff.create', 'staff.update', 'staff.delete', 'staff.read',
                'patients.read', 'appointments.read', 'sessions.read',
            ],
            self::CENTER_ADMIN => [
                'center.manage', 'staff.manage', 'patients.manage',
                'appointments.manage', 'sessions.manage', 'pharmacy.manage',
            ],
            self::DOCTOR => [
                'sessions.create', 'sessions.update', 'prescriptions.create',
                'patients.read', 'appointments.read',
            ],
            self::RECEPTIONIST => [
                'appointments.create', 'appointments.update', 'appointments.cancel',
                'patients.create', 'patients.read', 'sessions.initiate',
            ],
            self::PHARMACIST => [
                'medications.read', 'medications.manage', 'dispensing.create',
                'prescriptions.read', 'inventory.read', 'inventory.manage',
            ],
            self::CASHIER => [
                'invoices.read', 'payments.create', 'payments.update',
                'appointments.read', 'sessions.read',
            ],
            self::PATIENT => [
                'profile.read', 'profile.update', 'appointments.create',
                'appointments.read', 'medical_records.read',
            ],
            self::NURSE => [
                'patients.read', 'patients.update', 'sessions.read',
                'sessions.update',
            ],
            self::LAB_TECHNICIAN => [
                'lab_tests.read', 'lab_tests.update', 'test_results.create',
                'test_results.update', 'prescriptions.read',
            ],
            self::IT_SUPPORT => [
                'system.read', 'system.manage', 'sessions.read',
                'media.upload', 'media.delete',
            ],
            self::MEDICAL_CENTER_AIDE => [
                'appointments.read', 'patients.read',
            ],
        };
    }
}
