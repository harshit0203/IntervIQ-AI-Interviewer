from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse, FileResponse
from app.db.db import users_collection, get_database
from datetime import datetime, timedelta
from app.langgraph_agents.interview_report import generate_interview_report
from app.langgraph_agents.detailed_breakdown import generate_detailed_breakdown
from app.langgraph_agents.full_report import get_full_report
from bson import ObjectId
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch
from reportlab.lib import colors
import json
import os
from app.schemas.schema import GenerateReportSchema

router = APIRouter(prefix="/interview-report", tags=["Interview Report"])

@router.post("/generate-report/{interview_id}")
async def generate_report(interview_id: str, request: GenerateReportSchema, db=Depends(get_database)):
    try:
        interview = await db.interviews.find_one({"_id": ObjectId(interview_id)}, {"_id": 0, "interview_timer": 1, "completion": 1, "user_id": 1, "domain": 1, "experience": 1, "interview_type": 1, "difficulty":1})
        interview_report = await db.interview_reports.find_one({"interview_id": interview_id}, {"_id": 0, "report": 1, "user_id": 1})

        if interview_report and not request.time and interview.get("completion") == "completed":
            return JSONResponse(status_code=200, content={"message": "Interview report fetched successfully.", "status": True, "report": interview_report['report']})
        
        if interview_report and (interview.get("completion") == "completed" or (interview.get("completion") == "incomplete")) and (int(request.time) == interview.get("interview_timer", 0)):
            return JSONResponse(status_code=200, content={"message": "Interview report fetched successfully.", "status": True, "report": interview_report['report']})
        
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found.")
        
        interview_conversation = await db.interview_conversations.find(
            {"interview_id": interview_id, "is_first_message": False},
            {"_id": 0, "sender": 1, "text": 1}
        ).sort("created_at", 1).to_list(length=None)

        interview_conversation = interview_conversation[1:]

        question_answer_arr = [
            {"question": interview_conversation[i]["text"], "answer": interview_conversation[i + 1]["text"]}
            for i in range(0, len(interview_conversation) - 1, 2)
            if interview_conversation[i]["sender"] == "ai" and interview_conversation[i + 1]["sender"] == "user"
        ]

        report = await generate_interview_report(interview, question_answer_arr)

        if report:
            await db.interview_reports.insert_one({
                "user_id": interview.get("user_id"),
                "interview_id": interview_id,
                "report": report,
                "created_at": datetime.utcnow()
            })

        return JSONResponse(status_code=200, content={"message": "Interview report generated successfully.", "status": True, "report": report})

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error occurred: {str(e)}")
    

@router.get("/download-report/{interview_id}")
async def download_report(interview_id: str, db=Depends(get_database)):
    try:
        interview_report = await db.interview_reports.find_one(
            {"interview_id": interview_id},
            {"_id": 0, "report": 1}
        )

        if not interview_report:
            raise HTTPException(status_code=404, detail="Interview report not found.")

        report_generated_summary = await get_full_report(interview_report["report"])

        pdf_path = generate_pdf(report_generated_summary, interview_id)

        filename = f"Interview_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=filename
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error occurred: {str(e)}")
    
