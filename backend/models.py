from enum import Enum
from typing import List, Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship

class UserRole(str, Enum):
    PARENT = "parent"
    CHILD = "child"

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    display_name: str
    role: UserRole
    
    is_active: bool = Field(default=True)
    parent_id: Optional[int] = Field(default=None, foreign_key="user.id")
    invite_code: Optional[str] = Field(default=None, unique=True, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    total_points: int = Field(default=0)
    
    chores: List["Chore"] = Relationship(back_populates="assigned_user")

class Chore(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    points_worth: int = Field(default=10)
    status: str = Field(default="assigned")
    
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    assigned_user: Optional[User] = Relationship(back_populates="chores")

class Reward(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    points_required: int
