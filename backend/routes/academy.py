import os
import json
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.security import HTTPBearer
from typing import Dict
from middleware import verify_user
from db.connection import get_session
from sqlalchemy.orm import Session

# Constants
COURSES_DIR = "assets/academy/courses/"
PROGRESS_DIR = "assets/academy/progress/"

security = HTTPBearer()
academy_route = APIRouter(prefix="/academy", tags=["Academy"])


@academy_route.get("/courses")
def list_courses(
    req: Request,
    session: Session = Depends(get_session),
    credentials=Depends(security),
):
    """List all available courses by scanning the courses directory."""
    verify_user(session=session, authenticated=req.state.authenticated)

    if not os.path.exists(COURSES_DIR):
        return []

    courses = []
    for filename in os.listdir(COURSES_DIR):
        if filename.endswith(".json"):
            with open(os.path.join(COURSES_DIR, filename), "r") as f:
                course_data = json.load(f)
                courses.append(
                    {
                        "id": course_data.get("courseId"),
                        "title": course_data.get("title"),
                        "chapterCount": len(course_data.get("chapters", [])),
                        "description": (
                            f"Learn about {course_data.get('title')}."
                        ),
                    }
                )
    return courses


@academy_route.get("/progress")
def get_progress(
    req: Request,
    session: Session = Depends(get_session),
    credentials=Depends(security),
):
    """Retrieve progress for the current authenticated user."""
    user = verify_user(session=session, authenticated=req.state.authenticated)
    user_id = user.id

    progress_path = os.path.join(PROGRESS_DIR, f"{user_id}.json")
    if not os.path.exists(progress_path):
        return {}

    with open(progress_path, "r") as f:
        data = json.load(f)

        # Backward compatibility / Data normalization
        normalized = {}
        for course_id, p in data.items():
            # If it's the old flat structure (missing course_id),
            # migrate to new schema
            if "course_id" not in p:
                normalized[course_id] = {
                    "course_id": course_id,
                    "current_chapter_id": p.get("lastChapterId"),
                    "completed_chapters": (
                        [p.get("lastChapterId")] if p.get("completed") else []
                    ),
                    "quiz_scores": (
                        {p.get("lastChapterId"): p.get("score")}
                        if p.get("score") is not None
                        else {}
                    ),
                    "is_completed": p.get("completed", False),
                }
            else:
                normalized[course_id] = p

        return normalized


@academy_route.post("/progress")
def sync_progress(
    req: Request,
    payload: Dict,
    session: Session = Depends(get_session),
    credentials=Depends(security),
):
    """Sync progress for the current authenticated user."""
    user = verify_user(session=session, authenticated=req.state.authenticated)
    user_id = user.id

    os.makedirs(PROGRESS_DIR, exist_ok=True)
    progress_path = os.path.join(PROGRESS_DIR, f"{user_id}.json")

    # Load existing progress or start new
    current_progress = {}
    if os.path.exists(progress_path):
        with open(progress_path, "r") as f:
            current_progress = json.load(f)

    # Update progress for this specific course using the new schema
    course_id = payload.get("course_id")
    if not course_id:
        raise HTTPException(status_code=400, detail="course_id is required")

    # Build the record based on the payload
    current_progress[course_id] = {
        "course_id": course_id,
        "current_chapter_id": payload.get("current_chapter_id"),
        "current_section_index": payload.get("current_section_index", 0),
        "completed_chapters": payload.get("completed_chapters", []),
        "quiz_scores": payload.get("quiz_scores", {}),
        "is_completed": payload.get("is_completed", False),
        "timestamp": payload.get("timestamp"),
    }

    with open(progress_path, "w") as f:
        json.dump(current_progress, f, indent=4)

    return {"status": "success", "progress": current_progress[course_id]}
