<?php

namespace App\Domain\Repositories;

/**
 * Base repository interface for all domain repositories
 * Implements the Repository pattern for data access abstraction
 */
interface RepositoryInterface
{
    /**
     * Find entity by ID
     */
    public function findById(int | string $id): ?object;

    /**
     * Find all entities
     */
    public function findAll(int $page = 1, int $perPage = 15): array;

    /**
     * Find entities by criteria
     */
    public function findByCriteria(array $criteria): array;

    /**
     * Create new entity
     */
    public function create(array $data): object;

    /**
     * Update existing entity
     */
    public function update(int | string $id, array $data): object;

    /**
     * Delete entity
     */
    public function delete(int | string $id): bool;

    /**
     * Count entities
     */
    public function count(array $criteria = []): int;

    /**
     * Check if entity exists
     */
    public function exists(int | string $id): bool;
}
