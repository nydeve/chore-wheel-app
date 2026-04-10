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
    invite_code:  str
    password:     str
    display_name: str

    @field_validator("password")
    @classmethod
    def password_length(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

class InviteResponse(BaseModel):
    message:     str
    invite_code: str
    invite_link: str


#HELPER
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
@limiter.limit("5/minute")        #  max 5 registrations/min per IP
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
    return UserResponse.model_validate(current_user)


#profile update
@router.put("/auth/me", response_model=UserResponse)
def update_profile(
    body:         UpdateProfileRequest,
    current_user: User    = Depends(get_current_user),
    session:      Session = Depends(get_session),
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
    current_parent: User    = Depends(require_parent),
    session:        Session = Depends(get_session),
):
    children = session.exec(
        select(User).where(User.parent_id == current_parent.id)
    ).all()
    return [UserResponse.model_validate(c) for c in children]

# ───── Child management -- auth checks ────────────────────────────

@router.get("/users/{user_id}", response_model=UserResponse)
def get_child(
    user_id:        int,
    current_parent: User    = Depends(require_parent),
    session:        Session = Depends(get_session),
):
    child = session.get(User, user_id)
    if child is None:
        raise HTTPException(status_code=404, detail="User not found.")
    if child.parent_id != current_parent.id:           # ← Week 4 auth check
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You can only view profiles in your own family.")
    return UserResponse.model_validate(child)
 
@router.delete("/users/{user_id}")
def delete_child(
    user_id:        int,
    current_parent: User    = Depends(require_parent),
    session:        Session = Depends(get_session),
):
    child = session.get(User, user_id)
    if child is None:
        raise HTTPException(status_code=404, detail="User not found.")
    if child.parent_id != current_parent.id:           # ← Week 4 auth check
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You can only delete accounts in your own family.")
    session.delete(child)
    session.commit()
    return {"message": f"Account for '{child.display_name}' has been deleted."}

# ───── Invite system ────────────────────────────

@router.post("/users/invite", response_model=InviteResponse)
def generate_invite(
    request:        Request,
    current_parent: User    = Depends(require_parent),
    session:        Session = Depends(get_session),
):
    """
    Parent generates a one-time invite code. Calling again replaces the old one.
    Share the invite_link with your child (text it, email it, show it on screen).
    """
    code = secrets.token_urlsafe(16)
    current_parent.invite_code = code
    session.add(current_parent)
    session.commit()
    session.refresh(current_parent)
 
    base_url    = str(request.base_url).rstrip("/")
    invite_link = f"{base_url}/register/child?code={code}"
 
    return InviteResponse(
        message="Invite code generated. Share the link with your child.",
        invite_code=code,
        invite_link=invite_link,
    )

@router.post("/auth/register/child", response_model=TokenResponse, status_code=201)
@limiter.limit("5/minute")        # ← Week 5: also rate-limit child registration
def register_child(
    request:  Request,
    body:     ChildRegisterRequest,
    response: Response,
    session:  Session = Depends(get_session),
):
    """
    Child completes account creation with the invite code (CWR.1.5).
    Code is burned immediately after use so it can't be reused (CWR.1.6).
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
 
    parent.invite_code = None   # burn the code
    session.add(parent)
 
    session.commit()
    session.refresh(child)
 
    _issue_cookie(response, child)
    return TokenResponse(
        message=f"Welcome, {child.display_name}! Your account is ready.",
        user=UserResponse.model_validate(child),
    )