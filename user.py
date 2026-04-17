from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)

    total_points = Column(Integer, default=0)

    points_ledger = relationship(
        "PointsLedger",
        back_populates="user",
        cascade="all, delete-orphan"
    )
