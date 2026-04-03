from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

app = FastAPI()

# ✅ CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Serve static folder
app.mount("/static", StaticFiles(directory="static"), name="static")

# ✅ IMPORTANT: serve UI on root
@app.get("/")
def serve_ui():
    return FileResponse("static/index.html")


# ----- CHAT API -----
class Message(BaseModel):
    message: str

@app.post("/chat")
async def chat(msg: Message):
    return {"response": f"AI: You said -> {msg.message}"}
