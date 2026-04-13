from typing import List, Optional
from sqlmodel import SQLModel, Field, Relationship

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
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
