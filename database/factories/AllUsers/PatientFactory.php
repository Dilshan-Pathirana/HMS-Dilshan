<?php

namespace Database\Factories\AllUsers;

use Illuminate\Support\Str;
use App\Models\Hospital\Branch;
use App\Services\EmployeeIdGenerator;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Services\GetBranchDivisionNumberFromBranchId;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Patient>
 */
class PatientFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $branch = Branch::factory()->create();

        return [
            'first_name' => $this->faker->firstName,
            'last_name' => $this->faker->lastName,
            'branch_id' => $branch->id,
            'patient_id' => EmployeeIdGenerator::generate(
                6,
                GetBranchDivisionNumberFromBranchId::getBranchDivisionNumber(
                    $branch->id
                )
            ),
            'user_id' => Str::uuid(),
            'phone' => $this->faker->phoneNumber,
            'NIC' => $this->faker->unique()->randomNumber(9, true).'V',
            'email' => $this->faker->unique()->safeEmail,
            'address' => $this->faker->address,
        ];
    }
}
