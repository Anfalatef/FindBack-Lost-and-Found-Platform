# ربط واجهة FindBack مع FastAPI

## 1. مكان الملفات

ضعي مجلد `frontend` كاملًا داخل مجلد مشروع `FindBack` بجانب الملفات:

```text
FindBack/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── assets/
├── main.py
├── database.py
├── models.py
├── schemas.py
└── security.py
```

## 2. تعديل main.py

في أعلى `main.py` أضيفي:

```python
from fastapi.responses import RedirectResponse
```

بعد إعداد `UPLOAD_DIR` أضيفي:

```python
FRONTEND_DIR = Path("frontend")
FRONTEND_DIR.mkdir(exist_ok=True)
```

بعد أمر تركيب مجلد الصور:

```python
app.mount(
    "/uploads",
    StaticFiles(directory=str(UPLOAD_DIR)),
    name="uploads"
)
```

أضيفي:

```python
app.mount(
    "/frontend",
    StaticFiles(directory=str(FRONTEND_DIR), html=True),
    name="frontend"
)
```

استبدلي دالة الصفحة الرئيسية الحالية بهذا الكود:

```python
@app.get("/", include_in_schema=False)
def home():
    return RedirectResponse(url="/frontend/")
```

## 3. تشغيل المشروع

فعّلي البيئة الافتراضية ثم شغّلي:

```powershell
uvicorn main:app --reload
```

افتحي هذا العنوان:

```text
http://127.0.0.1:8000
```

تبقى وثائق Swagger متاحة على:

```text
http://127.0.0.1:8000/docs
```

## الوظائف الموجودة في الواجهة

- هوية بصرية سينمائية خاصة بـ FindBack وصور أصلية داخل المشروع.
- صفحة عامة تشرح بنية النظام ومحرك المطابقة متعدد المعايير.
- معرض بصري للمشاهد والأغراض في نهاية الصفحة.
- تسجيل مستخدم جديد.
- تسجيل الدخول والخروج.
- عرض أحدث البلاغات.
- البحث والفلترة.
- إضافة بلاغ مفقود أو موجود.
- رفع صورة حقيقية مع البلاغ.
- عرض بلاغات المستخدم.
- حذف البلاغ.
- عرض نتائج المطابقة ونسبتها.
- لوحة مستخدم غنية بالإحصائيات ومركز المطابقة ودورة البلاغ ونصائح رفع الدقة.
- لوحة أدمن مستقلة بأربع شاشات: القيادة، إدارة البلاغات، التحليلات، والنشاط والتنبيهات.
- تحليل التصنيفات والمواقع والنشاط خلال آخر 7 أيام ومؤشرات الأداء.
- عرض إحصائيات النظام.
- تغيير حالة البلاغ إلى `open` أو `matched` أو `closed`.

> عند استبدال نسخة قديمة من الواجهة، احذفي مجلد `frontend` القديم ثم انسخي
> مجلد `frontend` الجديد كاملًا حتى تنتقل ملفات الصور أيضًا، وبعدها استخدمي
> `Ctrl + F5` في المتصفح لتحديث التصميم دون الكاش.
