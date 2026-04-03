# Taken directly from Breanna's utils.py

from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os

#  Configuration ──────────────────────────────────────────────

SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_change_before_production")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24   # JWT expires after 24 hours 


# Password Hashing ───────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# JWT Tokens ─────────────────────────────────────────────────
def create_access_token(user_id: int, role: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
