import random
from faker import Faker
from datetime import datetime, timedelta
from .schemas import StreamResponse, UserResponse
from fastapi import APIRouter


fake = Faker()

def generate_mock_streams(n=5):
    streams = []
    for i in range(1, n + 1):
        owner = UserResponse(
            id=i,
            username=fake.user_name(),
            email=fake.email(),
            profile_picture=f"https://picsum.photos/id/{random.randint(1, 200)}/200",
            created_at=fake.date_time_this_year()
        )
        streams.append(StreamResponse(
            id=i,
            title=fake.catch_phrase(),
            thumbnail=f"https://picsum.photos/id/{random.randint(1, 200)}/500/300",
            description=fake.text(max_nb_chars=100),
            is_live=fake.boolean(50),
            viewer_count=random.randint(10, 100000),
            started_at=datetime.now() - timedelta(hours=fake.random_int(1, 5)),
            owner=owner
        ))
    return streams

router = APIRouter()

@router.get("/mock/streams", response_model=list[StreamResponse])
async def get_mock_streams():
    return generate_mock_streams(10)
