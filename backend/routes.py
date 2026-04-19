# danila
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
@router.post("/auth/register", response_model=TokenResponse, status_code=201)
@limiter.limit("1000/minute")
def register(
    request: Request,         # ← required by slowapi, must be first
    body: RegisterRequest,
    response: Response,
    session: Session = Depends(get_session)
):
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
@router.post("/auth/login", response_model=TokenResponse)
@limiter.limit("1000/minute")
def login(
    request: Request,
    body: LoginRequest,
    response: Response,
    session: Session = Depends(get_session)
):
    user = session.exec(select(User).where(User.email == body.email)).first()

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
@router.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logged out successfully."}

# ── GET /auth/me ───────────────────────────────────────────────
@router.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.put("/auth/me", response_model=UserResponse)
def update_profile(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if body.display_name:
        current_user.display_name = body.display_name
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return UserResponse.model_validate(current_user)


# ───── Parent View Children -- Role handaling ───────────────────

@router.get("/users", response_model=list[UserResponse])
def list_children(
    current_parent: User = Depends(require_parent),
    session: Session = Depends(get_session),
):
    children = session.exec(
        select(User).where(User.parent_id == current_parent.id)
    ).all()
    return [UserResponse.model_validate(c) for c in children]

# ───── Child management -- auth checks ────────────────────────────

@router.get("/users/{user_id}", response_model=UserResponse)
def get_child(
    user_id: int,
    current_parent: User = Depends(require_parent),
    session: Session = Depends(get_session),
):
    child = session.get(User, user_id)
    if child is None:
        raise HTTPException(status_code=404, detail="User not found.")
    if child.parent_id != current_parent.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You can only view profiles in your own family.")
    return UserResponse.model_validate(child)


@router.delete("/users/{user_id}")
def delete_child(
    user_id: int,
    current_parent: User = Depends(require_parent),
    session: Session = Depends(get_session),
):
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

@router.post("/users/invite", response_model=InviteResponse)
def generate_invite(
    request: Request,
    current_parent: User = Depends(require_parent),
    session: Session = Depends(get_session),
):
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


@router.post("/auth/register/child", response_model=TokenResponse, status_code=201)
@limiter.limit("1000/minute")
def register_child(
    request: Request,
    body: ChildRegisterRequest,
    response: Response,
    session: Session = Depends(get_session),
):
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
