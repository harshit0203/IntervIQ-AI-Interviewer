from typing_extensions import TypedDict
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph
from langchain_core.exceptions import LangChainException
import re
from dotenv import load_dotenv

load_dotenv()

class AgentState(TypedDict):
    last_text: str


llm = ChatOpenAI(model="gpt-5-mini", temperature='0.7')

def call_llm(state: AgentState) -> AgentState:
    """
    Generate a short, friendly, and engaging farewell message after the interview.

    The LLM should:
    1. Thank the user for attending the interview.
    2. Wish them all the best for their future interviews or opportunities.
    3. Mention that they can view a summary or report of the interview by clicking a button.
    4. Be positive, creative, and friendly without being overly formal.
    5. Use simple, clear, natural English in 2-3 lines.
    """

    system_message = SystemMessage(content=(
        "You are an AI assistant that generates a warm, friendly, and creative farewell message "
        "after a job interview. The text should:\n"
        "- Thank the user for attending the interview.\n"
        "- Wish them all the best for their upcoming interviews or future opportunities.\n"
        "- Mention that they can view the summary or report of the interview by clicking a button.\n"
        "- Be encouraging, positive, and natural without being too formal.\n"
        "- Keep it concise and friendly, around 2-3 lines.\n\n"
        "Example output:\n"
        "'Thank you for taking part in the interview! We wish you all the best for your future opportunities. "
        "You can check out a summary of this interview by clicking the button below—hope it helps you reflect and prepare even better!'"
    ))

    try:
        state["last_text"] = llm.invoke([system_message])
        return {"last_text": state["last_text"]}
    except LangChainException as e:
        raise e
    except Exception as e:
        raise e



graph = StateGraph(AgentState)
graph.add_node("llm", call_llm)
graph.set_entry_point("llm")
graph.set_finish_point("llm")

app = graph.compile()

async def interview_finished_message() -> str:
    """Generate last text at the end of interview using the LangGraph agent."""
    try:
        result = app.invoke({"last_text": ""})
        if isinstance(result, dict) and 'last_text' in result:
            ai_message = result['last_text']
            if hasattr(ai_message, 'content'):
                return ai_message.content 
            return ai_message
       
    except Exception as e:
        raise e