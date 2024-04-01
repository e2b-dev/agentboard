import logging
from typing import Annotated, Optional

from fastapi import Header, HTTPException

from src.settings import supabase

logger = logging.getLogger(__name__)


async def user_id_for_token(token: str) -> Optional[str]:
    """
    Authenticate the token with Supabase and return the user ID if valid.
    """
    # Remove 'Bearer ' prefix if present
    prefix = "Bearer "
    if token.startswith(prefix):
        token = token[len(prefix) :]

    # Verify the token with Supabase
    try:
        data = supabase.auth.get_user(token)
        if data:
            return data.user.id
    except Exception as e:
        logger.error(f"Supabase error when exchanging token for user id: {e}")
        return None


async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        logger.error("No authorization header")
        raise HTTPException(status_code=401, detail="No authorization header")

    # Exchange token for user ID
    user_id = await user_id_for_token(authorization)
    if not user_id:
        logger.error("Invalid token")
        raise HTTPException(status_code=401, detail="Invalid token")
    return user_id
