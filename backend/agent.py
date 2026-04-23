import os
import json
import google.generativeai as genai
from datetime import date, timedelta
from typing import List, Dict

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash") # Using stable 1.5 flash model
else:
    model = None

def generate_study_plan(subjects: List[str], topics: str, start_date: date, deadline: date, hours_per_day: float) -> List[Dict]:
    """
    Calls Google Gemini to generate a day-wise study plan.
    """
    if not model:
        print("Gemini API Key not configured")
        return []

    days_available = (deadline - start_date).days
    if days_available <= 0:
        days_available = 1
        
    prompt = f"""
You are an expert study planner. 
I have the following subjects: {', '.join(subjects)}
Here are the topics I need to study: {topics}
I have {days_available} days to complete this, starting from {start_date.isoformat()} to {deadline.isoformat()}.
I can study for {hours_per_day} hours per day.

Break these topics into manageable tasks and distribute them across the available days.
Ensure the workload matches my daily hours limit.
If a topic is too large, break it into smaller sub-topics.

You must reply with a pure JSON array containing the schedule. Do not include markdown formatting or backticks.
Each object in the array must have the following keys:
- "date": The date of the task in "YYYY-MM-DD" format.
- "topic": The name of the specific topic or sub-topic to study.
- "duration": Estimated duration in hours (number).
- "search_query": A highly specific search query to find the best YouTube tutorial for this specific topic (string).

Example format:
[
  {{
    "date": "2026-05-01",
    "topic": "Trees Basics",
    "duration": 2,
    "search_query": "Data Structures Trees Basics tutorial"
  }}
]
    """

    try:
        response = model.generate_content(prompt)
        content = response.text.strip()
        
        # Strip potential markdown formatting
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
            
        plan = json.loads(content.strip())
        
        import urllib.parse
        for task in plan:
            query = task.get("search_query", task.get("topic"))
            encoded_query = urllib.parse.quote(query)
            task["resource_url"] = f"https://www.youtube.com/results?search_query={encoded_query}"
            
        return plan
    except Exception as e:
        print(f"Failed to generate plan with Gemini: {str(e)}")
        return []

def reschedule_tasks(pending_tasks: List[Dict], start_date: date, hours_per_day: float) -> List[Dict]:
    """
    Given a list of pending tasks, rebalance them starting from `start_date`.
    """
    if not model or not pending_tasks:
        return []
        
    tasks_str = json.dumps(pending_tasks)
    
    prompt = f"""
You are an expert study planner. The user has missed some tasks and needs them rescheduled.
Here are the pending tasks (in JSON):
{tasks_str}

Starting from {start_date.isoformat()}, distribute these tasks evenly.
Do not exceed {hours_per_day} hours per day. Avoid overloading a single day. 
If there are too many tasks for a single day, spread them to subsequent days.

Reply purely with a JSON array of the rescheduled tasks.
Each object must have:
- "id": the id from the input task.
- "date": the new assigned date in "YYYY-MM-DD".
- "topic": the topic from the input task.
- "duration": the duration from the input task.
    """

    try:
        response = model.generate_content(prompt)
        content = response.text.strip()
        
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
            
        new_plan = json.loads(content.strip())
        return new_plan
    except Exception as e:
        print(f"Failed to reschedule with Gemini: {str(e)}")
        return []

def generate_task_content(topic: str) -> Dict:
    """
    Calls Google Gemini to generate detailed content, key points, and resources for a specific task topic.
    """
    if not model:
        print("Gemini API Key not configured")
        return {}

    prompt = f"""
You are an expert tutor. Provide study material for the following topic: "{topic}"

Please return ONLY a JSON object containing the following keys. Do not include markdown formatting like ```json.
- "topic": The topic name.
- "explanation": A short, simple, and clear explanation of the topic (1-2 paragraphs).
- "key_points": An array of strings containing 3-5 key bullet points.
- "resources": An array of objects, each containing:
  - "type": strictly either "youtube" or "article"
  - "title": Title of the resource
  - "url": Valid URL to the resource (provide 1-2 youtube links and 1-2 article links)

Ensure the output is strictly valid JSON format.
"""
    try:
        response = model.generate_content(prompt)
        content = response.text.strip()
        
        # Strip potential markdown formatting
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
            
        task_content = json.loads(content.strip())
        return task_content
    except Exception as e:
        print(f"Failed to generate task content with Gemini: {str(e)}")
        return {}

