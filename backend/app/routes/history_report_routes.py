from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse, FileResponse
from app.db.db import users_collection, get_database
from datetime import datetime, timedelta
from bson import ObjectId
from typing_extensions import List, Dict, Any
import json
import os

router = APIRouter(prefix="/history-report", tags=["Interview History & Reports"])

def _is_valid_objectid(oid: str) -> bool:
    try:
        ObjectId(oid)
        return True
    except Exception:
        return False

@router.get("/{user_id}/interview-history")
async def get_interview_history(user_id: str, db=Depends(get_database)):
    try:
        if not _is_valid_objectid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user_id format")

        user_obj_id = ObjectId(user_id)
        user = await db["users"].find_one({"_id": user_obj_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        pipeline = [
            {
                "$match": {
                    "$or": [
                        {"user_id": user_obj_id},  
                        {"user_id": user_id}     
                    ]
                }
            },
            {"$addFields": {"_id_str": {"$toString": "$_id"}}},

            {
                "$lookup": {
                    "from": "interview_reports",
                    "let": {"iid_str": "$_id_str", "iid_obj": "$_id"},
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$or": [
                                        {"$eq": ["$interview_id", "$$iid_str"]},
                                        {"$eq": ["$interview_id", "$$iid_obj"]}
                                    ]
                                }
                            }
                        },
                        {"$limit": 1}
                    ],
                    "as": "interview_report"
                }
            },

            {
                "$lookup": {
                    "from": "detailed_breakdown",
                    "let": {"iid_str": "$_id_str", "iid_obj": "$_id"},
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$or": [
                                        {"$eq": ["$interview_id", "$$iid_str"]},
                                        {"$eq": ["$interview_id", "$$iid_obj"]}
                                    ]
                                }
                            }
                        },
                        {"$limit": 1}
                    ],
                    "as": "detailed_breakdown"
                }
            },

            {
                "$project": {
                    "_id": 1,
                    "domain": 1,
                    "completion": 1,
                    "interview_type": 1,
                    "interview_timer": 1,
                    "question_count": 1,
                    "created_at": 1,
                    "interview_report": {"$arrayElemAt": ["$interview_report", 0]},
                    "detailed_breakdown": {"$arrayElemAt": ["$detailed_breakdown", 0]},
                }
            }
        ]

        interviews = await db["interviews"].aggregate(pipeline).to_list(length=500)

        interview_history = []
        for doc in interviews:
            interview_report = doc.get("interview_report") or {}
            detailed_breakdown = doc.get("detailed_breakdown") or {}

            if isinstance(interview_report, dict) and "_id" in interview_report:
                interview_report["_id"] = str(interview_report["_id"])
            if isinstance(detailed_breakdown, dict) and "_id" in detailed_breakdown:
                detailed_breakdown["_id"] = str(detailed_breakdown["_id"])

            def try_parse_json(value):
                if isinstance(value, str):
                    try:
                        parsed = json.loads(value)
                        return parsed
                    except (json.JSONDecodeError, TypeError):
                        return value
                return value

            if isinstance(interview_report, dict) and "report" in interview_report:
                interview_report["report"] = try_parse_json(interview_report["report"])

            if isinstance(detailed_breakdown, dict) and "detailed_breakdown" in detailed_breakdown:
                detailed_breakdown["detailed_breakdown"] = try_parse_json(detailed_breakdown["detailed_breakdown"])

            interview_data = {
                "interview_id": str(doc["_id"]),
                "domain": doc.get("domain"),
                "interview_type": doc.get("interview_type"),
                "duration": doc.get("interview_timer"),
                "question_count": doc.get("question_count"),
                "completion": doc.get("completion"),
                "created_at": doc.get("created_at"),
                "interview_report": interview_report or None,
                "detailed_breakdown": detailed_breakdown or None,
            }
            interview_history.append(interview_data)

        return {
            "data": {
                "userData": {
                    "_id": str(user["_id"]),
                    "name": user.get("name"),
                    "email": user.get("email"),
                    "total_interviews": len(interview_history),
                },
                "interviews": interview_history,
            },
            "status": True
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error occurred: {str(e)}")
    