from fastapi import Depends, HTTPException, status, Request
from sqlmodel import Session
from database import get_session
from models import User, UserRole
from utils import decode_access_token


def get_current_user(
    request: Request,
    session: Session = Depends(get_session)
) -> User:

    #  read the cookie
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not logged in. Please log in to continue."
        )

    # decode the token
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again."
        )

    # look up the user
    user_id = payload.get("sub")
    user = session.get(User, int(user_id))

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or deactivated."
        )

    return user


def require_parent(current_user: User = Depends(get_current_user)) -> User:
 
    if current_user.role != UserRole.PARENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. This action requires a parent account."
        )
    return current_user


def require_child(current_user: User = Depends(get_current_user)) -> User:

    if current_user.role != UserRole.CHILD:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. This action is for child accounts only."
        )
    return current_user
