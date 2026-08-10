from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="User password (min 8 chars)")
    full_name: Optional[str] = Field(None, max_length=100)


class ProfileResponse(BaseModel):
    id: int
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    theme: str

    class Config:
        from_attributes = True


class UserResponse(UserBase):
    id: int
    is_active: bool
    profile: Optional[ProfileResponse] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
