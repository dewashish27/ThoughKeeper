from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user_id
from db import get_db


router = APIRouter(
    prefix="/thoughts",
    tags=["thoughts"],
)


# ============================================================
# ENUMS
# ============================================================

class Mood(str, Enum):
    HAPPY = "happy"
    CALM = "calm"
    EXCITED = "excited"
    NEUTRAL = "neutral"
    SAD = "sad"
    FRUSTRATED = "frustrated"
    ANXIOUS = "anxious"
    MOTIVATED = "motivated"
    TIRED = "tired"


class ThoughtStatus(str, Enum):
    NEW = "new"
    VIEWED = "viewed"
    IMPORTANT = "important"
    MISSION = "mission"
    ACTED = "acted"
    CONVERTED = "converted"


# ============================================================
# REQUEST MODELS
# ============================================================

class ThoughtCreate(BaseModel):
    text: str = Field(
        min_length=1,
        max_length=2000,
    )
    mood: Mood | None = None
    attachment_url: str | None = None
    attachment_type: str | None = None


class ThoughtUpdate(BaseModel):
    text: str | None = Field(
        default=None,
        min_length=1,
        max_length=2000,
    )
    mood: Mood | None = None
    status: ThoughtStatus | None = None


# ============================================================
# CREATE THOUGHT
# ============================================================

@router.post("")
async def create_thought(
    body: ThoughtCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("""
            INSERT INTO public.thoughts
                (
                    user_id,
                    text,
                    mood,
                    attachment_url,
                    attachment_type
                )
            VALUES
                (
                    :user_id,
                    :text,
                    :mood,
                    :attachment_url,
                    :attachment_type
                )
            RETURNING
                id,
                text,
                mood,
                status,
                captured_at,
                attachment_url,
                attachment_type
        """),
        {
            "user_id": user_id,
            "text": body.text,
            "mood": body.mood.value if body.mood else None,
            "attachment_url": body.attachment_url,
            "attachment_type": body.attachment_type,
        },
    )

    row = result.mappings().one()

    await db.commit()

    return dict(row)


# ============================================================
# GET THOUGHTS
# ============================================================

@router.get("")
async def get_thoughts(
    limit: int = Query(
        default=50,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("""
            SELECT
                id,
                text,
                mood,
                status,
                captured_at,
                attachment_url,
                attachment_type
            FROM public.thoughts
            WHERE user_id = :user_id
            ORDER BY captured_at DESC
            LIMIT :limit
            OFFSET :offset
        """),
        {
            "user_id": user_id,
            "limit": limit,
            "offset": offset,
        },
    )

    rows = result.mappings().all()

    return [dict(row) for row in rows]


# ============================================================
# GET SINGLE THOUGHT
# ============================================================

@router.get("/{thought_id}")
async def get_thought(
    thought_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("""
            SELECT
                id,
                text,
                mood,
                status,
                captured_at,
                attachment_url,
                attachment_type
            FROM public.thoughts
            WHERE id = :thought_id
              AND user_id = :user_id
        """),
        {
            "thought_id": thought_id,
            "user_id": user_id,
        },
    )

    row = result.mappings().one_or_none()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Thought not found",
        )

    return dict(row)


# ============================================================
# UPDATE THOUGHT
# ============================================================

@router.patch("/{thought_id}")
async def update_thought(
    thought_id: str,
    body: ThoughtUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    updates = body.model_dump(
        exclude_unset=True,
    )

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No fields to update",
        )

    # Convert Enum values to their actual string values
    # before sending them to PostgreSQL.
    if "mood" in updates and updates["mood"] is not None:
        updates["mood"] = updates["mood"].value

    if "status" in updates and updates["status"] is not None:
        updates["status"] = updates["status"].value

    set_parts = []

    params = {
        "thought_id": thought_id,
        "user_id": user_id,
    }

    for field, value in updates.items():
        set_parts.append(
            f"{field} = :{field}"
        )
        params[field] = value

    query = f"""
        UPDATE public.thoughts
        SET {", ".join(set_parts)}
        WHERE id = :thought_id
          AND user_id = :user_id
        RETURNING
            id,
            text,
            mood,
            status,
            captured_at,
            attachment_url,
            attachment_type
    """

    result = await db.execute(
        text(query),
        params,
    )

    row = result.mappings().one_or_none()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Thought not found",
        )

    await db.commit()

    return dict(row)