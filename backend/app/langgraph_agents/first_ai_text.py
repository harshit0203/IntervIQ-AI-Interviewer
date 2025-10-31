from typing_extensions import TypedDict
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph
from langchain_core.exceptions import LangChainException
import re
from dotenv import load_dotenv

load_dotenv()

class AgentState(TypedDict):
    first_text: str
    user_name: str
    domain: str
    interview_type: str


llm = ChatOpenAI(model="gpt-5-mini", temperature='0.5')

def call_llm(state: AgentState) -> AgentState:
    """
    Generate a short, friendly, and personalized opening message for the interview.

    Using `user_name`, `domain`, and `interview_type`, this function produces a
    2-3 line introduction that welcomes the candidate, sets a positive tone, and
    encourages them to start the interview in simple, engaging language.
    """
    
    system_message = SystemMessage(content=(
        "You are an AI assistant that generates the first welcoming text for a job interview. "
        "Based on the inputs `user_name`, `domain`, and `interview_type`, create a concise, "
        "friendly, and engaging 2-3 line introduction. The text should:\n"
        "1. Personally greet the user by name.\n"
        "2. Mention the interview domain or job role.\n"
        "3. Indicate the type of interview (Technical, Managerial, HR, etc.).\n"
        "4. Be interactive and encourage the user to start the interview.\n"
        "5. Use simple, clear, and natural English without being too formal or bulky.\n\n"
        "Example:\n"
        "- Input: user_name='Alex', domain='MERN Stack Developer', interview_type='Technical'\n"
        "- Output: 'Hello Alex! Welcome to your technical interview for the MERN Stack Developer role. "
        "We'll begin with a few questions about your experience with React. Are you ready?'"
        "Remember: Don't add a question in this first text as an interview question for the employee. It should just be a welcoming text for job interview."
    ))

    user_name = HumanMessage(content=state['user_name'])
    domain = HumanMessage(content=state['domain'])
    interview_type = HumanMessage(content=state['interview_type'])

    try:
        state["first_text"] = llm.invoke([system_message, user_name, domain, interview_type])
        return {"first_text": state["first_text"]}

    except LangChainException as e:
        raise e
    except Exception as e:
        raise e


graph = StateGraph(AgentState)
graph.add_node("llm", call_llm)
graph.set_entry_point("llm")
graph.set_finish_point("llm")

app = graph.compile()

async def generate_first_text(user_name: str, domain: str, interview_type:str) -> str:
    """Generate title using the LangGraph agent."""
    try:
        result = app.invoke({"user_name": user_name, "domain": domain, "interview_type": interview_type, "first_text": ""})
        if isinstance(result, dict) and 'first_text' in result:
            ai_message = result['first_text']
            if hasattr(ai_message, 'content'):
                return ai_message.content 
            return ai_message
        else:
            return "Hello, and welcome to your interview. We'll start with a few questions about your experience. Are you ready?"
            
    except Exception as e:
        raise e