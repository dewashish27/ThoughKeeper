from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth import get_current_user_id
from db import test_database_connection
from routers.thoughts import router as thoughts_router


app = FastAPI(title="ThoughtKeeper API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://thoughtkeeper-ebon.vercel.app",
        "https://thoughtkeeper-h1ojrdsf-thought-keeper.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(thoughts_router)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/health/database")
async def database_health():
    result = await test_database_connection()

    return {
        "status": "ok",
        "database": result == 1,
    }


@app.get("/auth/test")
async def auth_test(
    user_id: str = Depends(get_current_user_id),
):
    return {
        "authenticated": True,
        "user_id": user_id,
    }