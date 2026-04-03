import os
import tempfile
from datetime import datetime

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from groq import Groq
import firebase_admin
from firebase_admin import credentials, firestore

load_dotenv()

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def home():
    return FileResponse("static/index.html")

# Groq
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Firebase
db = None
try:
    if not firebase_admin._apps:
        firebase_key = os.getenv("FIREBASE_KEY")

        if firebase_key:
            with tempfile.NamedTemporaryFile(delete=False, mode="w", suffix=".json") as f:
                f.write(firebase_key)
                temp_path = f.name

            cred = credentials.Certificate(temp_path)
            firebase_admin.initialize_app(cred)

    db = firestore.client()
except Exception as e:
    print("Firebase error:", e)

class ChatRequest(BaseModel):
    message: str
    userId: str
    clientId: str

# 🔥 STREAMING CHAT
@app.post("/chat-stream")
async def chat_stream(req: ChatRequest):

    async def generate():
        messages = [{"role": "system", "content": "You are a smart assistant."}]

        # Load history
        if db:
            chats = db.collection("clients") \
                .document(req.clientId) \
                .collection("users") \
                .document(req.userId) \
                .collection("chats") \
                .order_by("timestamp", direction=firestore.Query.DESCENDING) \
                .limit(5) \
                .stream()

            history = [c.to_dict() for c in chats]
            history.reverse()

            for h in history:
                messages.append({"role": "user", "content": h["message"]})
                messages.append({"role": "assistant", "content": h["response"]})

        messages.append({"role": "user", "content": req.message})

        stream = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            stream=True
        )

        full_reply = ""

        for chunk in stream:
            delta = chunk.choices[0].delta.content or ""
            full_reply += delta
            yield delta

        # Save
        if db:
            db.collection("clients") \
                .document(req.clientId) \
                .collection("users") \
                .document(req.userId) \
                .collection("chats") \
                .add({
                    "message": req.message,
                    "response": full_reply,
                    "timestamp": datetime.utcnow()
                })

    return StreamingResponse(generate(), media_type="text/plain")
