from typing_extensions import TypedDict, Dict, List
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph
from langchain_core.exceptions import LangChainException
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib import colors
import json
import os
from dotenv import load_dotenv

load_dotenv()

class AgentState(TypedDict):
    full_report_text: str
    report: dict

llm = ChatOpenAI(model="gpt-5-mini", temperature='0.3')

def call_llm(state: AgentState) -> AgentState:
    """
    Calls the LLM to generate a finalized, well-written, and professional full report
    based on the provided summarized interview JSON report.
    """

    system_message = SystemMessage(content=(
        "You are a professional HR interviewer and report writer. "
        "Your task is to take the provided interview analysis JSON and generate a full, structured textual report "
        "that reads like a professionally written evaluation document.\n\n"
        "The report should include:\n"
        "1. Interview Overview — context, tone, and brief performance summary.\n"
        "2. Detailed Evaluation — elaborate on clarity, pacing, and technical accuracy.\n"
        "3. Strengths — list and explain them naturally.\n"
        "4. Areas for Improvement — constructive and polite.\n"
        "5. AI Likelihood Analysis — describe how likely it is that responses were AI-generated and why.\n"
        "6. Suggested Resources — summarize them with short helpful notes.\n\n"
        "Output rules:\n"
        "- Return only the final formatted text (no JSON, no Markdown, no code block).\n"
        "- Write in a professional, polished tone.\n"
        "- Use paragraph formatting, not lists, unless they improve readability."
    ))

    human_message = HumanMessage(content=(
        f"Here is the generated interview summary JSON:\n{state['report']}\n\n"
        "Now generate the full written version of the report that can be used for PDF export."
    ))

    try:
        final_text = llm.invoke([system_message, human_message])
        state["full_report_text"] = final_text.content.strip()
        return {"full_report_text": state["full_report_text"]}

    except Exception as e:
        raise RuntimeError(f"Error while generating full report: {str(e)}")

graph = StateGraph(AgentState)
graph.add_node("llm", call_llm)
graph.set_entry_point("llm")    
graph.set_finish_point("llm")

app = graph.compile()

async def get_full_report(report: dict) -> str:
    """
    Async wrapper that calls the LangGraph agent (call_llm) to generate the final PDF-ready text.
    """
    try:
        result = app.invoke({"report": report})
        if isinstance(result, dict) and 'full_report_text' in result:
            ai_message = result['full_report_text']
            if hasattr(ai_message, 'content'):
                return ai_message.content 
            return ai_message
       
    except Exception as e:
        raise e