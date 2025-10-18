# ./routes/follows.py
from fastapi import status, Depends, HTTPException, APIRouter
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.routes import oauth2

router = APIRouter(
    prefix="/users",
    tags=["Follows"]
)


@router.post("/{user_id}/follow", response_model=schemas.FollowResponse, status_code=status.HTTP_201_CREATED)
def follow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(oauth2.get_current_user)
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot follow yourself"
        )

    user_to_follow = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_follow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )

    existing_follow = db.query(models.Follow).filter(
        models.Follow.follower_id == current_user.id,
        models.Follow.followed_id == user_id
    ).first()

    if existing_follow:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already following this user"
        )

    new_follow = models.Follow(
        follower_id=current_user.id,
        followed_id=user_id
    )

    db.add(new_follow)
    db.commit()
    db.refresh(new_follow)

    return new_follow


@router.delete("/{user_id}/unfollow", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(oauth2.get_current_user)
):
    follow = db.query(models.Follow).filter(
        models.Follow.follower_id == current_user.id,
        models.Follow.followed_id == user_id
    ).first()

    if not follow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not following this user"
        )

    db.delete(follow)
    db.commit()

    return {"detail": "Successfully unfollowed user"}

@router.get("/{user_id}/follow-status")
def get_follow_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(oauth2.get_current_user)
):
    follow = db.query(models.Follow).filter(
        models.Follow.follower_id == current_user.id,
        models.Follow.followed_id == user_id
    ).first()

    return {"is_following": follow is not None}

@router.get("/{user_id}/followers/count")
def get_followers_count(
    user_id: int,
    db: Session = Depends(get_db)
):
    count = db.query(models.Follow).filter(
        models.Follow.followed_id == user_id
    ).count()

    return {"count": count}

@router.get("/{user_id}/following/count")
def get_following_count(
    user_id: int,
    db: Session = Depends(get_db)
):
    count = db.query(models.Follow).filter(
        models.Follow.follower_id == user_id
    ).count()

    return {"count": count}

@router.get("/me/following", response_model=list[schemas.UserResponse])
def get_following_users(
    db: Session = Depends(get_db),
    current_user: int = Depends(oauth2.get_current_user)
):
    following = db.query(models.User).join(
        models.Follow,
        models.Follow.followed_id == models.User.id
    ).filter(
        models.Follow.follower_id == current_user.id
    ).all()

    return following

@router.get("/{user_id}/followers", response_model=list[schemas.UserResponse])
def get_user_followers(
    user_id: int,
    db: Session = Depends(get_db)
):
    followers = db.query(models.User).join(
        models.Follow,
        models.Follow.follower_id == models.User.id
    ).filter(
        models.Follow.followed_id == user_id
    ).all()

    return followers
