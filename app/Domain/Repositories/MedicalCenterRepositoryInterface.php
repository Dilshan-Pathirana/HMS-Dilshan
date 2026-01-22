<?php

namespace App\Domain\Repositories;

use App\Models\MedicalCenter;
use Illuminate\Support\Collection;

interface MedicalCenterRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Find medical center by center code
     */
    public function findByCode(string $code): ?MedicalCenter;

    /**
     * Get all active medical centers
     */
    public function getActive(): Collection;

    /**
     * Get medical centers by city
     */
    public function getByCity(string $city): Collection;

    /**
     * Get medical center with tenant admin
     */
    public function findWithAdmin(int $id): ?MedicalCenter;

    /**
     * Get medical centers with statistics
     */
    public function getWithStats(): Collection;
}
