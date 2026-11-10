from pathlib import Path
from uuid import uuid4
from fastapi import (
    Depends,
    FastAPI,
    File,
    HTTPException,
    UploadFile,
    status
)
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import (
    ItemReport,
    ReportImageEmbedding,
    User,
    ContactRequest,
    Conversation,
    Message,
    Notification,
    
)
from schemas import (
    ItemReportCreate,
    ItemReportMatchResponse,
    ReportStatusUpdate,
    ItemReportResponse,
    ItemReportUpdate,
    UserCreate,
    UserLogin,
    UserResponse,
    ContactRequestCreate,
    ContactRequestStatusUpdate,
    ContactRequestResponse,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
    SupportConversationCreate,
    NotificationResponse,
)
from security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password
)
from vision import (
    MODEL_NAME as VISION_MODEL_NAME,
    compare_image_embeddings,
    create_image_embedding,
    runtime_status as vision_runtime_status,
)
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
FRONTEND_DIR = Path("frontend")
FRONTEND_DIR.mkdir(exist_ok=True)

Base.metadata.create_all(bind=engine)

bearer_scheme = HTTPBearer()


app = FastAPI(
    title="FindBack API",
    description="API for reporting and matching lost and found items",
    version="1.0.0"
)
app.mount(
    "/uploads",
    StaticFiles(directory=str(UPLOAD_DIR)),
    name="uploads"
)
app.mount(
    "/frontend",
    StaticFiles(
        directory=str(FRONTEND_DIR),
        html=True
    ),
    name="frontend"
)


def get_local_report_image(image_url: str | None) -> Path | None:
    """Resolve only files inside the controlled uploads directory."""

    if not image_url or not image_url.startswith("/uploads/"):
        return None

    image_path = UPLOAD_DIR / Path(image_url).name
    return image_path if image_path.is_file() else None


def refresh_report_visual_fingerprint(
    db: Session,
    report: ItemReport,
    image_path: Path | None = None
) -> bool:
    """Replace a report fingerprint; return False when vision is unavailable."""

    existing = db.query(ReportImageEmbedding).filter(
        ReportImageEmbedding.report_id == report.id
    ).first()

    if existing is not None:
        db.delete(existing)
        db.flush()

    resolved_image = image_path or get_local_report_image(report.image_url)
    if resolved_image is None:
        return False

    embedding = create_image_embedding(resolved_image)
    if embedding is None:
        return False

    db.add(
        ReportImageEmbedding(
            report_id=report.id,
            embedding=embedding,
            model_name=VISION_MODEL_NAME
        )
    )
    return True


@app.get("/vision/status")
def get_vision_status():
    """Show whether the optional FindBack Vision layer is ready."""

    return vision_runtime_status()

# الحصول على المستخدم الحالي من التوكن
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):
    token_data = decode_access_token(credentials.credentials)

    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    user_id = token_data.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    user = db.query(User).filter(
        User.id == int(user_id)
    ).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user
