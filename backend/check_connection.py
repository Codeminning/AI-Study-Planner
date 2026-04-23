import os
from dotenv import load_dotenv
from supabase import create_client

# Load from root
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
openai_key = os.getenv("OPENAI_API_KEY")

print(f"Checking connection with URL: {url}")
print(f"Supabase Key length: {len(key) if key else 0}")
print(f"OpenAI Key length: {len(openai_key) if openai_key else 0}")

if not url or not key:
    print("Error: Missing Supabase credentials.")
    exit(1)

try:
    # Check if URL has /rest/v1/
    if "/rest/v1/" in url:
        print("Warning: SUPABASE_URL should usually be just the project URL (e.g. https://xyz.supabase.co) without /rest/v1/")
        # Let's try fixing it for the check
        clean_url = url.split("/rest/v1/")[0]
        print(f"Attempting to connect with cleaned URL: {clean_url}")
        supabase = create_client(clean_url, key)
    else:
        supabase = create_client(url, key)
    
    # Try a simple select to verify connection
    res = supabase.table("users").select("*", count="exact").limit(1).execute()
    print("Successfully connected to Supabase!")
    print(f"Data: {res.data}")
except Exception as e:
    print(f"Connection failed: {str(e)}")
    print("Note: Make sure you have run schema.sql in Supabase SQL Editor.")
