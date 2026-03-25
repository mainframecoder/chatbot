from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import os, tempfile, time, stripe
from groq import Groq
import firebase_admin
from firebase_admin import credentials, firestore

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def home():
    return FileResponse("static/index.html")

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
stripe.api_key = os.getenv("STRIPE_SECRET")

# Firebase
if not firebase_admin._apps:
    key=os.getenv("FIREBASE_KEY")
    with tempfile.NamedTemporaryFile(delete=False,mode="w") as f:
        f.write(key)
        path=f.name
    firebase_admin.initialize_app(credentials.Certificate(path))

db=firestore.client()

# -------- PLANS --------
PLANS = {
    "free": 10000,
    "pro": 100000,
    "business": 9999999
}

def count_tokens(text):
    return int(len(text) / 4)  # approx

# -------- CHAT --------
@app.post("/chat")
async def chat(r:dict):
    msg=r["message"]
    u=r["userId"]
    c=r["clientId"]
    t=r["chatId"]

    user_ref = db.collection("clients").document(c).collection("users").document(u)
    user = user_ref.get().to_dict() or {}

    plan = user.get("plan","free")
    used = user.get("tokens",0)

    res = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role":"user","content":msg}],
        max_tokens=200
    )

    reply = res.choices[0].message.content

    tokens = count_tokens(msg) + count_tokens(reply)

    # 🚫 limit check
    if used + tokens > PLANS[plan]:
        return {"reply": "⚠️ Token limit reached. Upgrade your plan."}

    # 💾 save usage
    user_ref.set({
        "tokens": used + tokens,
        "plan": plan
    }, merge=True)

    # 💬 save chat
    thread = user_ref.collection("threads").document(t)
    if not thread.get().exists:
        thread.set({"title": msg[:30]})

    thread.collection("messages").add({"role":"user","text":msg})
    thread.collection("messages").add({"role":"bot","text":reply})

    # ⚡ streaming
    async def stream():
        for ch in reply:
            yield ch
            time.sleep(0.01)

    return StreamingResponse(stream(), media_type="text/plain")

# -------- USAGE API --------
@app.get("/usage/{clientId}/{userId}")
def usage(clientId,userId):
    user = db.collection("clients").document(clientId)\
        .collection("users").document(userId).get().to_dict() or {}

    return {
        "tokens": user.get("tokens",0),
        "plan": user.get("plan","free"),
        "limit": PLANS[user.get("plan","free")]
    }
