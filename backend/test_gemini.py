import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Error: GEMINI_API_KEY not found in .env")
    exit(1)

genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-flash-latest")

try:
    response = model.generate_content("Say hello")
    print("Gemini Connection Successful!")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Gemini Connection Failed: {str(e)}")
