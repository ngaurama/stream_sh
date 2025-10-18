#./schemas.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, computed_field

# USER
class UserBase(BaseModel):
    username: str
    email: EmailStr
    profile_picture: Optional[str] = None

    class Config:
        from_attributes = True

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class FileUploadResponse(BaseModel):
    filename: str
    url: str
    message: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    id: Optional[int] = None


# STREAM
class StreamBase(BaseModel):
    title: str
    description: Optional[str] = None
    thumbnail: Optional[str] = None


class StreamCreate(StreamBase):
    pass

class StreamResponse(StreamBase):
    id: int
    is_live: bool
    viewer_count: Optional[int] = 0
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    owner: UserResponse

    class Config:
        from_attributes = True

    @computed_field
    @property
    def hls_url(self) -> str:
        return f"/hls/live/{self.id}/index.m3u8"


class StreamWithKeyResponse(StreamResponse):
    stream_key: str


# CHAT
class ChatBase(BaseModel):
    message: str

class ChatCreate(ChatBase):
    stream_id: int

class ChatResponse(ChatBase):
    id: int
    stream_id: int
    timestamp: datetime
    user: UserResponse

    class Config:
        from_attributes = True

class FollowResponse(BaseModel):
    follower_id: int
    followed_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ChatBanBase(BaseModel):
    banned_user_id: int
    reason: Optional[str] = None

class ChatBanResponse(ChatBanBase):
    streamer_id: int
    banned_at: datetime

    class Config:
        from_attributes = True
