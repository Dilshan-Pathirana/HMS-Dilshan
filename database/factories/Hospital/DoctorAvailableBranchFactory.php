<?php

namespace Database\Factories\Hospital;

use Illuminate\Support\Str;
use App\Models\AllUsers\User;
use App\Models\AllUsers\Doctor;
use App\Models\Hospital\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Hospital\DoctorAvailableBranch>
 */
class DoctorAvailableBranchFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $doctorUser = User::factory()->make();

        Doctor::factory()->make([
            'id' => Str::uuid(),
            'user_id' => $doctorUser->id,
        ]);

        $branch = Branch::factory()->make();

        return [
            'user_id' => $doctorUser->id,
            'branch_id' => $branch->id,
        ];
    }
}
