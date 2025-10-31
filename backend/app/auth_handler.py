from datetime import datetime, timedelta
from typing import Optional, Tuple
from jose import JWTError, jwt
import os
from pwdlib import PasswordHash


pwd_hash = PasswordHash.recommended()

def hash_password(password: str) -> str:
    return pwd_hash.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_hash.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> Tuple[str, int]:
    to_encode = data.copy()

    expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 10080))
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
        expire_seconds = int(expires_delta.total_seconds())
    else:
        expire = datetime.utcnow() + timedelta(minutes=expire_minutes)
        expire_seconds = expire_minutes * 60 

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        os.getenv("SECRET_KEY"),
        algorithm=os.getenv("ALGORITHM")
    )

    return encoded_jwt, expire_seconds

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, os.getenv("SECRET_KEY"), algorithm=os.getenv("ALGORITHM"))
        return payload
    except JWTError:
        return None