from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models.profile import Profile
from app.models.station import Station
from app.schemas.profile import CurrentUser, ProfileResponse, ProfileUpdate

router = APIRouter()

@router.get("/me", response_model=CurrentUser)
def get_me(current_user: CurrentUser = Depends(get_current_user)):
    """
    Verifies the Supabase Bearer token and returns the authenticated user identity.
    """
    return current_user

@router.get("/profile", response_model=ProfileResponse)
def get_my_profile(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the commuter profile for the authenticated user.
    If the profile does not exist yet (e.g. a user created outside the app),
    it automatically provisions a default profile record.
    """
    profile = db.query(Profile).filter(Profile.id == current_user.id).first()

    if not profile:
        meta = current_user.user_metadata or {}
        email_prefix = current_user.email.split("@")[0] if current_user.email else "Commuter"
        default_name = meta.get("display_name") or meta.get("full_name") or meta.get("name") or email_prefix

        profile = Profile(
            id=current_user.id,
            email=current_user.email or f"{current_user.id}@unknown.com",
            full_name=meta.get("full_name") or meta.get("name"),
            display_name=default_name,
            avatar_url=meta.get("avatar_url") or meta.get("picture"),
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return profile

@router.put("/profile", response_model=ProfileResponse)
def update_my_profile(
    updates: ProfileUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates the authenticated commuter's profile (display name, real name, home/work stations).
    """
    profile = db.query(Profile).filter(Profile.id == current_user.id).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Call GET /api/v1/auth/profile first to provision."
        )

    # Validate home station if explicitly sent
    if "home_station_id" in updates.model_fields_set:
        if updates.home_station_id:
            station = db.query(Station).filter(Station.id == updates.home_station_id).first()
            if not station:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Station with id '{updates.home_station_id}' does not exist"
                )
            profile.home_station_id = updates.home_station_id
        else:
            profile.home_station_id = None

    # Validate work station if explicitly sent
    if "work_station_id" in updates.model_fields_set:
        if updates.work_station_id:
            station = db.query(Station).filter(Station.id == updates.work_station_id).first()
            if not station:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Station with id '{updates.work_station_id}' does not exist"
                )
            profile.work_station_id = updates.work_station_id
        else:
            profile.work_station_id = None

    if "full_name" in updates.model_fields_set:
        profile.full_name = updates.full_name.strip() if updates.full_name else None

    if "display_name" in updates.model_fields_set:
        if updates.display_name is not None and updates.display_name.strip():
            profile.display_name = updates.display_name.strip()
        else:
            # Revert to full name or email prefix if cleared
            profile.display_name = profile.full_name or profile.email.split("@")[0]

    if "avatar_url" in updates.model_fields_set:
        profile.avatar_url = updates.avatar_url.strip() if updates.avatar_url else None

    db.commit()
    db.refresh(profile)
    return profile
