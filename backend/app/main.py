# ./main.py
from scalar_fastapi import get_scalar_api_reference
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text
from app.database import engine
from app.config import settings
from app import models
from app.routes import auth, stream, chat, follows, rtmp, upload

from app import faker_api

app = FastAPI(
    root_path="/api"
)

@app.on_event("startup")
async def startup_event():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT pg_try_advisory_lock(12345)"))
        lock_acquired = result.scalar()
        
        if lock_acquired:
            try:
                inspector = inspect(engine)
                existing_tables = inspector.get_table_names()
                
                if not existing_tables:
                    print("Creating database tables...")
                    models.Base.metadata.create_all(engine)
                    print("Database tables created successfully")
                else:
                    print("Database tables already exist")
            finally:
                conn.execute(text("SELECT pg_advisory_unlock(12345)"))
        else:
            print("Another process is initializing database, waiting...")
            import time
            time.sleep(2)
            inspector = inspect(engine)
            existing_tables = inspector.get_table_names()
            if existing_tables:
                print("Database tables are ready")
            else:
                print("Database initialization failed in other process")

origins = [
    settings.frontend_url
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(stream.router)
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(follows.router)
app.include_router(rtmp.router)
app.include_router(upload.router)

app.include_router(faker_api.router)

@app.get("/")
def root():
    return {"message": "Hello world"}


@app.get("/scalar", include_in_schema=False)
async def scalar_html():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        title=app.title,
    )
