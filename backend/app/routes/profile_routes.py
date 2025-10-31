from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.responses import JSONResponse
from app.db.db import users_collection, get_database
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.post("/save-changes")
async def save_changes(request: Request, db=Depends(get_database)):
    data = await request.json()
    user_id = data.get("user_id")
    name = data.get("name")
    email = data.get("email")

    if not user_id or not name or not email:
        raise HTTPException(status_code=400, detail="Missing required fields")

    existing_user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = {
        "name": name,
        "email": email,
        "updated_at": datetime.utcnow()
    }

    result = await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to update user profile")

    return {"status": True, "message": "Profile updated successfully", "user": update_data}

@router.get("/get-profile/{user_id}")
async def get_profile(user_id: str, db=Depends(get_database)):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    interviews_count = await db.interviews.count_documents({"user_id": user_id})

    interview_reports = await db.interview_reports.find({"user_id": user_id}).to_list(length=100)

    interviews = await db.interviews.find({"user_id": user_id}).to_list(length=100)
    for interview in interviews:
        interview["_id"] = str(interview["_id"])
        interview["interview_reports"] = [
            report for report in interview_reports if report["interview_id"] == str(interview["_id"])
        ]

        for report in interview["interview_reports"]:
            report["_id"] = str(report["_id"])


    user_data = {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "interviews_count": interviews_count,
        "interviews": interviews,
        "created_at": user["created_at"],
        "updated_at": user.get("updated_at")
    }

    return {"status": True, "user": user_data}

@router.post("/delete-account")
async def delete_account(request: Request, db=Depends(get_database)):
    try:
        data = await request.json()
        user_id = data.get("user_id")

        if not user_id:
            raise HTTPException(status_code=400, detail="Missing user_id")

        existing_user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not existing_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        interviews = await db.interviews.find({"user_id": user_id}).to_list(length=100)
        interview_ids = [str(interview["_id"]) for interview in interviews]

        await db.users.delete_one({"_id": ObjectId(user_id)})
        await db.interviews.delete_many({"user_id": user_id})
        await db.interview_reports.delete_many({"user_id": user_id})
        await db.detailed_breakdown.delete_many({"user_id": user_id})

        await db.interview_conversations.delete_many({"interview_id": {"$in": interview_ids}})

        return JSONResponse(status_code=status.HTTP_200_OK, content={"status": True, "message": "Account deleted successfully"})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))