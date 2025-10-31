from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.responses import JSONResponse
from app.db.db import users_collection, get_database
from app.schemas.schema import RegisterUser, LoginUser
from app.auth_handler import hash_password, create_access_token, verify_password
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register")
async def register_user(user: RegisterUser, db=Depends(get_database)):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        return JSONResponse(
            status_code=200,
            content={"status": False, "message": "Email already registered"}
        )

    hashed_pwd = hash_password(user.password)
    new_user = {
        "name": user.name,
        "email": user.email,
        "password": hashed_pwd,
        "created_at": datetime.utcnow()
    }

    result = await db.users.insert_one(new_user)
    if not result.inserted_id:
        raise HTTPException(status_code=500, detail="Failed to create user account")

    token = create_access_token({"email": user.email})
    return {"status": True, "message": "Registration successful", "token": token}

@router.post("/login")
async def login_user(
    form_data: LoginUser,
    db=Depends(get_database)
):
    db_user = await db.users.find_one({"email": form_data.email})
    if not db_user or not verify_password(form_data.password, db_user["password"]):
        return {"message": "Invalid Credentials", "status": False}

    token_data = {
        "sub": str(db_user["_id"]),
        "email": db_user["email"],
    }

    access_token, expires_in = create_access_token(token_data)

    return {
        "status": True,
        "message": "Login successful",
        "token": access_token,
        "expiresIn": expires_in,  
        "user": {
            "id": str(db_user["_id"]),
            "name": db_user["name"],
            "email": db_user["email"]
        }
    }