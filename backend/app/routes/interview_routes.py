from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse
from app.db.db import users_collection, get_database
from app.schemas.schema import SetupInterviewSchema, ReceiveFirstAITextSchema, EmployeeInterviewAnswers, AIRequestSchema, LogInterviewTimerSchema
from datetime import datetime
from app.langgraph_agents.first_ai_text import generate_first_text
from app.langgraph_agents.create_questions import generate_ai_response
from app.langgraph_agents.last_ai_text import interview_finished_message
from google import generativeai as genai
from bson import ObjectId
import uuid
import os
import base64
import wave
import io
import tempfile


router = APIRouter(prefix="/interview", tags=["Interview"])
API_KEY = os.getenv("API_KEY")
genai.configure(api_key=API_KEY)

def serialize_mongo_doc(doc):
    if not doc:
        return None

    for key, value in doc.items():
        if isinstance(value, ObjectId):
            doc[key] = str(value)
        elif isinstance(value, datetime):
            doc[key] = value.isoformat()
    return doc


async def generate_speech(text: str):
    if not text:
        raise HTTPException(status_code=400, detail="Text is required.")

    model = genai.GenerativeModel("gemini-2.5-flash-preview-tts")

    prompt = f"""You are conducting a professional job interview. 
        Speak in a warm, friendly, and encouraging tone. 
        Maintain a calm, conversational pace with clear pronunciation. 
        Show genuine interest and create a comfortable atmosphere for the candidate.

        Interview question: {text}"""


    response = model.generate_content(
        prompt,
        generation_config={
            "response_modalities": ["AUDIO"],
            "speech_config": {"voice_config": {"prebuilt_voice_config": {"voice_name": "Gacrux"}}},
        },
    )

    pcm_data = (
        response.candidates[0].content.parts[0].inline_data.data
        if response.candidates and response.candidates[0].content.parts
        else None
    )

    if not pcm_data:
        raise HTTPException(status_code=500, detail="Failed to generate audio.")

    wav_buffer = io.BytesIO()
    with wave.open(wav_buffer, 'wb') as wav_file:
        wav_file.setnchannels(1)  
        wav_file.setsampwidth(2)  
        wav_file.setframerate(24000)
        
        if isinstance(pcm_data, str):
            pcm_data = base64.b64decode(pcm_data)
        
        wav_file.writeframes(pcm_data)
    
    wav_buffer.seek(0)
    wav_base64 = base64.b64encode(wav_buffer.read()).decode('utf-8')

    return {"audio": wav_base64, "format": "wav"}






@router.post("/setup-interview")
async def setup_interview(request: SetupInterviewSchema, db=Depends(get_database)):
    try:
        if not all([request.user_id, request.domain, request.experience, request.interview_type, request.mode, request.difficulty]):
            raise HTTPException(status_code=400, detail="All fields are required to setup an interview.")
        
        interview = await db.interviews.insert_one({
            **request.model_dump(),
            "completion": "pending",
            "created_at": datetime.now().isoformat()  
        })

        return JSONResponse(status_code=200, content={"message": "Interview setup done.", "status": True, "interview_id": str(interview.inserted_id)})

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error occurred: {str(e)}")
    

