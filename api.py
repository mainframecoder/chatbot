from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# ✅ FIX CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change later to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    message: str

@app.get("/")
def home():
    return {"status": "ok"}

@app.post("/chat")
async def chat(msg: Message):
    user_msg = msg.message

    # 🔥 Replace this with OpenAI later
    reply = f"AI: You said -> {user_msg}"

    return {"response": reply}
