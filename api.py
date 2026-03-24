from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os, json
from groq import Groq
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

app = FastAPI()

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def serve_home():
    return FileResponse("static/index.html")

# GROQ
api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)

# FIREBASE
if not firebase_admin._apps:
    cred_dict = json.loads(os.getenv("FIREBASE_KEY"))
    cred = credentials.Certificate(cred_dict)
    firebase_admin.initialize_app(cred)

db = firestore.client()

class ChatRequest(BaseModel):
    message: str
    userId: str
    clientId: str

@app.post("/chat")
async def chat(req: ChatRequest):
    messages = [{"role": "system", "content": "You are a helpful AI assistant."}]

    chats = db.collection("clients")         .document(req.clientId)         .collection("users")         .document(req.userId)         .collection("chats")         .order_by("timestamp", direction=firestore.Query.DESCENDING)         .limit(3)         .stream()

    history = [c.to_dict() for c in chats]
    history.reverse()

    for h in history:
        messages.append({"role": "user", "content": h.get("message", "")})
        messages.append({"role": "assistant", "content": h.get("response", "")})

    messages.append({"role": "user", "content": req.message})

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages
    )

    reply = completion.choices[0].message.content

    db.collection("clients")         .document(req.clientId)         .collection("users")         .document(req.userId)         .collection("chats")         .add({
            "message": req.message,
            "response": reply,
            "timestamp": datetime.utcnow()
        })

    return {"reply": reply}
