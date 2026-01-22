<?php

namespace Database\Factories\AllUsers;

use Illuminate\Support\Str;
use App\Models\Hospital\Branch;
use App\Models\AllUsers\Pharmacist;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Pharmacist>
 */
class PharmacistFactory extends Factory
{
    protected $model = Pharmacist::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $branch = Branch::factory()->create([
            'id' => Str::uuid(),
        ]);

        return [
            'employee_id' => strtoupper(Str::random(6)),
            'user_id' => Str::uuid(),
            'branch_id' => $branch->id,
            'date_of_birth' => $this->faker->date('Y-m-d', '2000-01-01'),
            'gender' => $this->faker->randomElement(['male', 'female', 'other']),
            'nic_number' => strtoupper(Str::random(10)),
            'contact_number_mobile' => $this->faker->phoneNumber,
            'contact_number_landline' => $this->faker->phoneNumber,
            'email' => $this->faker->unique()->safeEmail,
            'home_address' => $this->faker->address,
            'emergency_contact_info' => $this->faker->name.' - '.$this->faker->phoneNumber,
            'photo' => $this->faker->imageUrl(),
            'nic_photo' => $this->faker->imageUrl(),
            'pharmacist_registration_number' => strtoupper(Str::random(8)),
            'qualifications' => $this->faker->randomElement(['Degree in Pharmacy', 'Diploma in Pharmacy']),
            'years_of_experience' => $this->faker->numberBetween(1, 30),
            'previous_employment' => $this->faker->company.', '.$this->faker->jobTitle,
            'license_validity_date' => $this->faker->date('Y-m-d'),
            'joining_date' => $this->faker->date('Y-m-d'),
            'contract_type' => $this->faker->randomElement(['full-time', 'part-time', 'consultant']),
            'contract_duration' => $this->faker->numberBetween(1, 24).' months',
            'probation_start_date' => $this->faker->date('Y-m-d'),
            'probation_end_date' => $this->faker->date('Y-m-d'),
            'compensation_package' => $this->faker->randomFloat(2, 30000, 150000),
        ];
    }

    public function pharmacistCreateFactory(): Factory|self
    {
        return $this->state(function () {
            return [
                'first_name' => $this->faker->firstName,
                'last_name' => $this->faker->lastName,
                'password' => ('12345678'),
            ];
        });
    }
}
