from typing_extensions import TypedDict, Dict, List
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph
from langchain_core.exceptions import LangChainException
from dotenv import load_dotenv

load_dotenv()

class AgentState(TypedDict):
    interview: dict
    full_report_text: str
    question_answer_arr: List[Dict[str, str]]
    detailed_breakdown: str


llm = ChatOpenAI(model="gpt-5-mini", temperature='0.4')

def call_llm(state: AgentState) -> AgentState:
    """
    Call the LLM to generate a detailed breakdown of the interview report. This function analyzes the interview report question by question and provides a refined, structured analysis.
    """

    system_message = SystemMessage(content="""
    You are an expert interview analysis agent. Your task is to analyze the interview report provided by the user and generate a detailed breakdown of the interview performance question by question. 
    
    For each question in the interview report, provide the following fields in the JSON output:
    
    1. question: The exact question asked during the interview (Please remove the welcoming message before the actual question from the string and just state the question).
    2. userAnswer: The exact answer given by the user.
    3. score: Overall score for the answer out of 100.
    4. clarityScore: Score out of 100 for clarity of the answer.
    5. relevanceScore: Score out of 100 for relevance to the question.
    6. duration: Time taken by the user to answer the question (format: "X min Y sec"). This is already provided as 'interviewer_timer' key. 
    7. strengths: List of strengths in the user's answer, highlighting specific points or examples (Maximum 3).
    8. improvements: List of areas for improvement with constructive suggestions (Maximum 3).
    9. aiAnalysis: A short paragraph summarizing the AI's analysis of the answer, including communication, relevance, and suggestions for improvement.
    
    Format the response strictly as a JSON array, with each question as an object containing the fields above. Example format:
    
    [
      {
        "question": "Sample question?",
        "userAnswer": "Sample answer.",
        "score": 85,
        "clarityScore": 90,
        "relevanceScore": 80,
        "duration": "2 min 30 sec",
        "strengths": ["Point 1", "Point 2"],
        "improvements": ["Suggestion 1", "Suggestion 2"],
        "aiAnalysis": "Detailed AI analysis here."
      },
      ...
    ]
    
    Make sure all fields are included for each question, and provide thoughtful, actionable insights.
    """)

    human_message = HumanMessage(content=f"""
    Here is the interview report:
    {state['full_report_text']}

    And here is the list of question-answer pairs from the interview:
    {state['question_answer_arr']}
    
    Please provide a detailed breakdown of the interview performance question by question as per the instructions in the system message.
    """)


    try:
        response = llm.invoke([system_message, human_message])
        detailed_breakdown = response.content
        state['detailed_breakdown'] = detailed_breakdown
        return state
    except LangChainException as e:
        raise e
    
graph = StateGraph(AgentState)
graph.add_node("llm", call_llm)
graph.set_entry_point("llm")    
graph.set_finish_point("llm")

app = graph.compile()

async def generate_detailed_breakdown(interview: dict, report: str, question_answer_arr: list) -> str:
    """
    Async wrapper that calls the LangGraph agent (call_llm) to generate the final PDF-ready text.
    """
    try:
        result = app.invoke({"interview": interview, "full_report_text": report, "question_answer_arr": question_answer_arr})
        if isinstance(result, dict) and 'detailed_breakdown' in result:
            ai_message = result['detailed_breakdown']
            if hasattr(ai_message, 'content'):
                return ai_message.content 
            return ai_message
       
    except Exception as e:
        raise e