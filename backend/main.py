from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import products, users, notifications
from database import Base,engine
from contextlib import asynccontextmanager
from task.scheduler import start_scheduler, stop_scheduler
from models import User, product, notification


Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def price_tracking_lifespan(app:FastAPI):
    # Startup
    start_scheduler()
    yield
    # Shutdown
    stop_scheduler


app = FastAPI(lifespan=price_tracking_lifespan)

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(users.router)
app.include_router(notifications.router)