@router.post("/detailed-breakdown/{interview_id}")
async def detailed_breakdown(interview_id: str, request: GenerateReportSchema, db=Depends(get_database)):
    try:
        if not interview_id:
            raise HTTPException(status_code=400, detail="Interview ID is required.")
        interview = await db.interviews.find_one({"_id": ObjectId(interview_id)}, {"_id": 0, "interview_timer": 1, "completion": 1, "user_id": 1, "domain": 1, "experience": 1, "interview_type": 1, "difficulty":1})
        
        detailed_breakdown_record = await db.detailed_breakdown.find_one({"interview_id": interview_id}, {"_id": 0, "detailed_breakdown": 1, "duration": 1})

        if detailed_breakdown_record and (interview.get("completion") == "completed" or interview.get("completion") == "incomplete") and (interview.get("interview_timer", 0) == detailed_breakdown_record.get("duration", 0)):
            return JSONResponse(status_code=200, content={"message": "Interview detailed breakdown fetched successfully.", "status": True, "interview_duration": detailed_breakdown_record["duration"], "detailed_breakdown": detailed_breakdown_record['detailed_breakdown']})
        
        interview = await db.interviews.find_one({"_id": ObjectId(interview_id)}, {"_id": 0, "user_id": 1, "interview_timer": 1, "domain": 1, "experience": 1, "interview_type": 1, "difficulty":1})
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found.")

        interview_report = await db.interview_reports.find_one({"interview_id": interview_id}, {"_id": 0, "report": 1, "user_id": 1})

        interview_conversation = await db.interview_conversations.find(
            {"interview_id": interview_id, "is_first_message": False},
            {"_id": 0, "sender": 1, "text": 1}
        ).sort("created_at", 1).to_list(length=None)

        interview_conversation = interview_conversation[1:]

        question_answer_arr = [
            {"question": interview_conversation[i]["text"], "answer": interview_conversation[i + 1]["text"]}
            for i in range(0, len(interview_conversation) - 1, 2)
            if interview_conversation[i]["sender"] == "ai" and interview_conversation[i + 1]["sender"] == "user"
        ]

        detailed_breakdown = await generate_detailed_breakdown(interview, interview_report["report"], question_answer_arr)
        if detailed_breakdown:
            await db.detailed_breakdown.insert_one({
                "user_id": interview.get("user_id"),
                "interview_id": interview_id,
                "duration": interview.get("interview_timer", 0),
                "detailed_breakdown": detailed_breakdown,
                "created_at": datetime.utcnow()
            })

        return JSONResponse(status_code=200, content={"message": "Interview detailed breakdown generated successfully.", "status": True, "interview_duration": interview.get("interview_timer", 0), "detailed_breakdown": detailed_breakdown})

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error occurred: {str(e)}")

    
def _report_to_text(report):
    """
    Accepts either a dict (parsed JSON) or a plain string and returns a formatted text string
    with section headings that the PDF generator can consume.
    """
    if isinstance(report, str):
        return report

    if isinstance(report, dict):
        parts = []

        meta = report.get("metadata") or {}
        title = meta.get("role") or "Interview Report"
        parts.append("Interview Overview")
        summary = report.get("summary") or report.get("overview") or ""
        parts.append(summary)

        parts.append("\nDetailed Scores")
        clarity = report.get("clarityScore")
        pacing = report.get("pacingScore")
        overall = report.get("overallScore")
        parts.append(f"Overall Score: {overall if overall is not None else 'N/A'}")
        parts.append(f"Clarity Score: {clarity if clarity is not None else 'N/A'}")
        parts.append(f"Pacing Score: {pacing if pacing is not None else 'N/A'}")

        strengths = report.get("strengths") or []
        if strengths:
            parts.append("\nStrengths")
            for s in strengths:
                parts.append(f"• {s}")

        areas = report.get("areasForImprovement") or []
        if areas:
            parts.append("\nAreas for Improvement")
            for a in areas:
                parts.append(f"• {a}")

        ai = report.get("aiLikelihood")
        if ai:
            parts.append("\nAI Likelihood")
            score = ai.get("score")
            desc = ai.get("description")
            parts.append(f"Likelihood Score: {score if score is not None else 'N/A'}")
            if desc:
                parts.append(desc)

        resources = report.get("suggestedResources") or []
        if resources:
            parts.append("\nSuggested Resources")
            for r in resources:
                title = r.get("title", "Resource")
                url = r.get("url")
                parts.append(f"• {title}" + (f" — {url}" if url else ""))

        return "\n\n".join(parts)

    return str(report)

def generate_pdf(report_obj, interview_id: str) -> str:
    """
    Generate a readable PDF report from a report object (dict or string).
    Returns the absolute path to the generated PDF.
    """
    try:
        output_dir = os.path.join(os.getcwd(), "generated_reports")
        os.makedirs(output_dir, exist_ok=True)
        pdf_path = os.path.join(output_dir, f"interview_report_{interview_id}.pdf")

        report_text = _report_to_text(report_obj)

        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=A4,
            rightMargin=50,
            leftMargin=50,
            topMargin=60,
            bottomMargin=60,
        )

        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(
            name="ReportTitle",
            fontSize=18,
            leading=22,
            spaceAfter=12,
            alignment=1,
            textColor=colors.HexColor("#0f5132")
        ))
        styles.add(ParagraphStyle(
            name="SectionHeading",
            fontSize=14,
            leading=18,
            spaceBefore=12,
            spaceAfter=6,
            textColor=colors.HexColor("#0b5cff"),
        ))
        styles.add(ParagraphStyle(
            name="Body",
            fontSize=11,
            leading=16,
            spaceAfter=8,
        ))
        styles.add(ParagraphStyle(
            name="Bulleted",
            fontSize=11,
            leading=14,
            leftIndent=12,
            spaceBefore=2,
            spaceAfter=6,
        ))

        elements = []

        elements.append(Paragraph("Interview Performance Report", styles["ReportTitle"]))
        elements.append(Spacer(1, 8))

        for block in report_text.split("\n\n"):
            block = block.strip()
            if not block:
                continue

            if len(block.splitlines()) == 1 and len(block) < 60 and block.isalpha() or block.istitle():
                elements.append(Paragraph(block, styles["SectionHeading"]))
            else:
                if block.startswith("•") or block.startswith("- "):
                    for line in block.splitlines():
                        elements.append(Paragraph(line.strip(), styles["Bulleted"]))
                else:
                    elements.append(Paragraph(block.replace("\n", "<br/>"), styles["Body"]))

            elements.append(Spacer(1, 6))

        doc.build(elements)
        return pdf_path

    except Exception as e:
        raise RuntimeError(f"generate_pdf failed: {str(e)}")




