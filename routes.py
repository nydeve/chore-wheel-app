from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlmodel import Session, select
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime

from database import get_session
from auth.models import User, UserRole
from auth.utils import hash_password, verify_password, create_access_token
from auth.dependencies import get_current_user


router = APIRouter()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str

    @field_validator("password")
    @classmethod
    def password_length(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("display_name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Display name cannot be empty")
        return v.strip()


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    display_name: str
    role: UserRole
    parent_id: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    message: str
    user: UserResponse


# ── POST /auth/register ────────────────────────────────────────
@router.post("/auth/register", response_model=TokenResponse, status_code=201)
def register(
    body: RegisterRequest,
    response: Response,
    session: Session = Depends(get_session)
):

    # check for duplicate email
    existing = session.exec(select(User).where(User.email == body.email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )

    #  hash the password
    hashed = hash_password(body.password)

    # create and save the user
    user = User(
        email=body.email,
        hashed_password=hashed,
        display_name=body.display_name,
        role=UserRole.PARENT  #Self-registered users are parents
    )
    session.add(user)
    session.commit()
    session.refresh(user)  # Loads the auto-assigned ID back into the object

    # Step 4 — issue JWT cookie
    token = create_access_token(user_id=user.id, role=user.role.value)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,       # JavaScript cannot read this cookie (blocks XSS)
        samesite="lax",      # Protects against CSRF
        secure=False,        # Set True in production (needs HTTPS)
        max_age=60 * 60 * 24 # 24 hours in seconds
    )

    return TokenResponse(
        message="Account created! Welcome to Chore Wheel.",
        user=UserResponse.model_validate(user)
    )


# ── POST /auth/login ───────────────────────────────────────────
@router.post("/auth/login", response_model=TokenResponse)
def login(
    body: LoginRequest,
    response: Response,
    session: Session = Depends(get_session)
):
    """
    Logs in a user and issues a JWT cookie.

    Security note: We return the same error whether the email
    doesn't exist OR the password is wrong. This stops attackers
    from figuring out which emails are registered in our system.
    """

    # Find user by email
    user = session.exec(select(User).where(User.email == body.email)).first()

    # Verify password — same error message either way (security best practice)
    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account has been deactivated."
        )

    # Issue new JWT cookie
    token = create_access_token(user_id=user.id, role=user.role.value)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=60 * 60 * 24
    )

    return TokenResponse(
        message=f"Welcome back, {user.display_name}!",
        user=UserResponse.model_validate(user)
    )


# ── POST /auth/logout ──────────────────────────────────────────
@router.post("/auth/logout")
def logout(response: Response):
    """
    Logs the user out by deleting their JWT cookie.
    The token itself expires naturally after 24 hours even without this.
    """
    response.delete_cookie("access_token")
    return {"message": "Logged out successfully."}


# ── GET /auth/me ───────────────────────────────────────────────
@router.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns the currently logged-in user's info.

    If not logged in, returns 401 automatically (handled by get_current_user).
    """
    return UserResponse.model_validate(current_user)
