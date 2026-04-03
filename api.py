from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from passlib.context import CryptContext
from jose import jwt

SECRET = "secret123"

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
def serve_ui():
    return FileResponse("static/index.html")

# DB
engine = create_engine("sqlite:///db.sqlite")
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)
    password = Column(String)

class MessageDB(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    text = Column(String)
    role = Column(String)

Base.metadata.create_all(engine)

pwd = CryptContext(schemes=["bcrypt"])

# Schemas
class Auth(BaseModel):
    email: str
    password: str

class Chat(BaseModel):
    message: str

# Auth helpers
def create_token(user_id):
    return jwt.encode({"user_id": user_id}, SECRET, algorithm="HS256")

def get_user(token: str = ""):
    try:
        data = jwt.decode(token, SECRET, algorithms=["HS256"])
        db = SessionLocal()
        return db.query(User).filter(User.id == data["user_id"]).first()
    except:
        raise HTTPException(401)

# Register
@app.post("/register")
def register(data: Auth):
    db = SessionLocal()
    hashed = pwd.hash(data.password)
    user = User(email=data.email, password=hashed)
    db.add(user)
    db.commit()
    return {"msg": "registered"}

# Login
@app.post("/login")
def login(data: Auth):
    db = SessionLocal()
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not pwd.verify(data.password, user.password):
        raise HTTPException(401)
    return {"token": create_token(user.id)}

# Chat
@app.post("/chat")
def chat(data: Chat, token: str):
    user = get_user(token)
    db = SessionLocal()

    # save user message
    db.add(MessageDB(user_id=user.id, text=data.message, role="user"))

    reply = f"AI: {data.message}"  # replace later with OpenAI

    db.add(MessageDB(user_id=user.id, text=reply, role="bot"))
    db.commit()

    return {"response": reply}

# History
@app.get("/history")
def history(token: str):
    user = get_user(token)
    db = SessionLocal()

    msgs = db.query(MessageDB).filter(MessageDB.user_id == user.id).all()
    return [{"text": m.text, "role": m.role} for m in msgs]
