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

# ✅ CORS (important for Render)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://chatbot-v4tn.onrender.com",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.options("/{rest_of_path:path}")
async def preflight():
    return {}

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
            with tempfile.NamedTemporaryFile(delete=False, mode="w") as f:
                f.write(firebase_key)
                temp = f.name

            cred = credentials.Certificate(temp)
            firebase_admin.initialize_app(cred)

    db = firestore.client()
except Exception as e:
    print("Firebase error:", e)

# Model
class ChatRequest(BaseModel):
    message: str
    userId: str
    clientId: str
    threadId: str


# 🔥 STREAMING CHAT
@app.post("/chat-stream")
async def chat_stream(req: ChatRequest):

    async def generate():
        messages = [{"role": "system", "content": "You are a smart assistant."}]

        # Load history
        if db:
            msgs = db.collection("clients") \
                .document(req.clientId) \
                .collection("users") \
                .document(req.userId) \
                .collection("threads") \
                .document(req.threadId) \
                .collection("messages") \
                .order_by("timestamp") \
                .limit(10) \
                .stream()

            for m in msgs:
                d = m.to_dict()
                messages.append({"role": "user", "content": d["message"]})
                messages.append({"role": "assistant", "content": d["response"]})

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

        # Save message
        if db:
            thread_ref = db.collection("clients") \
                .document(req.clientId) \
                .collection("users") \
                .document(req.userId) \
                .collection("threads") \
                .document(req.threadId)

            # Ensure thread exists
            thread_ref.set({
                "updated": datetime.utcnow()
            }, merge=True)

            thread_ref.collection("messages").add({
                "message": req.message,
                "response": full_reply,
                "timestamp": datetime.utcnow()
            })

    return StreamingResponse(generate(), media_type="text/plain")


# 🔥 GET THREADS
@app.get("/threads/{client_id}/{user_id}")
def get_threads(client_id: str, user_id: str):
    if not db:
        return []

    threads = db.collection("clients") \
        .document(client_id) \
        .collection("users") \
        .document(user_id) \
        .collection("threads") \
        .stream()

    return [{"id": t.id} for t in threads]


# 🔥 GET MESSAGES
@app.get("/messages/{client_id}/{user_id}/{thread_id}")
def get_messages(client_id: str, user_id: str, thread_id: str):
    if not db:
        return []

    msgs = db.collection("clients") \
        .document(client_id) \
        .collection("users") \
        .document(user_id) \
        .collection("threads") \
        .document(thread_id) \
        .collection("messages") \
        .order_by("timestamp") \
        .stream()

    return [m.to_dict() for m in msgs]
