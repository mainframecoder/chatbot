from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os, tempfile
from groq import Groq
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

app = FastAPI()

# ✅ Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def serve_home():
    return FileResponse("static/index.html")

# ✅ GROQ INIT
api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)

# ✅ FIREBASE INIT (FIXED FOR RENDER)
db = None

try:
    if not firebase_admin._apps:
        firebase_key = os.getenv("FIREBASE_KEY")

        if not firebase_key:
            raise Exception("FIREBASE_KEY missing")

        # Write JSON safely to temp file
        with tempfile.NamedTemporaryFile(delete=False, mode="w", suffix=".json") as f:
            f.write(firebase_key)
            temp_path = f.name

        cred = credentials.Certificate(temp_path)
        firebase_admin.initialize_app(cred)

    db = firestore.client()

except Exception as e:
    print("🔥 Firebase Init Error:", e)


# ✅ REQUEST MODEL
class ChatRequest(BaseModel):
    message: str
    userId: str
    clientId: str


# ✅ CHAT ENDPOINT
@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        messages = [
            {"role": "system", "content": "You are a helpful AI assistant."}
        ]

        # ✅ LOAD CHAT HISTORY (if firebase works)
        if db:
            chats = db.collection("clients") \
                .document(req.clientId) \
                .collection("users") \
                .document(req.userId) \
                .collection("chats") \
                .order_by("timestamp", direction=firestore.Query.DESCENDING) \
                .limit(3) \
                .stream()

            history = [c.to_dict() for c in chats]
            history.reverse()

            for h in history:
                messages.append({"role": "user", "content": h.get("message", "")})
                messages.append({"role": "assistant", "content": h.get("response", "")})

        # ✅ USER MESSAGE
        messages.append({"role": "user", "content": req.message})

        # ✅ GROQ CALL
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages
        )

        reply = completion.choices[0].message.content

        # ✅ SAVE CHAT (if firebase works)
        if db:
            db.collection("clients") \
                .document(req.clientId) \
                .collection("users") \
                .document(req.userId) \
                .collection("chats") \
                .add({
                    "message": req.message,
                    "response": reply,
                    "timestamp": datetime.utcnow()
                })

        return {"reply": reply}

    except Exception as e:
        print("🔥 CHAT ERROR:", e)
        return {"reply": f"Error: {str(e)}"}