# التأكد أن المستخدم أدمن
def require_admin(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user
# إنشاء إشعار للمستخدم
def create_notification(
    db: Session,
    user_id: int,
    notification_type: str,
    title: str,
    content: str,
    reference_id: int | None = None
):
    notification = Notification(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        content=content,
        reference_id=reference_id
    )

    db.add(notification)
    return notification
# إرسال طلب تواصل إلى صاحب البلاغ المطابق
@app.post(
    "/contact-requests",
    response_model=ContactRequestResponse,
    status_code=status.HTTP_201_CREATED
)
def create_contact_request(
    request_data: ContactRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # بلاغ المستخدم الذي يرسل الطلب
    requester_report = db.query(ItemReport).filter(
        ItemReport.id == request_data.requester_report_id
    ).first()

    if requester_report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requester report not found"
        )

    # التأكد أن البلاغ يخص المستخدم الحالي
    if requester_report.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only send a request using your own report"
        )

    # البلاغ المطابق
    matched_report = db.query(ItemReport).filter(
        ItemReport.id == request_data.matched_report_id
    ).first()

    if matched_report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Matched report not found"
        )

    # منع التواصل مع النفس
    if matched_report.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot contact yourself"
        )

    # يجب أن يكون أحد البلاغين مفقوداً والآخر معثوراً عليه
    if requester_report.report_type == matched_report.report_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One report must be lost and the other must be found"
        )

    # تحديد البلاغ المفقود والبلاغ المعثور عليه
    if requester_report.report_type == "lost":
        lost_report = requester_report
        found_report = matched_report
    else:
        lost_report = matched_report
        found_report = requester_report

    # منع تكرار طلب التواصل
    existing_request = db.query(ContactRequest).filter(
        ContactRequest.lost_report_id == lost_report.id,
        ContactRequest.found_report_id == found_report.id,
        ContactRequest.status.in_(["pending", "accepted"])
    ).first()

    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A contact request already exists"
        )

    contact_request = ContactRequest(
        sender_id=current_user.id,
        receiver_id=matched_report.user_id,
        lost_report_id=lost_report.id,
        found_report_id=found_report.id,
        status="pending"
    )

    db.add(contact_request)
    db.flush()

    create_notification(
        db=db,
        user_id=matched_report.user_id,
        notification_type="contact_request",
        title="طلب تواصل جديد",
        content=f"لديك طلب تواصل جديد بخصوص {matched_report.item_name}",
        reference_id=contact_request.id
    )

    db.commit()
    db.refresh(contact_request)

    return contact_request
# عرض طلبات التواصل الواردة للمستخدم
@app.get(
    "/contact-requests/incoming",
    response_model=list[ContactRequestResponse]
)
def get_incoming_contact_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    requests = db.query(ContactRequest).filter(
        ContactRequest.receiver_id == current_user.id
    ).order_by(
        ContactRequest.created_at.desc()
    ).all()

    return requests
# عرض طلبات التواصل المرسلة من المستخدم
@app.get(
    "/contact-requests/outgoing",
    response_model=list[ContactRequestResponse]
)
def get_outgoing_contact_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    requests = db.query(ContactRequest).filter(
        ContactRequest.sender_id == current_user.id
    ).order_by(
        ContactRequest.created_at.desc()
    ).all()

    return requests
# قبول أو رفض طلب التواصل
@app.patch(
    "/contact-requests/{request_id}",
    response_model=ContactRequestResponse
)
def update_contact_request_status(
    request_id: int,
    request_data: ContactRequestStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contact_request = db.query(ContactRequest).filter(
        ContactRequest.id == request_id
    ).first()

    if contact_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact request not found"
        )

    # صاحب البلاغ المستقبل فقط يستطيع القبول أو الرفض
    if contact_request.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to respond to this request"
        )

    if contact_request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This request has already been answered"
        )

    contact_request.status = request_data.status
    contact_request.responded_at = func.now()

    if request_data.status == "accepted":
        # إنشاء محادثة خاصة بين المستخدمين
        conversation = Conversation(
            conversation_type="match",
            contact_request_id=contact_request.id,
            user_one_id=contact_request.sender_id,
            user_two_id=contact_request.receiver_id,
            report_id=contact_request.lost_report_id,
            status="active"
        )

        db.add(conversation)
        db.flush()

        create_notification(
            db=db,
            user_id=contact_request.sender_id,
            notification_type="contact_request_accepted",
            title="تم قبول طلب التواصل",
            content="وافق صاحب البلاغ على طلب التواصل، ويمكنك الآن بدء المحادثة.",
            reference_id=conversation.id
        )

    else:
        create_notification(
            db=db,
            user_id=contact_request.sender_id,
            notification_type="contact_request_rejected",
            title="تم رفض طلب التواصل",
            content="لم يوافق صاحب البلاغ على طلب التواصل.",
            reference_id=contact_request.id
        )

    db.commit()
    db.refresh(contact_request)

    return contact_request

