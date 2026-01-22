<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * STEP 16 & 17: HR Letters Templates and Requests
     * Manages work confirmation, service period, and other HR letters
     */
    public function up(): void
    {
        // Letter templates
        Schema::create('hr_letter_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 50)->unique();
            $table->string('name');
            $table->enum('letter_type', ['confirmation', 'service_period', 'experience', 'salary_certificate', 'no_objection', 'recommendation', 'other']);
            $table->text('template_content'); // HTML/Blade template
            $table->json('required_fields')->nullable(); // Fields needed to generate
            $table->boolean('requires_approval')->default(true);
            $table->boolean('is_active')->default(true);
            $table->text('footer_text')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();
        });

        // Letter requests
        Schema::create('hr_letter_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id'); // Employee requesting
            $table->uuid('template_id');
            $table->string('reference_number', 50)->unique();
            $table->text('purpose')->nullable(); // Why the letter is needed
            $table->string('addressed_to')->nullable(); // To whom
            $table->date('required_by')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'generated', 'collected'])->default('pending');
            $table->uuid('processed_by')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->text('generated_content')->nullable(); // Final generated letter
            $table->string('file_path')->nullable(); // PDF path if stored
            $table->timestamp('collected_at')->nullable();
            $table->text('admin_remarks')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('template_id')->references('id')->on('hr_letter_templates')->onDelete('cascade');
            $table->index(['user_id', 'status']);
            $table->index(['status', 'created_at']);
        });

        // Seed default letter templates
        DB::table('hr_letter_templates')->insert([
            [
                'id' => \Illuminate\Support\Str::uuid(),
                'code' => 'CONFIRMATION',
                'name' => 'Employment Confirmation Letter',
                'letter_type' => 'confirmation',
                'template_content' => '<div style="font-family: Arial, sans-serif; padding: 40px;">
                    <div style="text-align: center; margin-bottom: 40px;">
                        <h1 style="margin: 0;">{{company_name}}</h1>
                        <p style="margin: 5px 0;">{{company_address}}</p>
                    </div>
                    <p style="text-align: right;">Date: {{date}}</p>
                    <p style="text-align: right;">Ref: {{reference_number}}</p>
                    <br>
                    <h2 style="text-align: center; text-decoration: underline;">TO WHOM IT MAY CONCERN</h2>
                    <br>
                    <p>This is to certify that <strong>{{employee_name}}</strong>, holder of National Identity Card No. <strong>{{nic}}</strong>, 
                    is employed at {{company_name}} as <strong>{{designation}}</strong> in the <strong>{{department}}</strong> department 
                    since <strong>{{join_date}}</strong>.</p>
                    <br>
                    <p>{{employee_name}} is a permanent/contract employee of our organization.</p>
                    <br>
                    <p>This letter is issued upon the request of the above-named employee for {{purpose}}.</p>
                    <br><br>
                    <p>___________________________</p>
                    <p><strong>Authorized Signatory</strong></p>
                    <p>Human Resources Department</p>
                </div>',
                'required_fields' => json_encode(['employee_name', 'nic', 'designation', 'department', 'join_date', 'purpose']),
                'requires_approval' => true,
                'is_active' => true,
                'footer_text' => 'This letter is computer-generated and valid without a signature for verification purposes.',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => \Illuminate\Support\Str::uuid(),
                'code' => 'SERVICE_PERIOD',
                'name' => 'Service Period Certificate',
                'letter_type' => 'service_period',
                'template_content' => '<div style="font-family: Arial, sans-serif; padding: 40px;">
                    <div style="text-align: center; margin-bottom: 40px;">
                        <h1 style="margin: 0;">{{company_name}}</h1>
                        <p style="margin: 5px 0;">{{company_address}}</p>
                    </div>
                    <p style="text-align: right;">Date: {{date}}</p>
                    <p style="text-align: right;">Ref: {{reference_number}}</p>
                    <br>
                    <h2 style="text-align: center; text-decoration: underline;">SERVICE CERTIFICATE</h2>
                    <br>
                    <p>This is to certify that <strong>{{employee_name}}</strong>, holder of National Identity Card No. <strong>{{nic}}</strong>, 
                    was/is employed at {{company_name}} from <strong>{{start_date}}</strong> to <strong>{{end_date}}</strong> 
                    as <strong>{{designation}}</strong> in the <strong>{{department}}</strong> department.</p>
                    <br>
                    <p><strong>Service Period:</strong> {{service_years}} years and {{service_months}} months</p>
                    <br>
                    <p>During the tenure with us, {{employee_name}} has demonstrated {{performance_remarks}}.</p>
                    <br>
                    <p>We wish {{employee_name}} all the best in future endeavors.</p>
                    <br><br>
                    <p>___________________________</p>
                    <p><strong>Authorized Signatory</strong></p>
                    <p>Human Resources Department</p>
                </div>',
                'required_fields' => json_encode(['employee_name', 'nic', 'designation', 'department', 'start_date', 'end_date', 'service_years', 'service_months']),
                'requires_approval' => true,
                'is_active' => true,
                'footer_text' => 'This certificate is issued upon request and is valid for official purposes.',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => \Illuminate\Support\Str::uuid(),
                'code' => 'SALARY_CERT',
                'name' => 'Salary Certificate',
                'letter_type' => 'salary_certificate',
                'template_content' => '<div style="font-family: Arial, sans-serif; padding: 40px;">
                    <div style="text-align: center; margin-bottom: 40px;">
                        <h1 style="margin: 0;">{{company_name}}</h1>
                        <p style="margin: 5px 0;">{{company_address}}</p>
                    </div>
                    <p style="text-align: right;">Date: {{date}}</p>
                    <p style="text-align: right;">Ref: {{reference_number}}</p>
                    <br>
                    <h2 style="text-align: center; text-decoration: underline;">SALARY CERTIFICATE</h2>
                    <br>
                    <p>This is to certify that <strong>{{employee_name}}</strong>, holder of NIC No. <strong>{{nic}}</strong>, 
                    is employed at {{company_name}} as <strong>{{designation}}</strong>.</p>
                    <br>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr><td style="padding: 8px; border: 1px solid #ddd;">Basic Salary</td><td style="padding: 8px; border: 1px solid #ddd;">LKR {{basic_salary}}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd;">Allowances</td><td style="padding: 8px; border: 1px solid #ddd;">LKR {{allowances}}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Gross Salary</td><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">LKR {{gross_salary}}</td></tr>
                    </table>
                    <br>
                    <p>This certificate is issued for {{purpose}}.</p>
                    <br><br>
                    <p>___________________________</p>
                    <p><strong>Authorized Signatory</strong></p>
                </div>',
                'required_fields' => json_encode(['employee_name', 'nic', 'designation', 'basic_salary', 'allowances', 'gross_salary', 'purpose']),
                'requires_approval' => true,
                'is_active' => true,
                'footer_text' => 'Salary details are confidential. This certificate is issued upon specific request only.',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hr_letter_requests');
        Schema::dropIfExists('hr_letter_templates');
    }
};
