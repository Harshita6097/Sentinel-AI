from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.map import router as map_router
from api.simulation import router as sim_router
from api.vision import router as vision_router
from api.emergency import router as emergency_router
from api.logistics import router as logistics_router
from simulation import scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.start()
    yield
    scheduler.stop()


app = FastAPI(title="Sentinel-AI API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(map_router)
app.include_router(sim_router)
app.include_router(vision_router)
app.include_router(emergency_router)
app.include_router(logistics_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "sentinel-ai-backend"}
