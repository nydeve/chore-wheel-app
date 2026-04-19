#danila
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os

#  Configuration ──────────────────────────────────────────────

SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_change_before_production")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24   # JWT expires after 24 hours 


# Password Hashing ───────────────────────────────────────────

def hash_password(plain: str) -> str:
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(plain.encode('utf-8'), salt)
    return hashed_bytes.decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))


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
