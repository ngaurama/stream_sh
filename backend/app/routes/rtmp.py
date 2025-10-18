from datetime import datetime, timezone
import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi import Form
from sqlalchemy.orm import Session
from app import models
from app.database import get_db

router = APIRouter(
        prefix="/rtmp",
        tags=["RTMP"]
    )

@router.get("/auth-publish")
async def auth_publish(name: str = Form(...), db: Session = Depends(get_db)):
    stream = db.query(models.Stream).filter(
        models.Stream.stream_key == name
    ).first()
    
    if not stream:
        raise HTTPException(status_code=403, detail="Invalid stream key")
    
    return {"status": "success"}

@router.post("/on_publish")
async def on_publish(name: str = Form(...), db: Session = Depends(get_db)):
    stream = db.query(models.Stream).filter(models.Stream.stream_key == name).first()
    if stream:
        stream.is_live = True
        stream.started_at = datetime.now(timezone.utc)
        db.commit()
    else:
        raise HTTPException(status_code=403, detail="Invalid stream key")

    return {"status": "success"}

@router.post("/on_publish_done")
async def on_publish_done(name: str = Form(...), db: Session = Depends(get_db)):
    stream = db.query(models.Stream).filter(models.Stream.stream_key == name).first()
    if stream:
        stream.is_live = False
        stream.ended_at = datetime.now(timezone.utc)
        db.commit()
    else:
        raise HTTPException(status_code=403, detail="Invalid stream key")

    if stream.thumbnail:
        old_path = os.path.join("uploads/thumbnails", os.path.basename(stream.thumbnail))
        if os.path.exists(old_path):
            os.remove(old_path)

    return {"status": "success"}
