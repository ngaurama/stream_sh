# ./routes/oauth2.py
from fastapi import Depends, status, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database import get_db
from datetime import datetime, timedelta
from app import schemas, models
from app.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

SECRET_KEY = settings.secret_key
ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes

def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt

def verify_access_token(token: str, credentials_exception):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        id: str = payload.get("user_id")

        if id is None:
            raise credentials_exception
        
        token_data = schemas.TokenData(id=id)
    except JWTError:
        raise credentials_exception
    
    return token_data
    
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(status_code=status.HTTP_404_NOT_FOUND, 
        detail="Could not validate credentials", 
        headers={"WWW-Authenticate" : "Bearer"}
    )
    
    token = verify_access_token(token, credentials_exception)
    user = db.query(models.User).filter(token.id == models.User.id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user

async def get_current_user_ws(token: str, db: Session = Depends(get_db)):

    credentials_exception = HTTPException(status_code=status.HTTP_404_NOT_FOUND, 
        detail="Could not validate credentials", 
        headers={"WWW-Authenticate" : "Bearer"}
    )
    token = verify_access_token(token, credentials_exception)
    user = db.query(models.User).filter(token.id == models.User.id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user
