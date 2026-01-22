<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\HRM\HRPolicy;
use Illuminate\Support\Str;
use Carbon\Carbon;

class HRPolicySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $policies = [
            [
                'policy_name' => 'Annual Leave Policy',
                'policy_category' => 'Leave',
                'description' => 'Guidelines for annual leave entitlement, application, and approval process',
                'policy_content' => "All employees are entitled to 14 working days of annual leave per year.\n\nLeave Application:\n- Must be applied at least 2 weeks in advance\n- Requires supervisor approval\n- Maximum 10 consecutive days without special approval\n\nCarry Forward:\n- Up to 7 days can be carried forward to next year\n- Unused leave expires after 12 months",
                'effective_date' => '2025-01-01',
                'status' => 'Active'
            ],
            [
                'policy_name' => 'Attendance & Punctuality Policy',
                'policy_category' => 'Attendance',
                'description' => 'Standards for employee attendance, punctuality, and time-keeping',
                'policy_content' => "Working Hours: 8:30 AM - 5:30 PM (Monday to Friday)\n\nAttendance Rules:\n- Employees must mark attendance daily\n- Late arrivals (>15 min) will be recorded\n- 3 late arrivals in a month = written warning\n\nAbsenteeism:\n- Unexcused absence = Loss of pay\n- Medical leave requires doctor's certificate",
                'effective_date' => '2025-01-01',
                'status' => 'Active'
            ],
            [
                'policy_name' => 'Salary Structure & Pay Dates',
                'policy_category' => 'Salary & Compensation',
                'description' => 'Compensation structure, pay components, and payment schedule',
                'policy_content' => "Pay Components:\n- Basic Salary\n- Allowances (Transport, Mobile, etc.)\n- EPF/ETF Contributions\n- Performance Bonuses\n\nPay Date: Last working day of the month\n\nDeductions:\n- EPF Employee: 8%\n- Tax as per Inland Revenue guidelines\n- Loans/Advances as per agreement",
                'effective_date' => '2025-01-01',
                'status' => 'Active'
            ],
            [
                'policy_name' => 'Medical Insurance Benefits',
                'policy_category' => 'Benefits',
                'description' => 'Medical and health insurance coverage for employees and dependents',
                'policy_content' => "Coverage:\n- Employee: Full coverage\n- Spouse: 75% coverage\n- Children (up to 2): 50% coverage\n\nIncludes:\n- Hospitalization\n- OPD consultations\n- Prescription medications\n- Annual health checkup\n\nClaim Process:\n- Submit bills within 30 days\n- Pre-approval required for surgeries",
                'effective_date' => '2025-01-01',
                'status' => 'Active'
            ],
            [
                'policy_name' => 'Overtime Compensation Policy',
                'policy_category' => 'Working Hours',
                'description' => 'Guidelines for overtime work approval and compensation',
                'policy_content' => "Overtime Eligibility:\n- Non-executive staff eligible\n- Must be pre-approved by supervisor\n\nRates:\n- Weekday OT: 1.5x hourly rate\n- Weekend OT: 2.0x hourly rate\n- Public Holiday: 2.5x hourly rate\n\nMaximum: 20 hours per month without special approval",
                'effective_date' => '2025-01-01',
                'status' => 'Active'
            ],
            [
                'policy_name' => 'Code of Conduct',
                'policy_category' => 'Code of Conduct',
                'description' => 'Professional standards and ethical behavior guidelines for all employees',
                'policy_content' => "Professional Conduct:\n- Respect and courtesy to all\n- Confidentiality of sensitive information\n- No discrimination or harassment\n- Proper dress code\n\nProhibited Activities:\n- Use of drugs/alcohol at work\n- Theft or fraud\n- Conflict of interest\n- Unauthorized disclosure of information\n\nViolations may result in disciplinary action including termination.",
                'effective_date' => '2025-01-01',
                'status' => 'Active'
            ],
            [
                'policy_name' => 'Work from Home Policy',
                'policy_category' => 'Working Hours',
                'description' => 'Guidelines for remote work arrangements and eligibility',
                'policy_content' => "Eligibility:\n- Staff with >1 year service\n- Role suitable for remote work\n- Manager approval required\n\nRequirements:\n- Stable internet connection\n- Available during working hours\n- Weekly office attendance (min 2 days)\n\nProductivity:\n- Daily task reporting\n- Video meetings as required\n- Performance monitored monthly",
                'effective_date' => '2025-02-01',
                'status' => 'Active'
            ],
            [
                'policy_name' => 'Performance Review Process',
                'policy_category' => 'Training & Development',
                'description' => 'Annual performance evaluation and feedback mechanism',
                'policy_content' => "Review Cycle: Annual (December)\n\nProcess:\n1. Self-assessment by employee\n2. Supervisor evaluation\n3. One-on-one feedback session\n4. Goal setting for next year\n\nCriteria:\n- Job knowledge and skills\n- Quality of work\n- Teamwork and collaboration\n- Initiative and innovation\n\nOutcome: Salary increment, promotion, training needs",
                'effective_date' => '2025-01-01',
                'status' => 'Active'
            ],
            [
                'policy_name' => 'Notice Period & Resignation',
                'policy_category' => 'Resignation & Termination',
                'description' => 'Requirements for employee resignation and notice periods',
                'policy_content' => "Notice Period:\n- Probation period: 2 weeks\n- Non-executive: 1 month\n- Executive/Manager: 2 months\n- Senior Management: 3 months\n\nResignation Process:\n1. Written resignation letter\n2. Exit interview with HR\n3. Handover of responsibilities\n4. Return company property\n5. Final settlement within 30 days",
                'effective_date' => '2025-01-01',
                'status' => 'Active'
            ],
            [
                'policy_name' => 'Training & Development Policy - DRAFT',
                'policy_category' => 'Training & Development',
                'description' => 'Professional development opportunities and training programs',
                'policy_content' => "Training Opportunities:\n- Internal training sessions\n- External workshops/seminars\n- Online courses (with approval)\n- Mentorship programs\n\nEligibility:\n- All permanent employees\n- Training must align with job role\n- Manager recommendation required\n\nCost Coverage:\n- Company pays for job-related training\n- Bond agreement for courses >LKR 100,000",
                'effective_date' => '2025-03-01',
                'status' => 'Draft'
            ]
        ];

        echo "Creating HR policies...\n";

        foreach ($policies as $policyData) {
            HRPolicy::create([
                'id' => Str::uuid(),
                'policy_name' => $policyData['policy_name'],
                'policy_category' => $policyData['policy_category'],
                'description' => $policyData['description'],
                'policy_content' => $policyData['policy_content'],
                'effective_date' => $policyData['effective_date'],
                'expiry_date' => $policyData['expiry_date'] ?? null,
                'status' => $policyData['status'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        echo "✓ Created " . count($policies) . " HR policies\n";
    }
}