# عرض جميع محادثات المستخدم
@app.get(
    "/conversations",
    response_model=list[ConversationResponse]
)
def get_my_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversations = db.query(Conversation).filter(
        or_(
            Conversation.user_one_id == current_user.id,
            Conversation.user_two_id == current_user.id
        )
    ).order_by(
        Conversation.created_at.desc()
    ).all()

    results = []

    for conversation in conversations:
        if conversation.user_one_id == current_user.id:
            other_user_id = conversation.user_two_id
        else:
            other_user_id = conversation.user_one_id

        other_user = db.query(User).filter(
            User.id == other_user_id
        ).first()

        last_message = db.query(Message).filter(
            Message.conversation_id == conversation.id
        ).order_by(
            Message.created_at.desc()
        ).first()

        unread_count = db.query(Message).filter(
            Message.conversation_id == conversation.id,
            Message.sender_id != current_user.id,
            Message.is_read == False
        ).count()

        results.append({
            "id": conversation.id,
            "conversation_type": conversation.conversation_type,
            "contact_request_id": conversation.contact_request_id,
            "user_one_id": conversation.user_one_id,
            "user_two_id": conversation.user_two_id,
            "report_id": conversation.report_id,
            "status": conversation.status,
            "created_at": conversation.created_at,
            "closed_at": conversation.closed_at,
            "other_user_name": other_user.full_name if other_user else None,
            "last_message": last_message.content if last_message else None,
            "unread_count": unread_count
        })

    return results
# عرض رسائل محادثة محددة
@app.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[MessageResponse]
)
def get_conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id
    ).first()

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # السماح فقط للمستخدمين الموجودين داخل المحادثة
    if current_user.id not in [
        conversation.user_one_id,
        conversation.user_two_id
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to view this conversation"
        )

    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(
        Message.created_at.asc()
    ).all()

    results = []

    for message in messages:
        sender = db.query(User).filter(
            User.id == message.sender_id
        ).first()

        results.append({
            "id": message.id,
            "conversation_id": message.conversation_id,
            "sender_id": message.sender_id,
            "content": message.content,
            "is_read": message.is_read,
            "created_at": message.created_at,
            "sender_name": sender.full_name if sender else None
        })

    # اعتبار رسائل الطرف الآخر مقروءة عند فتح المحادثة
    db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != current_user.id,
        Message.is_read == False
    ).update(
        {"is_read": True},
        synchronize_session=False
    )

    db.commit()

    return results

# إرسال رسالة داخل المحادثة
@app.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED
)
def send_message(
    conversation_id: int,
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id
    ).first()

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # السماح فقط لأطراف المحادثة
    if current_user.id not in [
        conversation.user_one_id,
        conversation.user_two_id
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to send messages in this conversation"
        )

    if conversation.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This conversation is closed"
        )

    message_content = message_data.content.strip()

    if not message_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty"
        )

    message = Message(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        content=message_content,
        is_read=False
    )

    db.add(message)

    # تحديد المستخدم الآخر لإرسال إشعار له
    if conversation.user_one_id == current_user.id:
        receiver_id = conversation.user_two_id
    else:
        receiver_id = conversation.user_one_id

    create_notification(
        db=db,
        user_id=receiver_id,
        notification_type="new_message",
        title="رسالة جديدة",
        content=f"لديك رسالة جديدة من {current_user.full_name}",
        reference_id=conversation.id
    )

    db.commit()
    db.refresh(message)

    return {
        "id": message.id,
        "conversation_id": message.conversation_id,
        "sender_id": message.sender_id,
        "content": message.content,
        "is_read": message.is_read,
        "created_at": message.created_at,
        "sender_name": current_user.full_name
    }

