from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session
from models.notification import Notification
from schema.notification import NotificationCreate


def push_new_notification(db: Session, notification_data: NotificationCreate):
    notification = Notification(
        user_id=notification_data.user_id,
        target_price=notification_data.target_price,
        product_price=notification_data.product_price,
        title=notification_data.title,
        message=notification_data.message,
        type=notification_data.type,
        is_read=notification_data.is_read,
        read_at=notification_data.read_at,
        action_url=notification_data.action_url,
    )

    try:
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    except IntegrityError as e:
        db.rollback()

        print("DATABASE INTEGRITY ERROR:", repr(e.orig))

        raise HTTPException(
            status_code=409,
            detail="A database integrity constraint was violated.",
        )

    except SQLAlchemyError as e:
        db.rollback()

        print("DATABASE ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail="Failed to create notification.",
        )


def get_notification_by_user(db: Session, user_id: int):
    notifications = db.query(Notification).filter(Notification.user_id == user_id).all()
    return notifications


def get_latest_notification(db: Session, user_id: int):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(5)
        .all()
    )
    return notifications


def read_notification_by_id(db: Session, notification_id):
    notification = (
        db.query(Notification).filter(Notification.id == notification_id).first()
    )

    if notification is None:
        return None

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification


def read_all_notifications(db: Session, user_id: int):
    notifications = db.query(Notification).filter(Notification.user_id == user_id).all()

    if not notifications:
        return []

    for notification in notifications:
        notification.is_read = True

    db.commit()

    return notifications
