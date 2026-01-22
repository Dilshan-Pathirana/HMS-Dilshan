<?php

namespace Database\Factories\StaffSalary;

use Illuminate\Support\Str;
use App\Models\StaffSalary\EmployeeBankDetails;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StaffSalary\EmployeeBankDetails>
 */
class EmployeeBankDetailsFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    protected $model = EmployeeBankDetails::class;

    public function definition(): array
    {
        return [
            'user_id' => Str::uuid(),
            'bank_name' => $this->faker->company(),
            'branch_name' => $this->faker->city(),
            'branch_code' => $this->faker->numerify('####'),
            'account_number' => $this->faker->bankAccountNumber(),
            'account_owner_name' => $this->faker->name(),
        ];
    }
}