# تأكيد استلام الغرض وإغلاق البلاغين والمحادثة
@app.patch("/conversations/{conversation_id}/complete")
def complete_recovery(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id
    ).first()

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    if current_user.id not in [
        conversation.user_one_id,
        conversation.user_two_id
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to complete this recovery"
        )

    if conversation.conversation_type != "match":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only match conversations can complete a recovery"
        )

    if conversation.status == "closed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This recovery has already been completed"
        )

    contact_request = db.query(ContactRequest).filter(
        ContactRequest.id == conversation.contact_request_id
    ).first()

    if contact_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact request not found"
        )

    lost_report = db.query(ItemReport).filter(
        ItemReport.id == contact_request.lost_report_id
    ).first()

    found_report = db.query(ItemReport).filter(
        ItemReport.id == contact_request.found_report_id
    ).first()

    if lost_report:
        lost_report.status = "closed"

    if found_report:
        found_report.status = "closed"

    conversation.status = "closed"
    conversation.closed_at = func.now()

    if conversation.user_one_id == current_user.id:
        other_user_id = conversation.user_two_id
    else:
        other_user_id = conversation.user_one_id

    create_notification(
        db=db,
        user_id=other_user_id,
        notification_type="recovery_completed",
        title="اكتملت عملية الاستعادة",
        content="تم تأكيد استلام الغرض وإغلاق البلاغ بنجاح.",
        reference_id=conversation.id
    )

    db.commit()

    return {
        "message": "Recovery completed successfully",
        "conversation_id": conversation.id,
        "lost_report_id": contact_request.lost_report_id,
        "found_report_id": contact_request.found_report_id,
        "status": "closed"
    }    
# بدء محادثة دعم مع الأدمن
@app.post(
    "/support/conversations",
    response_model=ConversationResponse
)
def create_support_conversation(
    support_data: SupportConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin cannot create a support conversation with himself"
        )

    admin_user = db.query(User).filter(
        User.role == "admin"
    ).order_by(
        User.id.asc()
    ).first()

    if admin_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin account not found"
        )

    message_content = support_data.message.strip()

    if not message_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty"
        )

    # التحقق من البلاغ عند إرفاقه بالمحادثة
    if support_data.report_id is not None:
        report = db.query(ItemReport).filter(
            ItemReport.id == support_data.report_id
        ).first()

        if report is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found"
            )

        if report.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only contact support about your own report"
            )

    # البحث عن محادثة دعم مفتوحة سابقة
    conversation = db.query(Conversation).filter(
        Conversation.conversation_type == "support",
        Conversation.user_one_id == current_user.id,
        Conversation.user_two_id == admin_user.id,
        Conversation.status == "active"
    ).first()

    # إنشاء محادثة جديدة إذا لم توجد
    if conversation is None:
        conversation = Conversation(
            conversation_type="support",
            contact_request_id=None,
            user_one_id=current_user.id,
            user_two_id=admin_user.id,
            report_id=support_data.report_id,
            status="active"
        )

        db.add(conversation)
        db.flush()

    message = Message(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        content=message_content,
        is_read=False
    )

    db.add(message)

    create_notification(
        db=db,
        user_id=admin_user.id,
        notification_type="support_message",
        title="طلب مساعدة جديد",
        content=f"أرسل {current_user.full_name} رسالة إلى الدعم.",
        reference_id=conversation.id
    )

    db.commit()
    db.refresh(conversation)

    return {
        "id": conversation.id,
        "conversation_type": conversation.conversation_type,
        "contact_request_id": conversation.contact_request_id,
        "user_one_id": conversation.user_one_id,
        "user_two_id": conversation.user_two_id,
        "report_id": conversation.report_id,
        "status": conversation.status,
        "created_at": conversation.created_at,
        "closed_at": conversation.closed_at,
        "other_user_name": admin_user.full_name,
        "last_message": message_content,
        "unread_count": 0
    }
# عرض إشعارات المستخدم
@app.get(
    "/notifications",
    response_model=list[NotificationResponse]
)
def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(
        Notification.created_at.desc()
    ).all()

    return notifications
# تحديد إشعار واحد كمقروء
@app.patch(
    "/notifications/{notification_id}/read",
    response_model=NotificationResponse
)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification
# تحديد جميع إشعارات المستخدم كمقروءة
@app.patch("/notifications/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    updated_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update(
        {"is_read": True},
        synchronize_session=False
    )

    db.commit()

    return {
        "message": "All notifications marked as read",
        "updated_count": updated_count
    }
# الصفحة الرئيسية
@app.get("/", include_in_schema=False)
def home():
    return RedirectResponse(
        url="/frontend/"
    )