@router.post("/receive-first-ai-text")
async def first_ai_text(request: ReceiveFirstAITextSchema, db=Depends(get_database)):
    try:
        if not all([request.interview_id, request.domain, request.interview_type, request.user_name]):
            raise HTTPException(status_code=400, detail="All fields are required.")
        
        first_text = await generate_first_text(request.user_name, request.domain, request.interview_type)
        first_text_audio = await generate_speech(first_text)
        
        if not first_text:
            return {"message": "Error occured, could not retrieve the first text from LLM. Please try again."}
        
        existing_first_ai  = await db.interview_conversations.find_one({"interview_id": request.interview_id, "sender": "ai", "is_first_message": True})

        if existing_first_ai:
            await db.interview_conversations.update_one(
                {"_id": existing_first_ai["_id"]},
                {"$set": {"text": first_text, "text_audio": first_text_audio,  "updated_at": datetime.now()}}
            )
            updated_doc = await db.interview_conversations.find_one({"_id": existing_first_ai["_id"]})
        else:
            insert_result = await db.interview_conversations.insert_one({
                "interview_id": request.interview_id,
                "sender": "ai",
                "is_first_message": True,
                "text": first_text,
                "text_audio": first_text_audio,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            })
            updated_doc = await db.interview_conversations.find_one({"_id": insert_result.inserted_id})

        
        updated_doc = serialize_mongo_doc(updated_doc)


        return JSONResponse(
            status_code=200,
            content={
                "message": "First text for AI retrieved successfully!",
                "status": True,
                "text": first_text,
                "interview_conversation": updated_doc,
                "text_audio": first_text_audio
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code= 400, detail=f"Error occurred: {str(e)}")
    
    
@router.get("/retrieve-interview/{interview_id}")
async def retrieve_interview(interview_id: str, db=Depends(get_database)):
    try:
        if not interview_id:
            raise HTTPException(status_code=400, detail="Interview ID is required.")
        
        interview = await db.interviews.find_one({"_id": ObjectId(interview_id)})

        interview["_id"] = str(interview["_id"])

        return JSONResponse(status_code=200, content={"message": "Interview retrieved successfully!", "status": True, "interview": interview})

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error occurred: {str(e)}")
    
@router.post("/answer-interview-question/{interview_id}")
async def answer_question(request: EmployeeInterviewAnswers, interview_id: str, db=Depends(get_database)):
    try:
        if not interview_id:
            raise HTTPException(status_code=400, detail="Interview ID is required.")
        
        if not all([request.sender, request.text]):
            raise HTTPException(status_code=400, detail="All fields are required.")
        
        document = {
            "interview_id": interview_id,
            "is_first_message": False,
            "sender": request.sender,
            "text": request.text,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }

        result = await db.interview_conversations.insert_one(document)
        document["_id"] = result.inserted_id
        document = serialize_mongo_doc(document)

        return JSONResponse(
            status_code=200,
            content={
                "message": "Interview text added by user.",
                "status": True,
                "interview_conversation": document
            }
        ) 
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error occurred: {str(e)}")
    
@router.post("/answer-audio-interview-question/{interview_id}")
async def answer_interview_voice(
    interview_id: str,
    file: UploadFile = File(...),
    sender: str = Form(...),
    db=Depends(get_database)
):
    try:
        if not interview_id:
            raise HTTPException(status_code=400, detail="Interview ID is required.")
        if not sender:
            raise HTTPException(status_code=400, detail="Sender is required.")

        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        model = genai.GenerativeModel("gemini-2.5-flash")

        response = model.generate_content([
            {
                "role": "user",
                "parts": [
                    {"mime_type": file.content_type, "data": open(tmp_path, "rb").read()},
                    {"text": "Transcribe this user's audio response accurately into text."}
                ],
            }
        ])

        transcript = response.text if hasattr(response, "text") else None
        if not transcript:
            raise HTTPException(status_code=500, detail="Failed to transcribe audio.")

        document = {
            "interview_id": interview_id,
            "is_first_message": False,
            "sender": sender,
            "text": transcript,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }

        result = await db.interview_conversations.insert_one(document)
        document["_id"] = result.inserted_id
        document = serialize_mongo_doc(document)

        os.remove(tmp_path)

        return JSONResponse(
            status_code=200,
            content={
                "message": "Interview voice answer saved successfully.",
                "status": True,
                "interview_conversation": document,
                "transcript": transcript
            }
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error occurred: {str(e)}")
    
@router.get("/receive-interview-conversations/{interview_id}")
async def receive_conversations(interview_id: str, db=Depends(get_database)):
    try:
        if not interview_id:
            raise HTTPException(status_code=400, detail="Interview ID is required.")
        
        interview = await db.interviews.find_one({"_id": ObjectId(interview_id)})
        duration = None
        if interview is not None:
            duration = interview.get("interview_timer", None)
        
        cursor = db.interview_conversations.find({"interview_id": interview_id})
        conversations = await cursor.to_list(length=None)

        serialized_conversations = [serialize_mongo_doc(convo) for convo in conversations]

        return JSONResponse(
            status_code=200,
            content={
                "message": "Interview Conversation received.",
                "status": True,
                "interview_conversation": serialized_conversations,
                "duration": duration
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error occurred: {str(e)}")
    
@router.post("/get-ai-response/{interview_id}")
async def get_ai_response(interview_id: str, request: AIRequestSchema, db=Depends(get_database)):
    try:
        if not interview_id:
            raise HTTPException(status_code=400, detail="Interview ID is required.")
        
        interview_info = await db.interviews.find_one({"_id": ObjectId(interview_id)})
        interview_info['_id'] = str(interview_info['_id'])

        cursor = db.interview_conversations.find({"interview_id": interview_id})
        conversations = await cursor.to_list(length=None)

        serialized_conversations = [serialize_mongo_doc(convo) for convo in conversations]
        all_questions = [c['text'] for c in serialized_conversations if c['sender'] == 'ai'][1:]
        
        ai_response = ''
        finished = False
        if request.question_count == 10:
            ai_response = await interview_finished_message()
            finished = True
        else:
            ai_response = await generate_ai_response(interview_info, all_questions)
            finished = False  
        
        audio_ai_response = await generate_speech(ai_response)

        document = {
            "interview_id": interview_id,
            "is_first_message": False,
            "sender": "ai",
            "text": ai_response,
            "text_audio": audio_ai_response,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        result = await db.interview_conversations.insert_one(document)
        document["_id"] = result.inserted_id
        document = serialize_mongo_doc(document)

        if finished:
            await db.interviews.find_one_and_update({"_id": ObjectId(interview_id)}, {"$set": {"completion": "completed"}})

        return JSONResponse(
            status_code=200,
            content={
                "message": "AI Question generated successfully!",
                "status": True,
                "question": ai_response,
                "interview_conversation": document,
                "interview_finished": finished,
                "text_audio": audio_ai_response
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error occurred: {str(e)}")
    
@router.post("/log-interview-timer")
async def log_interview_timer(request: LogInterviewTimerSchema, db=Depends(get_database)):
    try:
        if not request.interview_id:
            raise HTTPException(status_code=400, detail="Interview ID is required.")
        
        update_data = {"interview_timer": request.timer}
        
        if request.completion is not None:
            update_data["completion"] = request.completion
        
        await db.interviews.find_one_and_update(
            {"_id": ObjectId(request.interview_id)},
            {"$set": update_data}
        )

        return JSONResponse(
            status_code=200,
            content={
                "message": "Interview timer logged successfully!",
                "status": True
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error occurred: {str(e)}")


@router.get("/check-interview-mode/{interview_id}")
async def check_interview_mode(interview_id: str, db=Depends(get_database)):
    try:
        if not interview_id:
            raise HTTPException(status_code=400, detail="Interview ID is required.")
        
        interview = await db.interviews.find_one({"_id": ObjectId(interview_id)}, {"_id": 0, "mode": 1})

        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found.")

        return JSONResponse(
            status_code=200,
            content={
                "message": "Interview mode retrieved successfully!",
                "status": True,
                "mode": interview.get("mode")
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error occurred: {str(e)}")