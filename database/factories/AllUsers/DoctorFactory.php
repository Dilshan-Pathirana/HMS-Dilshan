<?php

namespace Database\Factories\AllUsers;

use Illuminate\Support\Str;
use App\Models\AllUsers\User;
use App\Models\AllUsers\Doctor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Doctor>
 */
class DoctorFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $user = User::factory()->create([
            'id' => Str::uuid(),
            'role_as' => 5,
        ]);

        return [
            'employee_id' => strtoupper(Str::random(6)),
            'user_id' => $user->id,
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
            'medical_registration_number' => strtoupper(Str::random(8)),
            'qualifications' => $this->faker->randomElement(['Degree', 'Master', 'PhD']),
            'years_of_experience' => $this->faker->numberBetween(1, 40),
            'areas_of_specialization' => $this->faker->randomElement(['Homeopathy', 'Therapy']),
            'previous_employment' => $this->faker->company.', '.$this->faker->jobTitle,
            'license_validity_date' => $this->faker->date('Y-m-d'),
            'joining_date' => $this->faker->date('Y-m-d'),
            'contract_type' => $this->faker->randomElement(['full-time', 'part-time', 'consultant']),
            'contract_duration' => $this->faker->numberBetween(1, 24).' months',
            'probation_start_date' => $this->faker->date('Y-m-d'),
            'probation_end_date' => $this->faker->date('Y-m-d'),
            'compensation_package' => $this->faker->randomFloat(2, 50000, 200000),
        ];
    }

    public function doctorCreateFactory():Factory|self
    {
        return $this->state(function () {
            return [
                'first_name' => $this->faker->firstName,
                'last_name' => $this->faker->lastName,
                'password' => '12345678',
            ];
        });
    }
}
