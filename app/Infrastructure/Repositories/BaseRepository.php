<?php

namespace App\Infrastructure\Repositories;

use App\Domain\Repositories\RepositoryInterface;
use Illuminate\Database\Eloquent\Model;

/**
 * Base repository implementation using Eloquent
 */
abstract class BaseRepository implements RepositoryInterface
{
    protected Model $model;

    public function __construct(Model $model)
    {
        $this->model = $model;
    }

    public function findById(int | string $id): ?object
    {
        return $this->model->find($id);
    }

    public function findAll(int $page = 1, int $perPage = 15): array
    {
        return $this->model
            ->paginate($perPage, ['*'], 'page', $page)
            ->items();
    }

    public function findByCriteria(array $criteria): array
    {
        $query = $this->model->query();

        foreach ($criteria as $key => $value) {
            if (is_array($value)) {
                $query->whereIn($key, $value);
            } else {
                $query->where($key, $value);
            }
        }

        return $query->get()->toArray();
    }

    public function create(array $data): object
    {
        return $this->model->create($data);
    }

    public function update(int | string $id, array $data): object
    {
        $entity = $this->model->findOrFail($id);
        $entity->update($data);
        return $entity->refresh();
    }

    public function delete(int | string $id): bool
    {
        return (bool) $this->model->destroy($id);
    }

    public function count(array $criteria = []): int
    {
        $query = $this->model->query();

        foreach ($criteria as $key => $value) {
            if (is_array($value)) {
                $query->whereIn($key, $value);
            } else {
                $query->where($key, $value);
            }
        }

        return $query->count();
    }

    public function exists(int | string $id): bool
    {
        return $this->model->where('id', $id)->exists();
    }

    /**
     * Add where clause to query
     */
    protected function where(string $column, mixed $operator, mixed $value = null): object
    {
        return $this->model->where($column, $operator, $value);
    }

    /**
     * Add where in clause
     */
    protected function whereIn(string $column, array $values): object
    {
        return $this->model->whereIn($column, $values);
    }
}