# تسجيل مستخدم جديد
@app.post(
    "/users/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )

    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        password_hash=hash_password(user_data.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# تسجيل الدخول
@app.post("/users/login")
def login_user(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if not user or not verify_password(
        user_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    access_token = create_access_token(
        user_id=user.id,
        role=user.role
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "full_name": user.full_name,
        "role": user.role
    }


# عرض بيانات المستخدم الحالي
@app.get(
    "/users/me",
    response_model=UserResponse
)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


# إضافة بلاغ جديد
@app.post(
    "/reports",
    response_model=ItemReportResponse,
    status_code=status.HTTP_201_CREATED
)
def create_report(
    report_data: ItemReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_report = ItemReport(
        user_id=current_user.id,
        **report_data.model_dump()
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    if get_local_report_image(new_report.image_url) is not None:
        refresh_report_visual_fingerprint(db, new_report)
        db.commit()

    return new_report
# رفع صورة حقيقية لبلاغ موجود
@app.post(
    "/reports/{report_id}/image",
    response_model=ItemReportResponse
)
async def upload_report_image(
    report_id: int,
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(ItemReport).filter(
        ItemReport.id == report_id
    ).first()

    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    if (
        report.user_id != current_user.id
        and current_user.role != "admin"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to upload an image for this report"
        )

    allowed_image_types = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp"
    }

    image_extension = allowed_image_types.get(
        image.content_type
    )

    if image_extension is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, PNG, and WEBP images are allowed"
        )

    image_content = await image.read()

    if not image_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The image file is empty"
        )

    # الحد الأعلى لحجم الصورة هو 5 MB
    if len(image_content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image size must not exceed 5 MB"
        )

    image_name = (
        f"{uuid4().hex}{image_extension}"
    )

    image_path = UPLOAD_DIR / image_name
    image_path.write_bytes(image_content)

    report.image_url = f"/uploads/{image_name}"
    refresh_report_visual_fingerprint(
        db,
        report,
        image_path=image_path
    )

    db.commit()
    db.refresh(report)

    return report

# عرض جميع البلاغات مع الفلترة والبحث
@app.get(
    "/reports",
    response_model=list[ItemReportResponse]
)
def get_all_reports(
    report_type: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(ItemReport)

    if report_type is not None:
        if report_type not in ("lost", "found"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="report_type must be lost or found"
            )

        query = query.filter(
            ItemReport.report_type == report_type
        )

    if search is not None and search.strip():
        search_term = f"%{search.strip()}%"

        query = query.filter(
            or_(
                ItemReport.item_name.ilike(search_term),
                ItemReport.category.ilike(search_term),
                ItemReport.description.ilike(search_term),
                ItemReport.location.ilike(search_term),
                ItemReport.color.ilike(search_term)
            )
        )

    return query.order_by(
        ItemReport.created_at.desc()
    ).all()


# اقتراح البلاغات المتطابقة وترتيبها حسب نسبة التطابق
@app.get(
    "/reports/{report_id}/matches",
    response_model=list[ItemReportMatchResponse]
)
def get_matching_reports(
    report_id: int,
    db: Session = Depends(get_db)
):
    report = db.query(ItemReport).filter(
        ItemReport.id == report_id
    ).first()

    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

       # البلاغ المنتهي لا يحتاج إلى اقتراحات جديدة
    if report.status != "open":
        return []

    opposite_type = (
        "found"
        if report.report_type == "lost"
        else "lost"
    )

    # نبحث داخل البلاغات المفتوحة فقط
    candidates = db.query(ItemReport).filter(
        ItemReport.id != report.id,
        ItemReport.report_type == opposite_type,
        ItemReport.category.ilike(report.category),
        ItemReport.status == "open"
    ).all()

    # إزالة الفراغات وتحويل النص إلى أحرف صغيرة
    def normalize_text(value):
        return (value or "").strip().lower()

    # حساب نتيجة المطابقة النصية مع أسباب واضحة للواجهة
    def calculate_text_match(candidate):
        score = 30  # تطابق التصنيف
        reasons = ["same_category"]

        # تطابق اسم الغرض: 25 نقطة
        report_name = normalize_text(report.item_name)
        candidate_name = normalize_text(candidate.item_name)

        if report_name and candidate_name:
            if report_name == candidate_name:
                score += 25
                reasons.append("same_item_name")
            else:
                report_words = set(report_name.split())
                candidate_words = set(candidate_name.split())

                if report_words.intersection(candidate_words):
                    score += 15
                    reasons.append("similar_item_name")

        # تطابق اللون: 15 نقطة
        report_color = normalize_text(report.color)
        candidate_color = normalize_text(candidate.color)

        if report_color and candidate_color:
            if report_color == candidate_color:
                score += 15
                reasons.append("same_color")
            elif (
                report_color in candidate_color
                or candidate_color in report_color
            ):
                score += 8
                reasons.append("similar_color")

        # تطابق الموقع: 10 نقاط
        report_location = normalize_text(report.location)
        candidate_location = normalize_text(candidate.location)

        if report_location and candidate_location:
            if report_location == candidate_location:
                score += 10
                reasons.append("same_location")
            elif (
                report_location in candidate_location
                or candidate_location in report_location
            ):
                score += 5
                reasons.append("near_location")

        # تطابق الكلمات الموجودة في الوصف: 10 نقاط
        report_description = normalize_text(report.description)
        candidate_description = normalize_text(
            candidate.description
        )

        if report_description and candidate_description:
            report_words = set(report_description.split())
            candidate_words = set(candidate_description.split())

            common_words = report_words.intersection(
                candidate_words
            )

            if len(common_words) >= 3:
                score += 10
                reasons.append("strong_description_overlap")
            elif len(common_words) == 2:
                score += 7
                reasons.append("description_overlap")
            elif len(common_words) == 1:
                score += 4
                reasons.append("description_keyword")

        # تقارب تاريخ الفقدان والعثور: 10 نقاط
        date_difference = abs(
            (
                report.item_date.date()
                - candidate.item_date.date()
            ).days
        )

        if date_difference <= 1:
            score += 10
            reasons.append("very_close_date")
        elif date_difference <= 3:
            score += 7
            reasons.append("close_date")
        elif date_difference <= 7:
            score += 4
            reasons.append("same_week")

        return min(score, 100), reasons

    report_fingerprint = db.query(ReportImageEmbedding).filter(
        ReportImageEmbedding.report_id == report.id
    ).first()

    candidate_ids = [candidate.id for candidate in candidates]
    candidate_fingerprints = {}

    if candidate_ids:
        candidate_fingerprints = {
            fingerprint.report_id: fingerprint
            for fingerprint in db.query(ReportImageEmbedding).filter(
                ReportImageEmbedding.report_id.in_(candidate_ids)
            ).all()
        }

    scored_matches = []

    for candidate in candidates:
        text_score, match_reasons = calculate_text_match(candidate)
        candidate_fingerprint = candidate_fingerprints.get(candidate.id)

        visual_score = compare_image_embeddings(
            report_fingerprint.embedding if report_fingerprint else None,
            candidate_fingerprint.embedding if candidate_fingerprint else None
        )

        if visual_score is None:
            match_score = text_score
            match_method = "text"
        else:
            match_score = round(
                (text_score * 0.65)
                + (visual_score * 0.35)
            )
            match_method = "hybrid"
            match_reasons.append("visual_similarity")

        # تجاهل المطابقات التي تقل عن 50%
        if match_score < 50:
            continue

        candidate_data = ItemReportResponse.model_validate(
            candidate
        ).model_dump()

        candidate_data["match_score"] = match_score
        candidate_data["text_score"] = text_score
        candidate_data["visual_score"] = visual_score
        candidate_data["match_method"] = match_method
        candidate_data["match_reasons"] = match_reasons

        scored_matches.append(candidate_data)

    # ترتيب النتائج من أعلى نسبة إلى أقل نسبة
    scored_matches.sort(
        key=lambda item: item["match_score"],
        reverse=True
    )

    # إرجاع قائمة النتائج
    return scored_matches


# عرض بلاغ واحد باستخدام رقمه
@app.get(
    "/reports/{report_id}",
    response_model=ItemReportResponse
)
def get_report_by_id(
    report_id: int,
    db: Session = Depends(get_db)
):
    report = db.query(ItemReport).filter(
        ItemReport.id == report_id
    ).first()

    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    return report


# تعديل بلاغ
@app.patch(
    "/reports/{report_id}",
    response_model=ItemReportResponse
)
def update_report(
    report_id: int,
    report_data: ItemReportUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(ItemReport).filter(
        ItemReport.id == report_id
    ).first()

    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    if (
        report.user_id != current_user.id
        and current_user.role != "admin"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to update this report"
        )

    update_data = report_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(report, field, value)

    db.commit()
    db.refresh(report)

    return report


# حذف بلاغ
@app.delete(
    "/reports/{report_id}",
    status_code=status.HTTP_200_OK
)
def delete_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(ItemReport).filter(
        ItemReport.id == report_id
    ).first()

    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    if (
        report.user_id != current_user.id
        and current_user.role != "admin"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to delete this report"
        )

    db.delete(report)
    db.commit()

    return {
        "message": "Report deleted successfully"
    }


# عرض بلاغات المستخدم الحالي فقط
@app.get(
    "/users/me/reports",
    response_model=list[ItemReportResponse]
)
def get_my_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(ItemReport).filter(
        ItemReport.user_id == current_user.id
    ).order_by(
        ItemReport.created_at.desc()
    ).all()
# عرض جميع البلاغات للأدمن فقط
@app.get(
    "/admin/reports",
    response_model=list[ItemReportResponse]
)
def admin_get_all_reports(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return db.query(ItemReport).order_by(
        ItemReport.created_at.desc()
    ).all()


@app.post("/admin/vision/rebuild")
def admin_rebuild_visual_fingerprints(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create visual fingerprints for existing locally uploaded images."""

    reports = db.query(ItemReport).filter(
        ItemReport.image_url.isnot(None)
    ).all()

    processed = 0
    skipped = 0

    for report in reports:
        image_path = get_local_report_image(report.image_url)
        if image_path is None:
            skipped += 1
            continue

        if refresh_report_visual_fingerprint(db, report, image_path):
            processed += 1
        else:
            skipped += 1

    db.commit()

    return {
        "feature": "FindBack Vision",
        "processed": processed,
        "skipped": skipped,
        "total_with_image": len(reports),
        "runtime": vision_runtime_status()
    }
# تغيير حالة البلاغ بواسطة الأدمن فقط
@app.patch(
    "/admin/reports/{report_id}/status",
    response_model=ItemReportResponse
)
def admin_update_report_status(
    report_id: int,
    status_data: ReportStatusUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    report = db.query(ItemReport).filter(
        ItemReport.id == report_id
    ).first()

    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    new_status = status_data.status.strip().lower()

    allowed_statuses = {
        "open",
        "matched",
        "closed"
    }

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be open, matched, or closed"
        )

    report.status = new_status

    db.commit()
    db.refresh(report)

    return report
# إحصائيات المشروع للأدمن فقط
@app.get("/admin/statistics")
def admin_get_statistics(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(
        func.count(User.id)
    ).scalar()

    total_reports = db.query(
        func.count(ItemReport.id)
    ).scalar()

    lost_reports = db.query(
        func.count(ItemReport.id)
    ).filter(
        ItemReport.report_type == "lost"
    ).scalar()

    found_reports = db.query(
        func.count(ItemReport.id)
    ).filter(
        ItemReport.report_type == "found"
    ).scalar()

    open_reports = db.query(
        func.count(ItemReport.id)
    ).filter(
        ItemReport.status == "open"
    ).scalar()
    matched_reports = db.query(
        func.count(Conversation.id)
    ).filter(
         Conversation.conversation_type == "match"
    ).scalar()
    closed_reports = db.query(
        func.count(ItemReport.id)
    ).filter(
        ItemReport.status == "closed"
    ).scalar()

    return {
        "total_users": total_users,
        "total_reports": total_reports,
        "lost_reports": lost_reports,
        "found_reports": found_reports,
        "open_reports": open_reports,
        "matched_reports": matched_reports,
        "closed_reports": closed_reports
    }
