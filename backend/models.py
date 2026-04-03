from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    PARENT = "parent"
    CHILD = "child"

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    display_name: str
    role: UserRole = UserRole.PARENT
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    parent_id: Optional[int] = Field(default=None, foreign_key="user.id")

# Portia's code (Converted to SQLModel so it works with the Login system)
class Chore(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    status: str = "assigned"

class Reward(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    points_required: int
