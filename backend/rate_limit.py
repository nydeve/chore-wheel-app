#breanna/danila

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse
 
''' In main you might want to add: 

from rate_limit import limiter, rate_limit_handler
from slowapi.errors import RateLimitExceeded
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
app.include_router(router)

also make sure to pip install slow api

'''

# Uses the client's IP address as the key for rate limiting
limiter = Limiter(key_func=get_remote_address)
 
 
def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """
    Custom error response when a client hits the rate limit.
    Returns 429 Too Many Requests instead of the default slowapi message.
    """
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Too many attempts. Please wait a minute and try again."
        },
    )
 
