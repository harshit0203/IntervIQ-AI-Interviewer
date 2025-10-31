from typing_extensions import TypedDict, Dict, List
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph
from langchain_core.exceptions import LangChainException
from dotenv import load_dotenv

load_dotenv()

class AgentState(TypedDict):
    interview: Dict
    question_answer_arr: List
    report: str
    ai_likelihood: str

llm = ChatOpenAI(model="gpt-5-mini", temperature='0.2')

def call_llm(state: AgentState)-> AgentState:
    """
    Calls the LLM to generate an interview report based on the provided interview details
    and Question & Answer pairs, incorporating AI-likelihood data.
    """
    ai_likelihood_response = is_answer_ai_generated(state)

    system_message = SystemMessage(content=(
        "You are an expert interview analyst and interviewer. Your task is to evaluate the provided interview details "
        "and the list of AI-question / user-answer pairs (supplied at runtime) and return a structured JSON object "
        "summarizing the interview analysis. DO NOT return HTML or CSS. The frontend already has a fixed design.\n\n"

        "You must analyze the user's answers honestly and critically, determining how suitable each answer was "
        "for the AI's question. Then generate an overview summary of the entire interview — not question-by-question.\n\n"

        "You must also incorporate the AI-likelihood analysis provided (a JSON array of High/Medium/Low + percentage for each answer). "
        "Use this to produce a final 'aiLikelihood' key in your JSON output and assessment should be a qualitative assessment: 'High', 'Medium', or 'Low'. and not more than that:\n"
        "{ 'score': <0–100>, 'description': <string>, 'assessment': <string> }\n"
        "The score should reflect the overall probability that the answers were AI-generated or copied, "
        "and the description should summarize it in 2–3 lines.\n\n"

        "Your output must be a single valid JSON object with the following structure:\n"
        "{\n"
        "  'overallScore': <0–100>,\n"
        "  'clarityScore': <0–100>,\n"
        "  'pacingScore': <0–100>,\n"
        "  'strengths': [<string>, ...],\n"
        "  'areasForImprovement': [<string>, ...],\n"
        "  'suggestedResources': [ {'title': <string>, 'url': <string>}, ... ],\n"
        "  'summary': <string>,  // overview paragraph of 8–10 sentences\n"
        "  'aiLikelihood': { 'score': <0–100>, 'description': <string>, 'assessment': <string> }\n"
        "}\n\n"

        "Scoring rules:\n"
        "- Clarity Score → measures how clear, focused, and unambiguous the answers were.\n"
        "- Pacing Score → measures answer structure, conciseness, and flow.\n"
        "- Overall Score → weighted average: 40% clarity, 40% relevance/technical correctness, 20% pacing.\n\n"

        "Guidelines:\n"
        "- Be professional, direct, and constructive.\n"
        "- Be brutally honest if an answer is unsuitable or off-topic.\n"
        "- Reflect weaknesses in scores and summary.\n"
        "- Strengths and Areas for Improvement should each have 3–6 concise bullets.\n"
        "- Suggested Resources should include relevant links or study areas.\n"
        "- Summary must give a complete overall impression without referencing question numbers.\n\n"

        "Output rules:\n"
        "- Return ONLY valid JSON (no extra text, explanations, markdown, or HTML).\n"
        "- Use the AI-likelihood input to populate the final 'aiLikelihood' key.\n"
        "- The frontend will parse this JSON to render the report."
    ))

    human_message = HumanMessage(content=(
        f"Interview Metadata:\n{state['interview']}\n\n"
        f"Ordered Question & Answer Pairs:\n{state['question_answer_arr']}\n\n"
        f"AI-likelihood analysis for each answer:\n{ai_likelihood_response}\n\n"
        "Produce the final interview report JSON now, incorporating the AI-likelihood data as described."
    ))


    try:
        state['report'] = llm.invoke([system_message, human_message])
        return {"report": state['report']}
    
    except LangChainException as e:
        raise RuntimeError(f"LLM call failed: {str(e)}")
    except Exception as e:
        raise e
    

def is_answer_ai_generated(state) -> str:
    """Placeholder function to determine if user's answer is AI-generated or AI-Likelihood."""

    system_message = SystemMessage(content=(
        "You are an expert at detecting AI-generated text. Given a user's answer, determine how likely it was generated "
        "by an AI model. For each answer, provide both:\n"
        "1. A qualitative assessment: 'High', 'Medium', or 'Low'.\n"
        "2. A numeric likelihood percentage from 0 to 100.\n"
        "Return your response in a strict JSON array format where each element corresponds to an answer and has two keys: "
        "'assessment' and 'percentage'.\n"
        "Example:\n"
        "[\n"
        "  { 'assessment': 'High', 'percentage': 85 },\n"
        "  { 'assessment': 'Low', 'percentage': 10 }\n"
        "]\n\n"
        "Do not include any extra text or explanation outside the JSON."
    ))

    human_message = HumanMessage(content=(
        f"Ordered Question & Answer Pairs:\n{state['question_answer_arr']}\n\n"
        "For each answer, assess the likelihood it was AI-generated. Provide JSON output as specified above."
    ))


    try:

        response = llm.invoke([system_message, human_message])
        return response.content
    
    except LangChainException as e:
        raise RuntimeError(f"LLM call failed: {str(e)}")
    except Exception as e:
        raise e


graph = StateGraph(AgentState)
graph.add_node("llm", call_llm)
graph.set_entry_point("llm")
graph.set_finish_point("llm")

app = graph.compile()

async def generate_interview_report(interview: dict, question_answer_arr: list) -> str:
    """Generate interview report using the LangGraph agent."""
    try:
        result = app.invoke({"interview": interview, "question_answer_arr": question_answer_arr, "report": ""})
        if isinstance(result, dict) and 'report' in result:
            ai_message = result['report']
            if hasattr(ai_message, 'content'):
                return ai_message.content 
            return ai_message
       
    except Exception as e:
        raise e
    