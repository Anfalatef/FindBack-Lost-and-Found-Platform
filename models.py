from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func,Boolean
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    full_name: Mapped[str] = mapped_column(
        String(100)
    )

    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        index=True
    )

    password_hash: Mapped[str] = mapped_column(
        String(255)
    )

    role: Mapped[str] = mapped_column(
        String(20),
        default="user"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now()
    )


class ItemReport(Base):
    __tablename__ = "item_reports"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id")
    )

    report_type: Mapped[str] = mapped_column(
        String(20)
    )

    item_name: Mapped[str] = mapped_column(
        String(100)
    )

    category: Mapped[str] = mapped_column(
        String(50)
    )

    description: Mapped[str] = mapped_column(
        Text
    )

    color: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    location: Mapped[str] = mapped_column(
        String(200)
    )

    item_date: Mapped[datetime] = mapped_column(
        DateTime
    )

    image_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="open"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now()
    )


class ReportImageEmbedding(Base):
    """Internal visual fingerprint for a report image.

    It lives in a separate table so existing FindBack databases can be
    upgraded safely by ``Base.metadata.create_all`` without altering the
    current ``item_reports`` table.
    """

    __tablename__ = "report_image_embeddings"

    report_id: Mapped[int] = mapped_column(
        ForeignKey("item_reports.id", ondelete="CASCADE"),
        primary_key=True
    )

    embedding: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    model_name: Mapped[str] = mapped_column(
        String(100),
        default="clip-ViT-B-32",
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now()
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )

class ContactRequest(Base):
    __tablename__ = "contact_requests"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    sender_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    receiver_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    lost_report_id: Mapped[int] = mapped_column(
        ForeignKey("item_reports.id", ondelete="CASCADE"),
        nullable=False
    )

    found_report_id: Mapped[int] = mapped_column(
        ForeignKey("item_reports.id", ondelete="CASCADE"),
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now()
    )

    responded_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )   
class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    conversation_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    contact_request_id: Mapped[int | None] = mapped_column(
        ForeignKey("contact_requests.id", ondelete="CASCADE"),
        unique=True,
        nullable=True
    )

    user_one_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    user_two_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    report_id: Mapped[int | None] = mapped_column(
        ForeignKey("item_reports.id", ondelete="SET NULL"),
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="active",
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now()
    )

    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    conversation_id: Mapped[int] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False
    )

    sender_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    is_read: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now()
    )

class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    notification_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    title: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    reference_id: Mapped[int | None] = mapped_column(
        nullable=True
    )

    is_read: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now()
    )    
