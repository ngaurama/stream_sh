# ./routes/stream.py
import os
import uuid
from fastapi import Query, WebSocket, WebSocketDisconnect, status, Depends, HTTPException, APIRouter
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app import schemas, models
from app.database import get_db, SessionLocal
from app.routes import oauth2
from app.routes.upload import delete_old_file

router = APIRouter(
    # prefix="/streams",
    tags=["Streams"]
)

class ViewerManager:
    def __init__(self):
        self.active_viewers: dict[int, set[int]] = {}
        self.active_connections: dict[int, list[WebSocket]] = {}
    
    async def add_viewer(self, stream_id: int, user_id: int, db: Session):
        if stream_id not in self.active_viewers:
            self.active_viewers[stream_id] = set()
        
        self.active_viewers[stream_id].add(user_id)
        
        stream = db.query(models.Stream).filter(models.Stream.id == stream_id).first()
        if stream:
            stream.viewer_count = len(self.active_viewers[stream_id])
            db.commit()
        
        existing_viewer = db.query(models.StreamViewer).filter(
            models.StreamViewer.stream_id == stream_id,
            models.StreamViewer.user_id == user_id
        ).first()
        
        if not existing_viewer:
            new_viewer = models.StreamViewer(
                stream_id=stream_id,
                user_id=user_id
            )
            db.add(new_viewer)
            db.commit()
    
    async def remove_viewer(self, stream_id: int, user_id: int, db: Session):
        if stream_id in self.active_viewers and user_id in self.active_viewers[stream_id]:
            self.active_viewers[stream_id].remove(user_id)
            
            stream = db.query(models.Stream).filter(models.Stream.id == stream_id).first()
            if stream:
                stream.viewer_count = len(self.active_viewers[stream_id])
                db.commit()
            
            viewer = db.query(models.StreamViewer).filter(
                models.StreamViewer.stream_id == stream_id,
                models.StreamViewer.user_id == user_id
            ).first()
            
            if viewer:
                db.delete(viewer)
                db.commit()

    async def broadcast_viewer_count(self, stream_id: int, viewer_count: int):
        if stream_id in self.active_connections:
            dead_connections = []
            for websocket in self.active_connections[stream_id]:
                try:
                    await websocket.send_json({
                        "type": "viewer_count_update",
                        "data": {"viewer_count": viewer_count}
                    })
                except:
                    dead_connections.append(websocket)
            
            for ws in dead_connections:
                self.active_connections[stream_id].remove(ws)

viewer_manager = ViewerManager()


@router.get("/streams/all", response_model=list[schemas.StreamResponse])
def get_streams(db: Session = Depends(get_db)):
    streams = db.query(models.Stream).filter(models.Stream.is_live == True).all()

    return streams

@router.get("/streams/{stream_id}", response_model=schemas.StreamResponse)
def get_stream(stream_id: int, db: Session = Depends(get_db)):
    stream = db.query(models.Stream).filter(models.Stream.id == stream_id).first()

    if not stream:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Strea not found")

    return stream

@router.post("/streams/create", status_code=status.HTTP_201_CREATED, response_model=schemas.StreamWithKeyResponse)
def create_stream(stream: schemas.StreamCreate, db: Session = Depends(get_db), current_user: int = Depends(oauth2.get_current_user)):

    stream_key = f"{current_user.id}-{uuid.uuid4().hex[:16]}"

    new_stream = models.Stream(
        title=stream.title,
        description=stream.description,
        user_id=current_user.id,
        thumbnail=stream.thumbnail,
        is_live=False,
        stream_key=stream_key
    )
    db.add(new_stream)
    db.commit()
    db.refresh(new_stream)
    return new_stream

@router.get("/streams/redirect/{stream_id}")
async def get_hls_redirect(stream_id: int, db: Session = Depends(get_db)):
    stream = db.query(models.Stream).filter(models.Stream.id == stream_id).first()
    if not stream or not stream.is_live:
        raise HTTPException(status_code=404, detail="Stream not found")

    hls_url = f"/hls/live/{stream.stream_key}/index.m3u8"
    return RedirectResponse(url=hls_url)

@router.put("/streams/{stream_id}", response_model=schemas.StreamResponse)
def update_stream(
    stream_id: int,
    stream_update: schemas.StreamCreate,
    db: Session = Depends(get_db),
    current_user: int = Depends(oauth2.get_current_user)
):
    stream = db.query(models.Stream).filter(models.Stream.id == stream_id).first()
    
    if not stream:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stream not found")
    
    if stream.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this stream")
    
    if stream_update.thumbnail is not None:
        if not stream_update.thumbnail and stream.thumbnail:
            delete_old_file(stream.thumbnail)
        elif stream_update.thumbnail and stream.thumbnail and stream_update.thumbnail != stream.thumbnail:
            delete_old_file(stream.thumbnail)

    if stream_update.title is not None:
        stream.title = stream_update.title
    if stream_update.description is not None:
        stream.description = stream_update.description
    if stream_update.thumbnail is not None:
        stream.thumbnail = stream_update.thumbnail
    
    db.commit()
    db.refresh(stream)
    
    return stream

@router.delete("/streams/{stream_id}")
def delete_stream(
    stream_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(oauth2.get_current_user)
):
    stream = db.query(models.Stream).filter(models.Stream.id == stream_id).first()
    
    if not stream:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stream not found")
    
    if stream.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this stream")
    
    if stream.thumbnail:
        delete_old_file(stream.thumbnail)
    
    db.delete(stream)
    db.commit()
    
    return {"message": "Stream deleted successfully"}

@router.websocket("/ws/streams/{stream_id}/viewer")
async def websocket_viewer_tracking(
    websocket: WebSocket,
    stream_id: int,
    token: str = Query(None)
):
    current_user = None
    if token:
        with SessionLocal() as db:
            try:
                current_user = await oauth2.get_current_user_ws(token, db)
            except Exception:
                pass

    with SessionLocal() as db:
        stream = db.query(models.Stream).filter(models.Stream.id == stream_id).first()
        if not stream:
            await websocket.close(code=1008)
            return

    await websocket.accept()

    if current_user:
        with SessionLocal() as db:
            await viewer_manager.add_viewer(stream_id, current_user.id, db)

    viewer_count = len(viewer_manager.active_viewers.get(stream_id, set()))
    await websocket.send_json({
        "type": "viewer_count_update",
        "data": {"viewer_count": viewer_count}
    })

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        if current_user:
            with SessionLocal() as db:
                await viewer_manager.remove_viewer(stream_id, current_user.id, db)

@router.get("/streams/user/{user_id}/current", response_model=schemas.StreamResponse)
def get_user_current_stream(
    user_id: int,
    db: Session = Depends(get_db)
):
    stream = db.query(models.Stream).filter(
        models.Stream.user_id == user_id,
        models.Stream.is_live == True
    ).first()

    if not stream:
        raise HTTPException(status_code=404, detail="No live stream found")

    return stream
