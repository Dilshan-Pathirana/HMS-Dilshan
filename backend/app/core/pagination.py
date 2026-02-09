"""
Reusable pagination dependency for list endpoints.

Usage:
    from app.core.pagination import PaginationParams, paginate

    @router.get("/items")
    async def list_items(
        pagination: PaginationParams = Depends(),
        session: AsyncSession = Depends(get_session),
    ):
        query = select(Item)
        return await paginate(session, query, pagination)
"""
from typing import TypeVar, Generic, List, Optional
from fastapi import Query
from pydantic import BaseModel
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession


class PaginationParams:
    def __init__(
        self,
        skip: int = Query(0, ge=0, description="Number of records to skip"),
        limit: int = Query(20, ge=1, le=100, description="Max records to return"),
    ):
        self.skip = skip
        self.limit = limit


class PaginatedResponse(BaseModel):
    items: list
    total: int
    skip: int
    limit: int
    pages: int


async def paginate(session: AsyncSession, query, pagination: PaginationParams) -> PaginatedResponse:
    """Execute a query with pagination and return a structured response."""
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await session.exec(count_query)
    total = total_result.one()

    # Fetch page
    paged_query = query.offset(pagination.skip).limit(pagination.limit)
    result = await session.exec(paged_query)
    items = result.all()

    pages = max(1, -(-total // pagination.limit))  # ceil division

    return PaginatedResponse(
        items=items,
        total=total,
        skip=pagination.skip,
        limit=pagination.limit,
        pages=pages,
    )
