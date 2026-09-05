from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.map import router as map_router

app = FastAPI(title="Sentinel-AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(map_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "sentinel-ai-backend"}
