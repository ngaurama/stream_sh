import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.routes import oauth2
from app.schemas import FileUploadResponse
from app import models

router = APIRouter(
    prefix="/upload",
    tags=["Upload"]
)

UPLOAD_DIR = "uploads"
PROFILE_PICTURES_DIR = f"{UPLOAD_DIR}/profile_pictures"
STREAM_THUMBNAILS_DIR = f"{UPLOAD_DIR}/thumbnails"

os.makedirs(PROFILE_PICTURES_DIR, exist_ok=True)
os.makedirs(STREAM_THUMBNAILS_DIR, exist_ok=True)

ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/gif"]
MAX_FILE_SIZE = 5 * 1024 * 1024

def delete_old_file(file_path: str):
    if file_path and file_path.startswith('/uploads/'):
        full_path = file_path.lstrip('/')
        if os.path.exists(full_path) and os.path.isfile(full_path):
            try:
                os.remove(full_path)
                print(f"Deleted old file: {full_path}")
            except Exception as e:
                print(f"Error deleting file {full_path}: {e}")

@router.post("/profile-picture", response_model=FileUploadResponse)
async def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: int = Depends(oauth2.get_current_user)
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")

    if current_user.profile_picture:
        delete_old_file(current_user.profile_picture)

    file_extension = file.filename.split('.')[-1]
    filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}.{file_extension}"
    file_path = os.path.join(PROFILE_PICTURES_DIR, filename)
    
    with open(file_path, "wb") as f:
        f.write(contents)
    
    current_user.profile_picture = f"/{file_path}"
    db.commit()
    
    return FileUploadResponse(
        filename=filename,
        url=f"/{file_path}",
        message="Profile picture uploaded successfully"
    )

@router.post("/stream-thumbnail", response_model=FileUploadResponse)
async def upload_stream_thumbnail(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: int = Depends(oauth2.get_current_user)
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
    
    file_extension = file.filename.split('.')[-1]
    filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}.{file_extension}"
    file_path = os.path.join(STREAM_THUMBNAILS_DIR, filename)
    
    with open(file_path, "wb") as f:
        f.write(contents)
    
    db.commit()
    
    return FileUploadResponse(
        filename=filename,
        url=f"/{file_path}",
        message="Stream thumbnail uploaded successfully"
    )

@router.delete("/profile-picture")
async def delete_profile_picture(
    db: Session = Depends(get_db),
    current_user: int = Depends(oauth2.get_current_user)
):
    if not current_user.profile_picture:
        raise HTTPException(status_code=400, detail="No profile picture to delete")
    
    delete_old_file(current_user.profile_picture)
    current_user.profile_picture = None
    db.commit()
    
    return {"message": "Profile picture deleted successfully"}

@router.delete("/stream-thumbnail")
async def delete_stream_thumbnail(
    stream_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(oauth2.get_current_user)
):
    stream = db.query(models.Stream).filter(
        models.Stream.id == stream_id,
        models.Stream.user_id == current_user.id
    ).first()
    
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    if not stream.thumbnail:
        raise HTTPException(status_code=400, detail="No thumbnail to delete")
    
    delete_old_file(stream.thumbnail)
    stream.thumbnail = None
    db.commit()
    
    return {"message": "Stream thumbnail deleted successfully"}
