# Taken directly from Breanna's routes.py
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlmodel import Session, select
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime

from database import get_session
from models import User, UserRole
from utils import hash_password, verify_password, create_access_token
from roles import get_current_user, require_parent, require_child
from rate_limit import limiter

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
    total_points: int

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    message: str
    user: UserResponse


class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None

    @field_validator("display_name")
    @classmethod
    def name_not_empty(cls, v):
        if v is not None and not v.strip():
            raise ValueError("Display name cannot be empty")
        return v.strip() if v else v


class ChildRegisterRequest(BaseModel):
    invite_code: str
    password: str
    display_name: str

    @field_validator("password")
    @classmethod
    def password_length(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class InviteResponse(BaseModel):
    message: str
    invite_code: str
    invite_link: str



def _issue_cookie(response: Response, user: User) -> None:
    token = create_access_token(user_id=user.id, role=user.role.value)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=60 * 60 * 24
    )


# ── POST /auth/register ────────────────────────────────────────
@router.post("/auth/register", response_model=TokenResponse, status_code=201, tags=["Authentication"], summary="Register a new Parent account")
@limiter.limit("5/minute")
def register(
    request: Request,         # ← required by slowapi, must be first
    body: RegisterRequest,
    response: Response,
    session: Session = Depends(get_session)
):
    """
    Registers a new parent user with an email, password, and display name.
    
    Hash the password using Bcrypt and create an HTTP-only cookie containing the JWT.
    Returns the newly created user profile and a success message.
    """
    existing = session.exec(select(User).where(User.email == body.email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        display_name=body.display_name,
        role=UserRole.PARENT
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    _issue_cookie(response, user)
    return TokenResponse(
        message="Account created! Welcome to Chore Wheel.",
        user=UserResponse.model_validate(user)
    )

# ── POST /auth/login ───────────────────────────────────────────
@router.post("/auth/login", response_model=TokenResponse, tags=["Authentication"], summary="Login a user")
@limiter.limit("5/minute")
def login(
    request: Request,
    body: LoginRequest,
    response: Response,
    session: Session = Depends(get_session)
):
    """
    Authenticates a user by email and password.
    
    If successful, sets an HTTP-only JWT cookie to maintain an active session.
    Works for both Parent and Child accounts.
    """
    user = session.exec(select(User).where(User.email == body.email)).first()
    
    # Fallback to allow children to login via their display name directly
    if not user:
        user = session.exec(select(User).where(User.display_name == body.email)).first()

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

    _issue_cookie(response, user)
    return TokenResponse(
        message=f"Welcome back, {user.display_name}!",
        user=UserResponse.model_validate(user)
    )

# ── POST /auth/logout ──────────────────────────────────────────
@router.post("/auth/logout", tags=["Authentication"], summary="Logout the current user")
def logout(response: Response):
    """
    Logs out the current active user by deleting the HTTP-only access_token cookie.
    """
    response.delete_cookie("access_token")
    return {"message": "Logged out successfully."}

# ── GET /auth/me ───────────────────────────────────────────────
@router.get("/auth/me", response_model=UserResponse, tags=["Authentication"], summary="Get current user profile")
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns the data of the currently authenticated user based on their JWT token.
    """
    return UserResponse.model_validate(current_user)


@router.put("/auth/me", response_model=UserResponse, tags=["Authentication"], summary="Update user profile")
def update_profile(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Update profile configurations. 
    Currently supports updating the display_name.
    """
    if body.display_name:
        current_user.display_name = body.display_name
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return UserResponse.model_validate(current_user)


# ───── Parent View Children -- Role handaling ───────────────────

@router.get("/users", response_model=list[UserResponse], tags=["Users"], summary="List linked children")
def list_children(
    current_parent: User = Depends(require_parent),
    session: Session = Depends(get_session),
):
    """
    Retrieves all Child accounts that are linked to the currently authenticated Parent account.
    """
    children = session.exec(
        select(User).where(User.parent_id == current_parent.id)
    ).all()
    return [UserResponse.model_validate(c) for c in children]

# ───── Child management -- auth checks ────────────────────────────

@router.get("/users/{user_id}", response_model=UserResponse, tags=["Users"], summary="Get specific child profile")
def get_child(
    user_id: int,
    current_parent: User = Depends(require_parent),
    session: Session = Depends(get_session),
):
    """
    Retrieves the details of a specific child using their integer user ID.
    Enforces a strict authorization check to ensure the child actually belongs to the requesting parent.
    """
    child = session.get(User, user_id)
    if child is None:
        raise HTTPException(status_code=404, detail="User not found.")
    if child.parent_id != current_parent.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You can only view profiles in your own family.")
    return UserResponse.model_validate(child)


@router.delete("/users/{user_id}", tags=["Users"], summary="Delete a child account")
def delete_child(
    user_id: int,
    current_parent: User = Depends(require_parent),
    session: Session = Depends(get_session),
):
    """
    Permanently deletes a specific child account.
    Fails if the child does not belong to the requesting parent.
    """
    child = session.get(User, user_id)
    if child is None:
        raise HTTPException(status_code=404, detail="User not found.")
    if child.parent_id != current_parent.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You can only delete accounts in your own family.")
    session.delete(child)
    session.commit()
    return {"message": f"Account for '{child.display_name}' has been deleted."}


# ───── Invite system ────────────────────────

@router.post("/users/invite", response_model=InviteResponse, tags=["Users"], summary="Generate Child Invite Link")
def generate_invite(
    request: Request,
    current_parent: User = Depends(require_parent),
    session: Session = Depends(get_session),
):
    """
    Generates a secure, 16-byte cryptographically safe URL invite token.
    Saves it to the parent's profile and returns a ready-to-use registration link.
    """
    code = secrets.token_urlsafe(16)
    current_parent.invite_code = code
    session.add(current_parent)
    session.commit()
    session.refresh(current_parent)

    origin = request.headers.get("origin")
    base_url = origin.rstrip("/") if origin else "http://localhost:3000"
    invite_link = f"{base_url}/auth/register/child?code={code}"

    return InviteResponse(
        message="Invite code generated. Share the link with your child.",
        invite_code=code,
        invite_link=invite_link,
    )


@router.post("/auth/register/child", response_model=TokenResponse, status_code=201, tags=["Authentication"], summary="Register a new Child account via Invite Code")
@limiter.limit("5/minute")
def register_child(
    request: Request,
    body: ChildRegisterRequest,
    response: Response,
    session: Session = Depends(get_session),
):
    """
    Registers a new child user using an invite code generated by a Parent.
    
    Verifies the parent code, assigns the child to the parent, creates a secure account,
    and returns a JWT token for the session. Burns the invite code upon completion.
    """
    parent = session.exec(
        select(User).where(User.invite_code == body.invite_code)
    ).first()

    if parent is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired invite code.",
        )

    child = User(
        email=f"child_{secrets.token_hex(4)}@local",
        hashed_password=hash_password(body.password),
        display_name=body.display_name,
        role=UserRole.CHILD,
        parent_id=parent.id,
    )
    session.add(child)

    parent.invite_code = None  # burn the code 
    session.add(parent)

    session.commit()
    session.refresh(child)

    _issue_cookie(response, child)
    return TokenResponse(
        message=f"Welcome, {child.display_name}! Your account is ready.",
        user=UserResponse.model_validate(child),
    )

# ───── Password Recovery ──────────────────────────────────────

import os
import smtplib
from email.message import EmailMessage
from datetime import datetime, timedelta

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_length(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

@router.post("/auth/forgot-password", tags=["Authentication"], summary="Request Password Reset")
@limiter.limit("3/minute")
def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    session: Session = Depends(get_session)
):
    """
    Generates a secure password reset token and sends a magic link via SMTP.
    Has a safe fallback to terminal print if SMTP fails or is not correctly configured.
    """
    user = session.exec(select(User).where(User.email == body.email)).first()
    if not user:
        # Prevent email enumeration by returning success anyway
        return {"message": "If an account with that email exists, a reset link has been sent."}

    # Generate token
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    session.add(user)
    session.commit()

    # Dispatch Email
    origin = request.headers.get("origin")
    base_url = origin.rstrip("/") if origin else "http://localhost:3000"
    reset_link = f"{base_url}/auth/reset-password?token={token}"

    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = os.environ.get("SMTP_PORT", "587")
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASSWORD")
    smtp_from = os.environ.get("SMTP_FROM_EMAIL", "noreply@chorewheel.local")

    msg = EmailMessage()
    msg["Subject"] = "Chore Wheel - Password Reset Request"
    msg["From"] = smtp_from
    msg["To"] = user.email
    msg.set_content(f"Hello {user.display_name},\n\nYou requested a password reset. Please click the link below to securely reset your password. It expires in 1 hour.\n\n{reset_link}\n\nIf you did not request this, please ignore this email.")

    if smtp_host and smtp_user and smtp_pass:
        try:
            with smtplib.SMTP(smtp_host, int(smtp_port)) as s:
                s.starttls()
                s.login(smtp_user, smtp_pass)
                s.send_message(msg)
            print(f"✅ SMTP: Successfully sent password reset email to {user.email}")
        except Exception as e:
            print(f"❌ SMTP connection failed. Fallback payload:")
            print(f"--- EMAIL TO: {user.email} ---\n{reset_link}\n-----------------------------")
    else:
         print(f"⚠️ SMTP credentials missing. Dev Fallback payload:")
         print(f"--- EMAIL TO: {user.email} ---\n{reset_link}\n-----------------------------")

    return {"message": "If an account with that email exists, a reset link has been sent."}


@router.post("/auth/reset-password", tags=["Authentication"], summary="Reset Password with Token")
@limiter.limit("3/minute")
def reset_password(
    request: Request,
    body: ResetPasswordRequest,
    session: Session = Depends(get_session)
):
    """
    Verifies a password reset token and saves the new Bcrypt-hashed password.
    Burns the token immediately to prevent replay attacks.
    """
    user = session.exec(select(User).where(User.reset_token == body.token)).first()
    
    if not user or not user.reset_token_expires or datetime.utcnow() > user.reset_token_expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token."
        )

    # Hash new password
    user.hashed_password = hash_password(body.new_password)
    
    # Burn token
    user.reset_token = None
    user.reset_token_expires = None
    
    session.add(user)
    session.commit()

    return {"message": "Your password has been successfully reset! You may now log in."}