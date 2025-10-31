from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.responses import JSONResponse
from app.db.db import users_collection, get_database
from datetime import datetime
from bson import ObjectId
import json

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def clean_mongo_doc(doc):
    """Recursively convert ObjectIds and datetimes to JSON-safe values."""
    if isinstance(doc, list):
        return [clean_mongo_doc(item) for item in doc]
    elif isinstance(doc, dict):
        cleaned = {}
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                cleaned[k] = str(v)
            elif isinstance(v, datetime):
                cleaned[k] = v.isoformat()  
            elif isinstance(v, (dict, list)):
                cleaned[k] = clean_mongo_doc(v)
            else:
                cleaned[k] = v
        return cleaned
    else:
        return doc


@router.get("/stats/{user_id}")
async def get_dashboard_stats(user_id: str, db=Depends(get_database)):
    try:
        if not user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User ID is required")

        interviews = await db["interviews"].find({"user_id": user_id}).to_list(length=None)
        interview_reports = await db["interview_reports"].find({"user_id": user_id}).to_list(length=None)
        interview_breakdowns = await db["detailed_breakdown"].find({"user_id": user_id}).to_list(length=None)

        total_interviews = len(interviews)

        interviews = clean_mongo_doc(interviews)
        interview_reports = clean_mongo_doc(interview_reports)
        interview_breakdowns = clean_mongo_doc(interview_breakdowns)

        for interview in interviews:
            interview_id = interview["_id"]

            matched_reports = [report for report in interview_reports if report.get("interview_id") == interview_id]
            interview["interview_reports"] = matched_reports[0] if matched_reports else None

            matched_breakdowns = [b for b in interview_breakdowns if b.get("interview_id") == interview_id]
            interview["breakdowns"] = matched_breakdowns[0] if matched_breakdowns else None


        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "total_interviews": total_interviews,
                "interviews": interviews,
                "status": True,
            },
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard stats: {str(e)}")
    
@router.get("/performance-snapshot/{user_id}")
async def get_performance_snapshot(user_id: str, db=Depends(get_database)):
    try:
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID is required"
            )

        interviews = await db["interviews"].find({"user_id": user_id}).to_list(length=None)
        if not interviews:
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={"message": "No interviews found", "status": True}
            )

        reports = await db["interview_reports"].find({"user_id": user_id}).to_list(length=None)
        if not reports:
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={"message": "No interview reports found", "status": True}
            )

        highest_overall_score = -1
        highest_clarity_score = -1
        overall_scores = []  
        top_report_overall = None
        top_interview = None

        interview_map = {str(i["_id"]): i for i in interviews}

        for report in reports:
            try:
                parsed_report = json.loads(report.get("report", "{}"))
                overall_score = parsed_report.get("overallScore")
                clarity_score = parsed_report.get("clarityScore")

                if isinstance(overall_score, (int, float)):
                    overall_scores.append(overall_score)

                    if overall_score > highest_overall_score:
                        highest_overall_score = overall_score
                        top_report_overall = parsed_report
                        top_interview = interview_map.get(report.get("interview_id"))

                if isinstance(clarity_score, (int, float)) and clarity_score > highest_clarity_score:
                    highest_clarity_score = clarity_score

            except json.JSONDecodeError:
                continue  

        average_overall_score = (
            round(sum(overall_scores) / len(overall_scores), 2) if overall_scores else None
        )

        if not overall_scores and highest_clarity_score == -1:
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={"message": "No valid reports found", "status": True}
            )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": True,
                "highest_overall_score": highest_overall_score if highest_overall_score != -1 else None,
                "interview_type": top_interview.get("interview_type") if top_interview else None,
                "interview_id_of_highest_overall": str(top_interview["_id"]) if top_interview else None,
                "average_overall_score": average_overall_score,
                "highest_clarity_score": highest_clarity_score if highest_clarity_score != -1 else None,
            },
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch performance snapshot: {str(e)}"
        )
    

@router.get("/overall-scores/{user_id}")
async def get_all_overall_scores(user_id: str, db=Depends(get_database)):
    try:
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID is required"
            )

        reports = await db["interview_reports"].find({"user_id": user_id}).to_list(length=None)
        if not reports:
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={"status": True, "data": []}
            )

        overall_scores = []

        for report in reports:
            try:
                parsed_report = json.loads(report.get("report", "{}"))
                overall_score = parsed_report.get("overallScore")
                if isinstance(overall_score, (int, float)):
                    overall_scores.append(overall_score)
            except json.JSONDecodeError:
                continue 

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"status": True, "data": overall_scores}
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch overall scores: {str(e)}"
        )