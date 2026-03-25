from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load env variables
load_dotenv()

app = FastAPI()

# ✅ CORS FIX
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://chatbot-v4tn.onrender.com",  # your frontend
        "http://localhost:3000",
        "http://127.0.0.1:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔥 Health check route
@app.get("/")
def home():
    return {"status": "ok", "message": "API is running 🚀"}

# 🧠 Chat endpoint
@app.post("/chat")
async def chat(request: Request):
    try:
        data = await request.json()
        user_message = data.get("message", "")

        if not user_message:
            return {"reply": "Empty message ❌"}

        # 👉 Replace this with OpenAI / Groq / your AI logic
        reply = f"You said: {user_message}"

        return {"reply": reply}

    except Exception as e:
        return {"error": str(e)}
