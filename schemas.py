from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# بيانات إنشاء مستخدم جديد
class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str


# بيانات المستخدم التي تظهر في الاستجابة
class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# بيانات تسجيل الدخول
class UserLogin(BaseModel):
    email: str
    password: str


# بيانات إنشاء بلاغ جديد
class ItemReportCreate(BaseModel):
    report_type: Literal["lost", "found"]
    item_name: str
    category: str
    description: str
    color: str | None = None
    location: str
    item_date: datetime
    image_url: str | None = None


# بيانات البلاغ التي تظهر في الاستجابة
class ItemReportResponse(BaseModel):
    id: int
    user_id: int
    report_type: str
    item_name: str
    category: str
    description: str
    color: str | None
    location: str
    item_date: datetime
    image_url: str | None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# بيانات البلاغ المطابق مع نسبة التطابق
class ItemReportMatchResponse(ItemReportResponse):
    match_score: int
    text_score: int
    visual_score: int | None = None
    match_method: Literal["text", "hybrid"] = "text"
    match_reasons: list[str] = Field(default_factory=list)


# البيانات التي يمكن تعديلها في البلاغ
class ItemReportUpdate(BaseModel):
    report_type: Literal["lost", "found"] | None = None
    item_name: str | None = None
    category: str | None = None
    description: str | None = None
    color: str | None = None
    location: str | None = None
    item_date: datetime | None = None
    image_url: str | None = None
    status: Literal["open", "resolved"] | None = None
class ReportStatusUpdate(BaseModel):
    status: str

class ContactRequestCreate(BaseModel):
    requester_report_id: int
    matched_report_id: int


class ContactRequestStatusUpdate(BaseModel):
    status: Literal["accepted", "rejected"]


class ContactRequestResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    lost_report_id: int
    found_report_id: int
    status: str
    created_at: datetime
    responded_at: datetime | None

    model_config = ConfigDict(from_attributes=True)

class ConversationResponse(BaseModel):
    id: int
    conversation_type: str
    contact_request_id: int | None
    user_one_id: int
    user_two_id: int
    report_id: int | None
    status: str
    created_at: datetime
    closed_at: datetime | None

    other_user_name: str | None = None
    last_message: str | None = None
    unread_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    is_read: bool
    created_at: datetime

    sender_name: str | None = None

    model_config = ConfigDict(from_attributes=True)

class SupportConversationCreate(BaseModel):
    report_id: int | None = None
    message: str


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    notification_type: str
    title: str
    content: str
    reference_id: int | None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)    
