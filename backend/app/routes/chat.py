# ./routes/chat.py
import json
from fastapi import Query, status, Depends, HTTPException, APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import SessionLocal, get_db
from app.routes import oauth2

router = APIRouter(
    tags=["Chats"]
)


@router.get("/streams/{stream_id}/chat", response_model=list[schemas.ChatResponse])
def get_chat_history(stream_id: int, db: Session = Depends(get_db)):
    stream = db.query(models.Stream).filter(models.Stream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stream not found")

    chats = (
        db.query(models.Chat)
        .filter(models.Chat.stream_id == stream_id)
        .order_by(models.Chat.timestamp.asc())
        .limit(100).offset(0)
    )
    return chats

@router.delete("/chats/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat_message(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(oauth2.get_current_user)
):
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()

    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat message not found")

    stream = db.query(models.Stream).filter(models.Stream.id == chat.stream_id).first()

    if not stream:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stream not found")

    if stream.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this message"
        )

    db.delete(chat)
    db.commit()
    return {"detail": "Chat deleted successfully"}




# websocet 

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, list[tuple[WebSocket, int]]] = {}

    async def connect(self, stream_id: int, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if stream_id not in self.active_connections:
            self.active_connections[stream_id] = []
        self.active_connections[stream_id].append((websocket, user_id))

    def disconnect(self, stream_id: int, websocket: WebSocket):
        if stream_id in self.active_connections:
            # Find and remove the exact (websocket, user_id) tuple
            connection_to_remove = None
            for connection in self.active_connections[stream_id]:
                if connection[0] == websocket:
                    connection_to_remove = connection
                    break
            
            if connection_to_remove:
                self.active_connections[stream_id].remove(connection_to_remove)
                
            if not self.active_connections[stream_id]:
                del self.active_connections[stream_id]
    # def disconnect(self, stream_id: int, websocket: WebSocket):
    #     self.active_connections[stream_id].remove((websocket, next(uid for ws, uid in self.active_connections[stream_id] if ws == websocket)))
    #     if not self.active_connections[stream_id]:
    #         del self.active_connections[stream_id]

    async def broadcast(self, stream_id: int, message: dict):
        if stream_id in self.active_connections:
            for websocket, _ in self.active_connections[stream_id]:
                await websocket.send_json(message)

    async def disconnect_banned_user(self, db: Session, streamer_id: int, banned_user_id: int):
        from ..models import Stream
        streams = db.query(Stream).filter(Stream.user_id == streamer_id).all()
        for stream in streams:
            if stream.id in self.active_connections:
                for websocket, user_id in list(self.active_connections[stream.id]):
                    if user_id == banned_user_id:
                        await websocket.close(code=1008)
                        self.active_connections[stream.id].remove((websocket, user_id))

manager = ConnectionManager()

@router.websocket("/ws/streams/{stream_id}/chat")
async def websocket_chat(websocket: WebSocket, stream_id: int, token: str = Query(...)):
    db = SessionLocal()
    try:
        current_user = await oauth2.get_current_user_ws(token, db)
    except Exception:
        db.close()
        await websocket.close(code=1008)
        return

    stream = db.query(models.Stream).filter(models.Stream.id == stream_id).first()
    if not stream:
        db.close()
        await websocket.close(code=1008)
        return

    banned = db.query(models.ChatBan).filter(
        models.ChatBan.streamer_id == stream.user_id,
        models.ChatBan.banned_user_id == current_user.id
    ).first()
    if banned:
        db.close()
        await websocket.close(code=1008)
        return

    db.close()

    await manager.connect(stream_id, websocket, current_user.id)

    try:
        while True:
            data = await websocket.receive_json()
            message_text = data.get("data", {}).get("message", "").strip()

            if not message_text:
                continue

            db = SessionLocal()
            try:
                new_chat = models.Chat(
                    stream_id=stream_id,
                    user_id=current_user.id,
                    message=message_text
                )
                db.add(new_chat)
                db.commit()
                db.refresh(new_chat)
            finally:
                db.close()

            await manager.broadcast(
                stream_id,
                {
                    "type": "chat_message",
                    "data": {
                        "id": new_chat.id,
                        "user_id": current_user.id,
                        "username": current_user.username,
                        "message": message_text,
                        "timestamp": new_chat.timestamp.isoformat(),
                    }
                }
            )

    except WebSocketDisconnect:
        manager.disconnect(stream_id, websocket)

# bans

@router.post("/bans", response_model=schemas.ChatBanResponse)
async def ban_user(
    ban_data: schemas.ChatBanBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    existing_ban = db.query(models.ChatBan).filter(
        models.ChatBan.streamer_id == current_user.id,
        models.ChatBan.banned_user_id == ban_data.banned_user_id
    ).first()

    if existing_ban:
        raise HTTPException(status_code=400, detail="User already banned")

    new_ban = models.ChatBan(
        streamer_id=current_user.id,
        banned_user_id=ban_data.banned_user_id,
        reason=ban_data.reason
    )
    db.add(new_ban)
    db.commit()
    db.refresh(new_ban)

    await manager.disconnect_banned_user(db, current_user.id, ban_data.banned_user_id)

    return new_ban


@router.delete("/bans/{banned_user_id}", status_code=status.HTTP_204_NO_CONTENT)
def unban_user(
    banned_user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    ban = db.query(models.ChatBan).filter(
        models.ChatBan.streamer_id == current_user.id,
        models.ChatBan.banned_user_id == banned_user_id
    ).first()

    if not ban:
        raise HTTPException(status_code=404, detail="User is not banned")

    db.delete(ban)
    db.commit()
    return {"detail": "User unbanned successfully"}


@router.get("/bans", response_model=list[schemas.ChatBanResponse])
def get_banned_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    bans = db.query(models.ChatBan).filter(models.ChatBan.streamer_id == current_user.id).all()
    return bans
