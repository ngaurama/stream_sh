# ./models.py
from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    Boolean,
    TIMESTAMP,
    text,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base


# USERS
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), nullable=False, unique=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    profile_picture = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"), nullable=False)

    streams = relationship("Stream", back_populates="owner", cascade="all, delete")
    following = relationship(
        "Follow",
        foreign_keys="[Follow.follower_id]",
        cascade="all, delete"
    )
    followers = relationship(
        "Follow",
        foreign_keys="[Follow.followed_id]",
        cascade="all, delete"
    )
    chats = relationship("Chat", back_populates="user", cascade="all, delete")

# STREAMS
class Stream(Base):
    __tablename__ = "streams"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(String, nullable=True)
    is_live = Column(Boolean, nullable=False, default=False)
    thumbnail = Column(String, nullable=True)
    started_at = Column(TIMESTAMP(timezone=True))
    ended_at = Column(TIMESTAMP(timezone=True))
    stream_key = Column(String, nullable=False, unique=True)

    owner = relationship("User", back_populates="streams")
    chat_messages = relationship("Chat", back_populates="stream", cascade="all, delete")

class StreamViewer(Base):
    __tablename__ = "stream_viewers"
    
    id = Column(Integer, primary_key=True)
    stream_id = Column(Integer, ForeignKey("streams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    joined_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"), nullable=False)
    
    __table_args__ = (
        UniqueConstraint("stream_id", "user_id", name="unique_stream_viewer"),
    )
    
    stream = relationship("Stream")
    user = relationship("User")


# FOLLOWS
class Follow(Base):
    __tablename__ = "follows"
    __table_args__ = (
        UniqueConstraint("follower_id", "followed_id", name="unique_follow"),
    )

    id = Column(Integer, primary_key=True)
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    followed_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"), nullable=False)


# CHATS
class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True)
    stream_id = Column(Integer, ForeignKey("streams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(String, nullable=False)
    timestamp = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"), nullable=False)

    user = relationship("User", back_populates="chats")
    stream = relationship("Stream", back_populates="chat_messages")


# CHAT BANS
class ChatBan(Base):
    __tablename__ = "chat_bans"

    id = Column(Integer, primary_key=True)
    streamer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    banned_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reason = Column(String, nullable=True)
    banned_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"), nullable=False)

    __table_args__ = (
        UniqueConstraint("streamer_id", "banned_user_id", name="unique_streamer_ban"),
    )




# ╲⎝⧹༼◕ ͜ﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞﱞo.◕ ༽⧸⎠╱⧸
