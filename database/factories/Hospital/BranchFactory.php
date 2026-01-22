<?php

namespace Database\Factories\Hospital;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Hospital\Branch>
 */
class BranchFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->create('register_document.pdf', 100, 'application/pdf');

        return [
            'center_name' => $this->faker->randomElement(['tesla', 'microsoft', 'facebook']),
            'register_number' => strval($this->faker->randomNumber(8)),
            'register_document' => $file,
            'center_type' => $this->faker->randomElement([
                'Cardiology_Clinic',
                'Dermatology_Clinic',
                'Orthopedic_Clinic',
                'Pediatrics_Clinic',
                'Obstetrics_Clinic',
            ]),
            'division' => $this->faker->randomElement([
                'Kurunegala',
                'rambukkana',
                'rathmalana',
                'Rathnapura',
            ]),
            'division_number' => 'BA'.$this->faker->randomNumber(1, 200),
            'owner_type' => $this->faker->randomElement(['private', 'public', 'corporate-owned']),
            'owner_full_name' => $this->faker->name(),
            'owner_id_number' => strval($this->faker->randomNumber(8)),
            'owner_contact_number' => $this->faker->phoneNumber(),
        ];
    }
}
