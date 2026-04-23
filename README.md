# AI Study Planner and Execution Agent

An agentic AI application that generates an adaptive study plan, tracks daily task completion, and automatically reschedules missed tasks while balancing the workload evenly.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API (gemini-1.5-flash)

## Setup Instructions

### 1. Environment Setup
1. Create a `.env` file in the root directory (you can copy `.env.example`).
2. Add your credentials:
```env
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
```

### 2. Database Setup
1. Go to your Supabase project's SQL Editor.
2. Copy the contents of `schema.sql` and run it to create the required tables (`users`, `subjects`, `tasks`).

### 3. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Activate the virtual environment (if created) or create one:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install fastapi uvicorn supabase pydantic python-dotenv openai
   ```
4. Run the server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend will be running at `http://localhost:8000`.

### 4. Frontend Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The frontend will be running at `http://localhost:5173`.

## Architecture Details

- **Input**: The UI prompts for subjects, topics, deadline, and preferred daily study hours.
- **AI Planning**: The `generate_study_plan` function interacts with OpenAI to split topics and balance workload logically across the available days.
- **Execution Engine**: The system tracks completion of tasks.
- **Rescheduling Logic**: Missed tasks or incomplete tasks from previous days can be auto-rebalanced starting from the current date using the AI logic, ensuring you don't exceed your daily hours cap.

Enjoy your adaptive AI study schedule!
