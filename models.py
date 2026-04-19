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
    
    reset_token: Optional[str] = Field(default=None, index=True)
    reset_token_expires: Optional[datetime] = Field(default=None)
    
    chores: List["Chore"] = Relationship(back_populates="assigned_user")

class Chore(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    points_worth: int = Field(default=10)
    status: str = Field(default="assigned")
    submission_notes: Optional[str] = Field(default=None)
    due_date: Optional[datetime] = None
    recurrence: str = Field(default="none") # "none", "daily", "weekly"
    
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    assigned_user: Optional[User] = Relationship(back_populates="chores")

class Reward(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    points_required: int
    icon: str = Field(default="🎁")
    quantity: Optional[int] = Field(default=None)

class ClaimedReward(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    reward_id: int = Field(foreign_key="reward.id")
    user_id: int = Field(foreign_key="user.id")
    status: str = Field(default="pending") # "pending", "fulfilled"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PointTransaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    amount: int
    reason: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Notification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    title: str
    message: str
    is_read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)





''' #previous code:
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Chore(Base):
    __tablename__ = "chores"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    status = Column(String, default="assigned")
    created_at = Column(DateTime, default=datetime.utcnow)


class Reward(Base):
    __tablename__ = "rewards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    points_required = Column(Integer)
'''
