import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq

# Load env
load_dotenv()

app = FastAPI()  # ✅ MUST be here

# Serve frontend
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def home():
    return FileResponse("static/index.html")

# Groq
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Model
class ChatRequest(BaseModel):
    message: str
    userId: str
    clientId: str


@app.post("/chat")
async def chat(req: ChatRequest):

    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": req.message}
    ]

    def generate():
        try:
            stream = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=messages,
                stream=True
            )

            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            print("🔥 ERROR:", e)
            yield "⚠️ Error"

    return StreamingResponse(generate(), media_type="text/plain")
