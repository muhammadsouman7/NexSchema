from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import schema
from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s [%(name)s] %(message)s")

app = FastAPI(
    title="DB Architect AI",
    version="1.0.0",
    description="AI-powered relational database schema generator",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(schema.router)

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
