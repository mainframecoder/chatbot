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

# Load env
load_dotenv()

app = FastAPI(title="AI Chatbot API")

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
def serve_home():
    return FileResponse("static/index.html")

@app.get("/health")
def health():
    return {"status": "ok"}

# Groq
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    raise ValueError("❌ GROQ_API_KEY not set")

client = Groq(api_key=groq_api_key)

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
    print("🔥 Firebase Init Error:", e)

# Model
class ChatRequest(BaseModel):
    message: str
    userId: str
    clientId: str


@app.post("/chat")
async def chat(req: ChatRequest):

    messages = [
        {"role": "system", "content": "You are a helpful, smart, concise AI assistant."}
    ]

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
            if h.get("message"):
                messages.append({"role": "user", "content": h["message"]})
            if h.get("response"):
                messages.append({"role": "assistant", "content": h["response"]})

    messages.append({"role": "user", "content": req.message})

    def generate():
        full_reply = ""

        try:
            stream = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=messages,
                stream=True
            )

            for chunk in stream:
                if chunk.choices[0].delta.content:
                    text = chunk.choices[0].delta.content
                    full_reply += text
                    yield text

            # Save chat after full response
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

        except Exception as e:
            print("🔥 STREAM ERROR:", e)
            yield "⚠️ Error generating response"

    return StreamingResponse(generate(), media_type="text/plain")
