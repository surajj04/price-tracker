from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from crud.notification import get_notification_by_user, read_notification_by_id, read_all_notifications, get_latest_notification
from database import get_db

router = APIRouter(prefix="/notification", tags=["Notification"])


@router.get("/latest")
def get_latest_notifications(user_id: int, db: Session = Depends(get_db)):
    return get_latest_notification(db, user_id)

@router.get("/")
def get_notifications(user_id: int, db: Session = Depends(get_db)):
    return get_notification_by_user(db, user_id)

@router.patch("/{notification_id}/read")
def read_notification(notification_id: int,db: Session = Depends(get_db)):
    notification = read_notification_by_id(db, notification_id)

    if notification is None:
        raise HTTPException(status_code=404,detail="Notification not found")

    return notification


@router.patch("/read-all/{user_id}")
def mark_all_notifications_as_read(user_id: int,db: Session = Depends(get_db)):
    try:
        updated_count = read_all_notifications(db, user_id)
        return {
            "message": "All notifications marked as read",
            "updated_count": updated_count
        }
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to update notifications"
        )