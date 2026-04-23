import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import date
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

# Database Config
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Email Config
EMAIL_SENDER = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

def fetch_users_with_emails(supabase: Client):
    # Fetch all users who have an email address
    res = supabase.table("users").select("id, name, email").not_.is_("email", "null").execute()
    return res.data

def fetch_todays_tasks_for_user(supabase: Client, user_id: str):
    today_str = str(date.today())
    
    # We need to join via subjects to filter by user_id
    # The current supabase-py client handles nested queries nicely.
    res = supabase.table("tasks").select("*, subjects!inner(user_id, name)").eq("date", today_str).eq("status", "pending").eq("subjects.user_id", user_id).execute()
    return res.data

def create_email_html(user_name, tasks):
    today_str = date.today().strftime("%B %d, %Y")
    
    if not tasks:
        return f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
                <div style="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
                    <h2 style="color: #4f46e5;">Study Agent Check-in</h2>
                    <p style="color: #4b5563;">Hi {user_name}, you have no pending tasks scheduled for today, {today_str}. Rest up!</p>
                </div>
            </body>
        </html>
        """

    tasks_html = ""
    for task in tasks:
        subject_name = task.get('subjects', {}).get('name', 'Subject')
        topic = task.get('topic', 'Topic')
        duration = task.get('duration', 0)
        
        tasks_html += f"""
        <li style="margin-bottom: 10px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #f9fafb;">
            <strong style="color: #111827; font-size: 16px;">{topic}</strong><br/>
            <span style="color: #6b7280; font-size: 14px;">{subject_name} • {duration} hours</span>
        </li>
        """

    html = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4f46e5; margin: 0;">Your Daily Study Plan</h1>
                    <p style="color: #6b7280; margin-top: 5px;">{today_str}</p>
                </div>
                <p style="color: #374151; font-size: 16px;">Good morning {user_name}! Here is what your AI Agent has scheduled for you today:</p>
                
                <ul style="list-style-type: none; padding: 0;">
                    {tasks_html}
                </ul>
                
                <div style="margin-top: 30px; text-align: center;">
                    <a href="http://localhost:5173" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; display: inline-block;">
                        Open Study Dashboard
                    </a>
                </div>
            </div>
        </body>
    </html>
    """
    return html

def send_daily_emails():
    if not all([EMAIL_SENDER, EMAIL_PASSWORD]):
        print("Email sender configuration is missing in .env. Please set EMAIL_SENDER and EMAIL_PASSWORD.")
        return

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("Fetching users...")
    users = fetch_users_with_emails(supabase)
    
    if not users:
        print("No users with email addresses found.")
        return

    print(f"Found {len(users)} users. Connecting to SMTP server...")
    try:
        # Using Gmail SMTP by default
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        
        for user in users:
            print(f"Processing email for {user['email']}...")
            tasks = fetch_todays_tasks_for_user(supabase, user['id'])
            
            html_content = create_email_html(user['name'], tasks)
            
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"🚀 {user['name']}, your AI Study Plan for {date.today().strftime('%b %d')}"
            msg['From'] = EMAIL_SENDER
            msg['To'] = user['email']
            
            msg.attach(MIMEText(html_content, 'html'))
            
            server.sendmail(EMAIL_SENDER, user['email'], msg.as_string())
            print(f"[OK] Email sent to {user['email']}")
            
        server.quit()
        print("All emails processed successfully!")
    except Exception as e:
        print(f"[ERROR] Failed to process emails: {str(e)}")

if __name__ == "__main__":
    send_daily_emails()
