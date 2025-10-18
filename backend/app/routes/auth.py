# ./routes/auth.py
from fastapi import status, Depends, HTTPException, APIRouter
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_
from passlib.context import CryptContext
from app import models, schemas
from app.database import get_db
from app.routes import oauth2
from app.routes.upload import delete_old_file

router = APIRouter(
    prefix="/auth",
    tags=["User"]
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/login", response_model=schemas.Token)
def get_posts(user: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(
        or_(
            models.User.username == user.username,
            models.User.email == user.username
        )
    ).first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not found")
    
    if not pwd_context.verify(user.password, db_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid password")
    
    access_token = oauth2.create_access_token(data = {"user_id" : db_user.id})
    return {"access_token" : access_token, "token_type": "bearer"}


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=schemas.Token)
def create_posts(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(
        (models.User.username == user.username) | (models.User.email == user.email)
    ).first()

    if existing_user:
        if existing_user.username == user.username:
            raise HTTPException(status_code=400, detail="Username already taken")
        else:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = oauth2.create_access_token(data = {"user_id" : new_user.id})
    return {"access_token" : access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserResponse)
def get_current_user(user: models.User = Depends(oauth2.get_current_user)):
    return user


@router.put("/me", response_model=schemas.UserResponse)
def update_user(
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    if user_update.username and user_update.username != current_user.username:
        existing_user = db.query(models.User).filter(
            models.User.username == user_update.username
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
    
    if user_update.username is not None:
        current_user.username = user_update.username
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    
    if current_user.profile_picture:
        delete_old_file(current_user.profile_picture)
    
    user_streams = db.query(models.Stream).filter(models.Stream.user_id == current_user.id).all()
    for stream in user_streams:
        if stream.thumbnail:
            delete_old_file(stream.thumbnail)

    db.delete(current_user)
    db.commit()
    return
