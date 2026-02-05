from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.core.database import get_session
from app.models.user import User, UserCreate, UserRead, UserUpdate
from app.api.deps import get_current_active_superuser, get_current_user
from app.core.security import get_password_hash

router = APIRouter()

@router.get("/me", response_model=UserRead)
async def read_user_me(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user.
    """
    return current_user

@router.post("/", response_model=UserRead)
async def create_user(
    user_in: UserCreate,
    current_user: User = Depends(get_current_active_superuser),
    session: AsyncSession = Depends(get_session)
):
    query = select(User).where(User.email == user_in.email)
    result = await session.exec(query)
    if result.first():
        raise HTTPException(status_code=400, detail="The user with this email already exists")

    # Create user dict excluding strict password field if it exists in dict vs model mismatch
    user_data = user_in.model_dump(exclude={"password"})
    user = User(**user_data, hashed_password=get_password_hash(user_in.password))

    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user

@router.get("/", response_model=List[UserRead])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    query = select(User).offset(skip).limit(limit)
    result = await session.exec(query)
    return result.all()

@router.get("/{user_id}", response_model=UserRead)
async def read_user(
    user_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: str,
    user_in: UserUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_in.email is not None:
        user.email = user_in.email
    if user_in.username is not None:
        user.username = user_in.username
    if user_in.role_as is not None:
        user.role_as = user_in.role_as
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.password is not None:
        user.hashed_password = get_password_hash(user_in.password)

    session.add(user)
    try:
        await session.commit()
        await session.refresh(user)
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail="Update failed. Username or email might already exist.")
    return user

@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_superuser)
):
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await session.delete(user)
    await session.commit()
    return {"message": "User deleted successfully"}

