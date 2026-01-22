<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

// Domain Repository Interfaces
use App\Domain\Repositories\MedicalCenterRepositoryInterface;
use App\Domain\Repositories\PatientRepositoryInterface;
use App\Domain\Repositories\DoctorScheduleRepositoryInterface;
use App\Domain\Repositories\AppointmentRepositoryInterface;
use App\Domain\Repositories\SessionRepositoryInterface;
use App\Domain\Repositories\MedicationRepositoryInterface;
use App\Domain\Repositories\PrescriptionRepositoryInterface;
use App\Domain\Repositories\InvoiceRepositoryInterface;
use App\Domain\Repositories\PaymentRepositoryInterface;
use App\Domain\Repositories\AttendanceRepositoryInterface;
use App\Domain\Repositories\PayrollRepositoryInterface;
use App\Domain\Repositories\NotificationRepositoryInterface;
use App\Domain\Repositories\ChangeLogRepositoryInterface;

// Infrastructure Repository Implementations
use App\Infrastructure\Repositories\MedicalCenterRepository;
use App\Infrastructure\Repositories\PatientRepository;
use App\Infrastructure\Repositories\DoctorScheduleRepository;
use App\Infrastructure\Repositories\AppointmentRepository;
use App\Infrastructure\Repositories\SessionRepository;
use App\Infrastructure\Repositories\MedicationRepository;
use App\Infrastructure\Repositories\PrescriptionRepository;
use App\Infrastructure\Repositories\InvoiceRepository;
use App\Infrastructure\Repositories\PaymentRepository;
use App\Infrastructure\Repositories\AttendanceRepository;
use App\Infrastructure\Repositories\PayrollRepository;
use App\Infrastructure\Repositories\NotificationRepository;
use App\Infrastructure\Repositories\ChangeLogRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Bind repository interfaces to their implementations
        $this->app->bind(MedicalCenterRepositoryInterface::class, MedicalCenterRepository::class);
        $this->app->bind(PatientRepositoryInterface::class, PatientRepository::class);
        $this->app->bind(DoctorScheduleRepositoryInterface::class, DoctorScheduleRepository::class);
        $this->app->bind(AppointmentRepositoryInterface::class, AppointmentRepository::class);
        $this->app->bind(SessionRepositoryInterface::class, SessionRepository::class);
        $this->app->bind(MedicationRepositoryInterface::class, MedicationRepository::class);
        $this->app->bind(PrescriptionRepositoryInterface::class, PrescriptionRepository::class);
        $this->app->bind(InvoiceRepositoryInterface::class, InvoiceRepository::class);
        $this->app->bind(PaymentRepositoryInterface::class, PaymentRepository::class);
        $this->app->bind(AttendanceRepositoryInterface::class, AttendanceRepository::class);
        $this->app->bind(PayrollRepositoryInterface::class, PayrollRepository::class);
        $this->app->bind(NotificationRepositoryInterface::class, NotificationRepository::class);
        $this->app->bind(ChangeLogRepositoryInterface::class, ChangeLogRepository::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
