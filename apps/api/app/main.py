from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.db.session import SessionLocal
from app.routers import auth, listings, uploads

app = FastAPI(title="شامنا API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://marketplace-mu-beryl.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(auth.router)
app.include_router(listings.router)
app.include_router(uploads.router)

@app.get("/health")
def health():
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return { "status": "ok", "db": "connected" }
    except Exception as e:
        return { "status": "ok", "db": "error", "detail": str(e) }