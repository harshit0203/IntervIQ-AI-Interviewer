from typing_extensions import TypedDict, Dict, List
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph
from langchain_core.exceptions import LangChainException
from dotenv import load_dotenv

load_dotenv()

class AgentState(TypedDict):
    new_question: str
    interview_info: Dict
    all_questions_asked: List[str]



llm = ChatOpenAI(model="gpt-5-mini", temperature='0.6')

def make_question_agent(state: AgentState) -> AgentState:
    """
    Generate the next interview question for the candidate based on interview details,
    while maintaining a smooth conversational tone.

    This agent:
    - Analyzes `interview_info` (domain, experience, interview_type, difficulty) to frame 
      the next meaningful question.
    - Reads `all_questions_asked` to ensure the new question is unique and not repetitive.
    - If there was a previous question, acknowledges it before asking the next one with a friendly tone.
    - If no previous questions exist, it directly generates the first relevant question.

    Behavior:
    - The acknowledgment line is neutral and does not assume the content of the user's answer.
    - The new question should be relevant to the interview’s domain, type, and difficulty.
    - Avoid rephrasing or repeating previously asked questions.
    - The response must contain only one clear and specific question.
    """

    last_question = state['all_questions_asked'][-1] if state['all_questions_asked'] else None

    if last_question:
        acknowledgment_instruction = (
            "Start your response with a short, neutral, and friendly acknowledgment referring to the previous question. "
            f"For example, if the previous question was '{last_question}', you might start with: "
            "'Thanks for answering the previous question! Now let's move on to the next one.'"
        )
    else:
        acknowledgment_instruction = (
            "Since there are no previous questions, do not add an acknowledgment. "
            "Simply generate the first relevant question based on the interview info."
        )

    all_questions_text = "\n".join(state['all_questions_asked']) if state['all_questions_asked'] else "None"

    system_message = SystemMessage(content=f"""
        You are a professional and friendly AI interviewer conducting a job interview.

        You have access to the following data:
        - `domain`: the technical or functional area of the interview (e.g., MERN Stack Developer, Data Analyst)
        - `experience`: candidate’s total experience in years
        - `interview_type`: specifies whether the interview is Technical, Managerial, HR, etc.
        - `difficulty`: how challenging the questions should be (Easy, Medium, Hard)
        - `all_questions_asked`: a list of all previous questions you have already asked
        {all_questions_text}

        {acknowledgment_instruction}

        After the acknowledgment (if any), generate ONE new, unique, and relevant question.
        - The question must NOT be similar to or rephrased from any question in `all_questions_asked`.
        - Keep it professional, specific, and consistent with the interview flow.
        - Do not ask multiple questions in a single response.
        - Use simple, clear, and natural English suitable for the interview context.

        Example:
        - Input:
        domain = 'MERN Stack Developer'
        experience = '3 years'
        interview_type = 'Technical'
        difficulty = 'Medium'
        all_questions_asked = "Explain the concept of Virtual DOM in React.\nHow does useEffect work?"

        - Output:
        'Thanks for answering the previous question! Now let's move ahead — can you explain how you would optimize API performance in a Node.js and MongoDB-based MERN application?'

        Remember: Only output a natural one-line acknowledgment (if applicable) followed by one new interview question.
    """)

    domain = state['interview_info']['domain']
    experience = state['interview_info']['experience']
    interview_type = state['interview_info']['interview_type']
    difficulty = state['interview_info']['difficulty']

    try:
        state['new_question'] = llm.invoke([system_message, domain, experience, interview_type, difficulty])
        return {"new_question": state['new_question']}
    except LangChainException as e:
        raise e
    except Exception as e:
        raise e

    
    

graph = StateGraph(AgentState)
graph.add_node("make_question", make_question_agent)
graph.set_entry_point("make_question")
graph.set_finish_point("make_question")

app = graph.compile()

async def generate_ai_response(interview_info: Dict, all_questions: list) -> str:
    """Generate title using the LangGraph agent."""
    try:
        result = app.invoke({"interview_info": interview_info, "all_questions_asked": all_questions})
        if isinstance(result, dict) and 'new_question' in result:
            ai_message = result['new_question']
            if hasattr(ai_message, 'content'):
                return ai_message.content 
            return ai_message
       
            
    except Exception as e:
        raise e