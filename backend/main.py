from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import date
from models import PlanRequest, UpdateTaskStatus, RescheduleRequest
from db import supabase
from agent import generate_study_plan, reschedule_tasks
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)

app = FastAPI(title="AI Study Planner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Support both EMAIL_ADDRESS (Render/production) and EMAIL_SENDER (legacy local)
EMAIL_SENDER = os.getenv("EMAIL_ADDRESS") or os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    
    token = authorization.split(" ")[1]
    res = supabase.auth.get_user(token)
    if not res or not res.user:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    return res.user

def send_email(to_email: str, tasks: list):
    if not all([EMAIL_SENDER, EMAIL_PASSWORD]):
        print("Email config missing. Skipping email.")
        return
        
    tasks_html = ""
    for task in tasks:
        tasks_html += f"<li><strong>{task['topic']}</strong> ({task['duration']} hrs) - {task['date']}</li>"
        
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Your New AI Study Plan!</h2>
            <p>Your agent has generated the following schedule for you:</p>
            <ul>{tasks_html}</ul>
            <p>Good luck!</p>
        </body>
    </html>
    """
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = "🚀 Your New AI Study Plan"
    msg['From'] = EMAIL_SENDER
    msg['To'] = to_email
    msg.attach(MIMEText(html_content, 'html'))
    
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        server.sendmail(EMAIL_SENDER, to_email, msg.as_string())
        server.quit()
        logging.info(f"Email sent to {to_email}")
    except Exception as e:
        logging.error(f"Failed to send email: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "Backend running"}

@app.post("/create-plan")
def create_plan(request: PlanRequest, user=Depends(get_current_user)):
    try:
        plan = generate_study_plan(
            subjects=request.subjects, topics=request.topics,
            start_date=date.today(), deadline=request.deadline, hours_per_day=request.hours_per_day
        )
        if not plan:
            raise HTTPException(status_code=500, detail="Failed to generate plan")
            
        subject_name = ", ".join(request.subjects)
        sub_res = supabase.table("subjects").insert({
            "user_id": user.id,
            "name": subject_name,
            "deadline": str(request.deadline)
        }).execute()
        
        subject_id = sub_res.data[0]['id']
        
        tasks_to_insert = []
        for item in plan:
            tasks_to_insert.append({
                "subject_id": subject_id,
                "topic": item['topic'],
                "date": item['date'],
                "duration": item['duration'],
                "status": "pending",
                "resource_url": item.get('resource_url', '')
            })
            
        task_res = supabase.table("tasks").insert(tasks_to_insert).execute()
        
        # Send email trigger
        if user.email:
            send_email(user.email, tasks_to_insert)
        
        return {"message": "Plan created successfully", "tasks": task_res.data}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in /create-plan: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tasks")
def get_tasks(user=Depends(get_current_user)):
    try:
        sub_res = supabase.table("subjects").select("id").eq("user_id", user.id).execute()
        subject_ids = [s['id'] for s in sub_res.data]
        if not subject_ids:
            return []
        task_res = supabase.table("tasks").select("*, subjects!inner(name)").in_("subject_id", subject_ids).order("date").execute()
        
        # Sort tasks: pending first, completed last
        tasks = task_res.data if task_res.data else []
        tasks.sort(key=lambda x: (x.get('status') == 'completed', x.get('date')))
        
        return tasks
    except Exception as e:
        logging.error(f"Error in GET /tasks: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/tasks/{task_id}")
def update_task_status(task_id: str, request: UpdateTaskStatus, user=Depends(get_current_user)):
    try:
        # Verify ownership
        task_check = supabase.table("tasks").select("subjects!inner(user_id)").eq("id", task_id).execute()
        if not task_check.data or task_check.data[0]['subjects']['user_id'] != user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
            
        res = supabase.table("tasks").update({"status": request.status}).eq("id", task_id).execute()
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in PUT /tasks/{task_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

from agent import generate_task_content

@app.get("/task-content/{task_id}")
def get_task_content(task_id: str, user=Depends(get_current_user)):
    try:
        # Verify ownership and get topic
        task_check = supabase.table("tasks").select("topic, subjects!inner(user_id)").eq("id", task_id).execute()
        if not task_check.data or task_check.data[0]['subjects']['user_id'] != user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
            
        topic = task_check.data[0]['topic']
        content = generate_task_content(topic)
        if not content:
            raise HTTPException(status_code=500, detail="Failed to generate content")
            
        return content
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in GET /task-content/{task_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reschedule")
def reschedule(request: RescheduleRequest, user=Depends(get_current_user)):
    try:
        sub_res = supabase.table("subjects").select("id").eq("user_id", user.id).execute()
        subject_ids = [s['id'] for s in sub_res.data]
        if not subject_ids:
            return {"message": "No subjects found"}
            
        res_all_pending = supabase.table("tasks").select("*").eq("status", "pending").in_("subject_id", subject_ids).execute()
        all_pending = res_all_pending.data
        
        new_schedule = reschedule_tasks(pending_tasks=all_pending, start_date=date.today(), hours_per_day=request.hours_per_day)
        if not new_schedule:
            raise HTTPException(status_code=500, detail="Failed to reschedule")
            
        updated_tasks = []
        for item in new_schedule:
            up_res = supabase.table("tasks").update({"date": item['date']}).eq("id", item['id']).execute()
            if up_res.data:
                updated_tasks.append(up_res.data[0])
                
        return {"message": "Rescheduled successfully", "updated": updated_tasks}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in POST /reschedule: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
