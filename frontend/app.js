const API_BASE = window.location.protocol === "file:"
  ? "http://127.0.0.1:8000"
  : window.location.origin;

const state = {
  token: sessionStorage.getItem("findback_token") || "",
  user: JSON.parse(sessionStorage.getItem("findback_user") || "null"),
  language: localStorage.getItem("findback_language") === "en" ? "en" : "ar",
  adminReports: [],
  adminStats: null,
  userConversations: [],
  adminConversations: [],
  currentUserConversationId: null,
  currentAdminConversationId: null,
  backgroundTimer: null,
  toastTimer: null
};

const dictionary = {
  category: {
    phones: "هواتف", wallets: "محافظ", bags: "حقائب", documents: "وثائق",
    keys: "مفاتيح", "electronic devices": "أجهزة إلكترونية"
  },
  icon: {
    phones: "▣", wallets: "▰", bags: "▱", documents: "▤",
    keys: "⚿", "electronic devices": "◫"
  },
  status: { open: "مفتوح", matched: "متطابق", closed: "مغلق" },
  type: { lost: "مفقود", found: "موجود" },
  requestStatus: { pending: "بانتظار الرد", accepted: "مقبول", rejected: "مرفوض" },
  matchReason: {
    same_category: "نفس التصنيف",
    same_item_name: "اسم الغرض متطابق",
    similar_item_name: "اسم الغرض متقارب",
    same_color: "نفس اللون",
    similar_color: "لون متقارب",
    same_location: "نفس الموقع",
    near_location: "موقع متقارب",
    strong_description_overlap: "وصف شديد التقارب",
    description_overlap: "تفاصيل مشتركة",
    description_keyword: "كلمة وصف مشتركة",
    very_close_date: "التاريخ متقارب جدًا",
    close_date: "التاريخ متقارب",
    same_week: "خلال الأسبوع نفسه",
    visual_similarity: "تشابه بصري بين الصورتين"
  },
  notificationIcon: {
    contact_request: "↘", contact_request_accepted: "✓",
    contact_request_rejected: "×", new_message: "✦", support_message: "⌘",
    recovery_completed: "✓"
  }
};

const englishTranslations = {
  "FindBack — نظام متكامل لإدارة المفقودات والموجودات ومطابقتها بدقة.": "FindBack — an integrated platform for managing and accurately matching lost and found items.",
  "FindBack | نظام استعادة المفقودات": "FindBack | Lost & Found Recovery System",
  "FindBack الرئيسية": "FindBack Home",
  "التنقل الرئيسي": "Main navigation",
  "تغيير اللغة": "Switch language",
  "فتح القائمة": "Open menu",
  "إغلاق": "Close",
  "النظام": "System",
  "محرك المطابقة": "Matching Engine",
  "المشاهد": "Stories",
  "المطابقة": "Matching",
  "تسجيل الدخول": "Sign In",
  "إنشاء بلاغ": "Create Report",
  "كل أثرٍ": "Every trace",
  "قابل للربط.": "can be connected.",
  "نظام رقمي يجمع بلاغات المفقودات والموجودات، يقارن ستة معايير، ويحوّل التفاصيل المتفرقة إلى نتائج مرتبة وقابلة للتحقق.": "A digital system that brings lost and found reports together, compares six signals, and turns scattered details into ranked, verifiable results.",
  "ابدأ الآن": "Get Started",
  "الدخول للنظام": "Enter the System",
  "بلاغ موحّد": "Unified Report",
  "مطابقة موزونة": "Weighted Matching",
  "إدارة حالات": "Status Management",
  "تم التقاط 5 إشارات": "5 signals detected",
  "تطابق مرتفع": "High Match",
  "الموقع · اللون · التاريخ": "Location · Color · Date",
  "منظومة واحدة.": "One System.",
  "أربع طبقات دقيقة.": "Four precise layers.",
  "لا يعتمد FindBack على نشر البلاغ فقط؛ بل ينظم دورة البلاغ كاملة منذ الإدخال وحتى إغلاق الحالة.": "FindBack does more than publish reports; it manages the complete journey from submission to resolution.",
  "تسجيل دقيق": "Structured Reporting",
  "حقول موحّدة للنوع والتصنيف والوصف واللون والموقع والتاريخ والصورة.": "Standard fields for type, category, description, color, location, date, and image.",
  "تقييم التشابه": "Similarity Scoring",
  "درجة واضحة لكل نتيجة بدل عرض قائمة عشوائية من البلاغات.": "A clear score for every result instead of a random list of reports.",
  "صلاحيات منفصلة": "Role-Based Access",
  "مساحة مستخدم مستقلة ومركز تحكم متكامل لإدارة المنصة.": "A dedicated member space and a complete administration control center.",
  "مسار حالة كامل": "Complete Status Flow",
  "مفتوح، متطابق، ثم مغلق؛ كل بلاغ يتحرك ضمن دورة واضحة.": "Open, matched, then closed—every report follows a clear lifecycle.",
  "النتيجة لا تأتي": "A match is never",
  "من تخمين.": "a guess.",
  "كل بلاغ يُفكك إلى إشارات قابلة للمقارنة. ثم تُجمع النقاط وتُرتب النتائج من الأقرب إلى الأبعد.": "Each report is broken into comparable signals. Scores are combined and results are ranked from closest to farthest.",
  "مطابقة تفهم البيانات،": "Matching that understands data,",
  "وترى التفاصيل.": "and sees the details.",
  "يقارن FindBack ست إشارات من البلاغ، ثم يضيف بصمة الصورة عند توفر صورتين ليبني نتيجة واحدة واضحة وقابلة للتفسير.": "FindBack compares six report signals, then adds visual fingerprints when both photos are available to produce one clear, explainable score.",
  "بيانات البلاغ": "Report Data",
  "بصمة الصورة": "Visual Fingerprint",
  "حد عرض النتيجة": "Result Threshold",
  "التصنيف": "Category",
  "اسم الغرض": "Item Name",
  "اللون": "Color",
  "الموقع": "Location",
  "سجّل أول إشارة": "Submit Your First Signal",
  "هو الحد الأدنى لعرض المطابقة": "is the minimum match threshold",
  "أقل ضوضاء.": "Less Noise.",
  "نتائج أكثر صلة.": "More Relevant Results.",
  "لا تظهر النتيجة لمجرد تشابه كلمة واحدة. يجب أن تتجاوز درجة المطابقة الحد المطلوب حتى تدخل قائمة الاقتراحات.": "A result is not shown for a single similar word. It must pass the required match score to enter the suggestions list.",
  "أغراض عادية.": "Ordinary Items.",
  "إشارات غير عادية.": "Extraordinary Signals.",
  "حين تتحول التفاصيل إلى مسار.": "When details become a path.",
  "آخر موقع يصنع الفرق.": "The last location makes the difference.",
  "الوصف يختصر الاحتمالات.": "A good description narrows the possibilities.",
  "بلاغ واحد يكمل الدائرة.": "One report completes the loop.",
  "أطلق البلاغ.": "Launch the Report.",
  "ودع النظام يتتبع الأثر.": "Let the system trace the signal.",
  "حساب واحد يمنحك مساحة كاملة للبلاغات، الصور، المطابقات، والمتابعة.": "One account gives you a complete space for reports, images, matches, and follow-up.",
  "إنشاء حساب والبدء": "Create an Account",
  "كل أدوات البحث": "Every search tool",
  "في مساحة واحدة.": "in one place.",
  "دخول": "Sign In",
  "حساب جديد": "New Account",
  "الوصول إلى البلاغات والمطابقات والمتابعة.": "Access reports, matches, and follow-up tools.",
  "البريد الإلكتروني": "Email Address",
  "كلمة المرور": "Password",
  "دخول النظام": "Sign In",
  "إنشاء حساب": "Create Account",
  "ابدأ بإدارة بلاغاتك ومراجعة النتائج.": "Start managing your reports and reviewing results.",
  "الاسم الكامل": "Full Name",
  "6 أحرف على الأقل": "At least 6 characters",
  "لوحة المتابعة": "Dashboard",
  "استكشف البلاغات": "Explore Reports",
  "بلاغ جديد": "New Report",
  "بلاغاتي": "My Reports",
  "مركز التواصل": "Communication Center",
  "الإشعارات": "Notifications",
  "معايير ترفع دقة النتائج كلما كانت بياناتك أوضح.": "Six signals improve accuracy when your details are clearer.",
  "سبع إشارات تجمع البيانات والصورة لنتائج أوضح.": "Seven signals combine report data and imagery for clearer results.",
  "تحسين فرص المطابقة ←": "Improve Match Chances →",
  "تسجيل الخروج": "Sign Out",
  "المستخدم": "Member",
  "حساب شخصي": "Personal Account",
  "أهلًا، هذه مساحة بلاغاتك.": "Welcome, this is your reports space.",
  "تابع حالة كل بلاغ، راقب المطابقات، وانتقل من التسجيل إلى الاستعادة ضمن مسار واحد.": "Track every report, monitor matches, and move from submission to recovery in one flow.",
  "＋ بلاغ جديد": "+ New Report",
  "استكشف النظام": "Explore the System",
  "مركز المطابقة": "Match Center",
  "كل بلاغ مفتوح مع أقرب نتيجة متاحة حاليًا.": "Each open report is paired with its closest available result.",
  "إدارة بلاغاتي ←": "Manage My Reports →",
  "كيف ترفع دقة المطابقة؟": "How can you improve match accuracy?",
  "استخدم اسمًا محددًا": "Use a specific item name",
  "هاتف Samsung بدل هاتف فقط.": "Write Samsung phone instead of phone only.",
  "أضف العلامة الفارقة": "Add a distinguishing feature",
  "خدش، حافظة، نقش، أو محتوى مميز.": "Mention a scratch, case, engraving, or unique detail.",
  "حدد المكان بدقة": "Be precise about the location",
  "المنطقة والمبنى أو أقرب نقطة معروفة.": "Include the area, building, or nearest landmark.",
  "ارفع صورة واضحة": "Upload a clear photo",
  "الصورة تسهّل التحقق عند ظهور النتيجة.": "A photo makes verification easier when a match appears.",
  "الصورة تنشئ بصمة بصرية تقارن الشكل والألوان والتفاصيل.": "The photo creates a visual fingerprint that compares shape, colors, and details.",
  "دورة البلاغ": "Report Lifecycle",
  "مفتوح": "Open",
  "جاهز للمقارنة": "Ready for comparison",
  "متطابق": "Matched",
  "تم العثور على نتيجة": "A result was found",
  "مغلق": "Closed",
  "اكتملت الحالة": "Case completed",
  "أحدث البلاغات المفتوحة": "Latest Open Reports",
  "عرض جميع البلاغات ←": "View All Reports →",
  "ابحث حسب الاسم أو النوع أو التصنيف أو الموقع.": "Search by item name, type, category, or location.",
  "اكتب اسم الغرض أو الموقع...": "Enter an item name or location...",
  "كل الأنواع": "All Types",
  "مفقود": "Lost",
  "موجود": "Found",
  "بحث": "Search",
  "سجّل كل": "Capture every",
  "تفصيل واضح.": "clear detail.",
  "البيانات التي تدخلها الآن هي الإشارات التي سيستخدمها محرك المطابقة.": "The details you enter become the signals used by the matching engine.",
  "حقول أساسية": "Required Fields",
  "أقصى حجم للصورة": "Maximum Image Size",
  "نوع الإشارة": "Signal Type",
  "حدد ما إذا كنت تبحث عن الغرض أو عثرت عليه.": "Choose whether you lost an item or found one.",
  "بلاغ مفقود": "Lost Item Report",
  "أبحث عن غرض فقدته": "I am looking for an item I lost",
  "بلاغ موجود": "Found Item Report",
  "أبحث عن صاحب الغرض": "I am looking for the item's owner",
  "بيانات الغرض": "Item Details",
  "أدخل معلومات دقيقة وقابلة للمقارنة.": "Enter accurate, comparable information.",
  "اختر التصنيف": "Choose a Category",
  "هواتف": "Phones",
  "محافظ": "Wallets",
  "حقائب": "Bags",
  "وثائق": "Documents",
  "مفاتيح": "Keys",
  "أجهزة إلكترونية": "Electronic Devices",
  "مثال: أزرق داكن": "Example: Dark blue",
  "مثال: Samsung Galaxy S24": "Example: Samsung Galaxy S24",
  "مثال: عمّان - شارع الجامعة": "Example: Amman - University Street",
  "التاريخ والوقت": "Date and Time",
  "صورة الغرض": "Item Photo",
  "اختر JPG / PNG / WEBP": "Choose JPG / PNG / WEBP",
  "الوصف": "Description",
  "اكتب العلامة التجارية، الشكل، العلامات المميزة، والمكان بالتفصيل...": "Describe the brand, shape, unique marks, and location in detail...",
  "نشر البلاغ وتشغيل المطابقة": "Publish Report and Start Matching",
  "إدارة الصور والحالات ومراجعة النتائج المقترحة.": "Manage photos and statuses, and review suggested matches.",
  "طلبات آمنة، محادثات خاصة، وقناة مباشرة مع إدارة FindBack.": "Secure requests, private conversations, and a direct channel with FindBack administration.",
  "↻ تحديث": "↻ Refresh",
  "طلبات واردة": "Incoming Requests",
  "طلبات مرسلة": "Sent Requests",
  "تحدّث مع الإدارة": "Contact Administration",
  "أرفق بلاغًا إن كان طلبك مرتبطًا بحالة محددة.": "Attach a report if your request relates to a specific case.",
  "البلاغ المرتبط": "Related Report",
  "بدون بلاغ محدد": "No Specific Report",
  "رسالتك": "Your Message",
  "اشرح ما الذي تحتاج مساعدة فيه...": "Explain what you need help with...",
  "إرسال للإدارة": "Send to Administration",
  "محادثاتك": "Your Conversations",
  "تحديث المحادثات": "Refresh conversations",
  "اختر محادثة": "Choose a Conversation",
  "ستظهر الرسائل هنا بعد قبول طلب التواصل أو بدء محادثة دعم.": "Messages will appear here after a contact request is accepted or a support conversation is started.",
  "محادثة": "Conversation",
  "قناة آمنة": "Secure Channel",
  "✓ تم استلام الغرض": "✓ Item Received",
  "اكتب رسالة واضحة...": "Write a clear message...",
  "إرسال ←": "Send →",
  "تابع طلبات التواصل، القبول، والرسائل الجديدة.": "Track contact requests, approvals, and new messages.",
  "تعيين الكل كمقروء": "Mark All as Read",
  "مركز القيادة": "Command Center",
  "إدارة البلاغات": "Report Management",
  "التحليلات": "Analytics",
  "النشاط والتنبيهات": "Activity & Alerts",
  "محادثات الدعم": "Support Conversations",
  "النظام متصل بالبيانات": "System connected to data",
  "مدير النظام": "System Administrator",
  "لوحة الإدارة": "Administration Dashboard",
  "مستخدم FindBack": "FindBack User",
  "الصورة الكاملة للنظام.": "The complete system overview.",
  "قراءة فورية للحالات، التوزيع، ونشاط البلاغات.": "A live view of statuses, distribution, and report activity.",
  "بلاغ مسجّل": "Registered Reports",
  "توزيع الحالات": "Status Distribution",
  "مباشر": "Live",
  "إجمالي": "Total",
  "مفقود مقابل موجود": "Lost vs Found",
  "آخر البلاغات": "Latest Reports",
  "عرض الكل": "View All",
  "بحث وفلترة وتحديث حالة أي بلاغ من مكان واحد.": "Search, filter, and update any report from one place.",
  "↻ تحديث البيانات": "↻ Refresh Data",
  "بحث باسم الغرض أو الموقع...": "Search by item name or location...",
  "كل الحالات": "All Statuses",
  "اضغط حفظ بعد تغيير الحالة": "Select Save after changing a status",
  "الرقم": "ID",
  "الغرض": "Item",
  "النوع": "Type",
  "الحالة": "Status",
  "إجراء": "Action",
  "تحليلات المنصة": "Platform Analytics",
  "قراءة توزيع البلاغات حسب التصنيف والموقع والزمن.": "Review report distribution by category, location, and time.",
  "البلاغات حسب التصنيف": "Reports by Category",
  "أكثر المواقع نشاطًا": "Most Active Locations",
  "النشاط خلال آخر 7 أيام": "Activity During the Last 7 Days",
  "مؤشرات الأداء": "Performance Indicators",
  "آخر التغييرات والحالات التي تحتاج إلى مراجعة.": "Latest changes and cases that need review.",
  "سجل النشاط": "Activity Feed",
  "بحاجة إلى انتباه": "Needs Attention",
  "استقبل طلبات المساعدة وتابع كل حالة دون كشف بيانات المستخدمين للعموم.": "Receive support requests and follow every case without exposing user information publicly.",
  "↻ تحديث المحادثات": "↻ Refresh Conversations",
  "صندوق الوارد": "Inbox",
  "اختر طلب دعم": "Choose a Support Request",
  "افتح أي محادثة للاطلاع على الرسالة والرد على المستخدم.": "Open a conversation to review the message and reply to the user.",
  "مستخدم": "User",
  "دعم مباشر": "Direct Support",
  "اكتب رد الإدارة...": "Write an administration reply...",
  "إشعارات الإدارة": "Administration Notifications",
  "طلبات الدعم والرسائل الجديدة تظهر هنا فور وصولها.": "Support requests and new messages appear here as soon as they arrive.",
  "المطابقات الأقرب": "Closest Matches",
  "نتائج تجاوزت الحد الأدنى مرتبة حسب درجة التشابه.": "Results above the minimum threshold, ranked by similarity score.",
  "مطابقات FindBack Vision": "FindBack Vision Matches",
  "ترتيب هجين يجمع بيانات البلاغ مع بصمة الصورة عندما تتوفر صورتان.": "Hybrid ranking combines report data with visual fingerprints when both reports have photos.",
  "النتيجة النهائية": "Final Score",
  "تطابق البيانات": "Data Match",
  "تشابه الصورة": "Image Similarity",
  "تحليل هجين": "Hybrid Analysis",
  "مطابقة البيانات": "Data Matching",
  "بانتظار صورتين واضحتين": "Waiting for two clear photos",
  "أسباب الترشيح": "Why this match",
  "نفس التصنيف": "Same category",
  "اسم الغرض متطابق": "Exact item name",
  "اسم الغرض متقارب": "Similar item name",
  "نفس اللون": "Same color",
  "لون متقارب": "Similar color",
  "نفس الموقع": "Same location",
  "موقع متقارب": "Nearby location",
  "وصف شديد التقارب": "Strong description overlap",
  "تفاصيل مشتركة": "Shared details",
  "كلمة وصف مشتركة": "Shared description keyword",
  "التاريخ متقارب جدًا": "Very close date",
  "التاريخ متقارب": "Close date",
  "خلال الأسبوع نفسه": "Within the same week",
  "تشابه بصري بين الصورتين": "Visual similarity between both photos",
  "بيانات غير صحيحة": "Invalid data",
  "حدث خطأ غير متوقع": "An unexpected error occurred",
  "جاري التنفيذ...": "Processing...",
  "غير محدد": "Not specified",
  "الآن": "Now",
  "منذ أقل من ساعة": "Less than an hour ago",
  "جاري تحميل البيانات...": "Loading data...",
  "تعذّر تحميل البيانات": "Unable to Load Data",
  "عرض المطابقات": "View Matches",
  "رفع صورة": "Upload Photo",
  "حذف": "Delete",
  "لا توجد بلاغات": "No Reports Found",
  "ابدأ ببلاغ جديد أو غيّر خيارات البحث.": "Create a new report or change the search options.",
  "انتهت الجلسة، سجّل الدخول من جديد.": "Your session has expired. Please sign in again.",
  "لا توجد بلاغات مفتوحة": "No Open Reports",
  "لا توجد إشارات جديدة في الشبكة حاليًا.": "There are no new signals in the network right now.",
  "إجمالي بلاغاتي": "My Total Reports",
  "قيد البحث": "Searching",
  "تمت مطابقتها": "Matched Reports",
  "أقوى نتيجة": "Best Match",
  "تحديث مباشر من حسابك": "Live update from your account",
  "أضف بلاغًا جديدًا وسيظهر مسار مطابقته هنا.": "Create a new report and its matching path will appear here.",
  "بلاغك": "Your Report",
  "أقرب نتيجة": "Closest Result",
  "عرض النتائج": "View Results",
  "جاري تتبع الإشارات": "Tracking Signals",
  "لم تتجاوز أي نتيجة حد 50%": "No result has passed the 50% threshold",
  "فحص النتائج": "Check Results",
  "لا توجد بلاغات في حسابك": "No Reports in Your Account",
  "ابدأ بإنشاء أول بلاغ لتشغيل محرك المطابقة.": "Create your first report to start the matching engine.",
  "وارد بانتظارك": "Pending Incoming",
  "طلبات مقبولة": "Accepted Requests",
  "رسائل غير مقروءة": "Unread Messages",
  "إشعارات جديدة": "New Notifications",
  "لا توجد طلبات": "No Requests",
  "ستظهر هنا عند وجود مطابقة.": "Requests will appear here when a match is found.",
  "قبول": "Accept",
  "رفض": "Reject",
  "بانتظار الرد": "Pending",
  "مقبول": "Accepted",
  "مرفوض": "Rejected",
  "محادثة دعم": "Support Conversation",
  "محادثة مطابقة": "Match Conversation",
  "لا توجد محادثات": "No Conversations",
  "ابدأ بطلب تواصل أو رسالة دعم.": "Start with a contact request or support message.",
  "المحادثة جاهزة": "Conversation Ready",
  "أرسل أول رسالة بطريقة واضحة وآمنة.": "Send the first message clearly and safely.",
  "جاري الإرسال...": "Sending...",
  "جاري الإغلاق...": "Closing...",
  "اكتملت الاستعادة، وتم إغلاق البلاغين بنجاح.": "Recovery completed and both reports were closed successfully.",
  "وصلت رسالتك إلى إدارة FindBack.": "Your message was delivered to FindBack administration.",
  "لا توجد إشعارات": "No Notifications",
  "سيظهر هنا أي تحديث مهم يخص حسابك.": "Important updates about your account will appear here.",
  "فتح": "Open",
  "تم تعيين جميع الإشعارات كمقروءة.": "All notifications were marked as read.",
  "لم تظهر نتيجة فوق 50%": "No Result Above 50%",
  "حسّن الوصف أو انتظر وصول بلاغ مقابل جديد.": "Improve the description or wait for a new matching report.",
  "طلب تواصل": "Contact Request",
  "حجم الصورة يجب ألا يتجاوز 5 MB.": "The image size must not exceed 5 MB.",
  "تم تحديث صورة البلاغ.": "The report image was updated.",
  "هل تريد حذف هذا البلاغ نهائيًا؟": "Do you want to permanently delete this report?",
  "تم حذف البلاغ.": "The report was deleted.",
  "المستخدمون": "Users",
  "كل البلاغات": "All Reports",
  "المفتوحة": "Open Reports",
  "المتطابقة": "Matched Reports",
  "المغلقة": "Closed Reports",
  "المفقودة": "Lost Reports",
  "الموجودة": "Found Reports",
  "مرفقة بصورة": "With Photo",
  "بلاغات مفقودة": "Lost Reports",
  "بلاغات موجودة": "Found Reports",
  "التوازن بين النوعين يزيد فرص تكوين أزواج مطابقة داخل النظام.": "A balanced number of both report types increases matching opportunities.",
  "لا يوجد نشاط بعد.": "No activity yet.",
  "لا توجد نتائج مطابقة للفلتر.": "No results match the selected filters.",
  "حفظ": "Save",
  "لا توجد بيانات تصنيف.": "No category data available.",
  "لا توجد بيانات مواقع.": "No location data available.",
  "بلاغ واحد": "One Report",
  "نسبة الإنجاز": "Resolution Rate",
  "متطابق + مغلق": "Matched + Closed",
  "توثيق الصور": "Photo Coverage",
  "من جميع البلاغات": "Of all reports",
  "قيد المعالجة": "In Progress",
  "بلاغات مفتوحة": "Open Reports",
  "كثافة المستخدم": "Registered Users",
  "حساب مسجل": "Registered Accounts",
  "لا يوجد نشاط مسجل.": "No recorded activity.",
  "إضافة الصور تحسّن التحقق البصري من النتائج.": "Adding photos improves visual verification of results.",
  "راجع الحالات القديمة وحدّث ما تم حله.": "Review older cases and update resolved items.",
  "تحقق من اكتمال عملية الاستعادة قبل الإغلاق.": "Confirm the recovery is complete before closing.",
  "تم تحديث حالة البلاغ.": "The report status was updated.",
  "تم تسجيل الخروج.": "You have signed out.",
  "تم تسجيل الدخول بنجاح.": "Signed in successfully.",
  "تم إنشاء الحساب. يمكنك الدخول الآن.": "Your account was created. You can sign in now.",
  "جاري نشر البلاغ...": "Publishing Report...",
  "تم نشر البلاغ وتشغيل المطابقة.": "The report was published and matching has started.",
  "تم قبول الطلب وإنشاء محادثة خاصة.": "The request was accepted and a private conversation was created.",
  "تم رفض طلب التواصل.": "The contact request was rejected.",
  "تم إرسال طلب التواصل لصاحب البلاغ.": "The contact request was sent to the report owner.",
  "هل تأكدت من استلام الغرض؟ سيتم إغلاق البلاغين والمحادثة.": "Have you received the item? Both reports and the conversation will be closed.",
  "اكتملت عملية الاستعادة": "Recovery Completed",
  "تم تأكيد استلام الغرض وإغلاق البلاغ بنجاح.": "Item receipt was confirmed and the report was closed successfully.",
  "رسالة جديدة": "New Message",
  "طلب مساعدة جديد": "New Support Request",
  "إنشاء الحساب": "Create Account",
  "أغراض شخصية مرتبة بتصميم بصري جريء": "Personal items arranged in a bold visual composition",
  "أغراض مفقودة تتحرك على مسار ضوئي يعيد ربطها": "Lost items moving along a light path that reconnects them",
  "أغراض مفقودة متنوعة": "A collection of different lost items",
  "حقيبة في مكتبة": "A bag in a library",
  "شبكة تتبع البلاغات": "Report tracking network",
  "شبكة رقمية لتتبع المفقودات": "Digital lost-item tracking network",
  "مجموعة أغراض بتصميم بصري مميز": "A distinctive visual collection of personal items",
  "مسار FindBack الرقمي": "FindBack digital signal path",
  "مسار رقمي للمفقودات": "Digital lost-item signal path",
  "مفاتيح ومحفظة": "Keys and wallet",
  "هاتف مفقود": "Lost phone",
  "كيف يعمل": "How It Works",
  "آلية المطابقة": "Matching Method",
  "أمثلة البلاغات": "Report Examples",
  "منصة المفقودات والموجودات": "Lost & Found Platform",
  "اعثر على ما فُقد.": "Find what was lost.",
  "وأعِده بأمان.": "Return it safely.",
  "يجمع FindBack البلاغات في مكان واحد، يقارن التفاصيل تلقائيًا، ويفتح قناة تواصل خاصة عندما تظهر مطابقة مناسبة.": "FindBack brings reports into one place, compares their details automatically, and opens a private channel when a suitable match is found.",
  "بلاغات موثّقة": "Structured Reports",
  "مطابقة واضحة": "Transparent Matching",
  "تواصل خاص": "Private Contact",
  "بلاغ موجود": "Found Report",
  "محفظة جلدية / سوداء": "Black Leather Wallet",
  "عمّان · تم إرفاق صورة": "Amman · Photo Attached",
  "مطابقة محتملة": "Potential Match",
  "الاسم · اللون · الموقع": "Name · Color · Location",
  "أنشئ البلاغ": "Create Report",
  "قارن التفاصيل": "Compare Details",
  "وافق على التواصل": "Approve Contact",
  "أكّد الاستلام": "Confirm Receipt",
  "من البلاغ إلى الاستعادة.": "From report to recovery.",
  "أربع خطوات واضحة.": "Four clear steps.",
  "كل خطوة مصممة لتقليل التخمين، حماية بيانات المستخدمين، وتسهيل الوصول إلى صاحب الغرض الصحيح.": "Every step reduces guesswork, protects user data, and helps the right owner recover the item.",
  "أنشئ بلاغًا واضحًا": "Create a Clear Report",
  "حدّد النوع والتصنيف واللون والموقع، وأرفق صورة حقيقية تساعد على التحقق.": "Add the type, category, color, location, and a real photo that supports verification.",
  "قارن التفاصيل تلقائيًا": "Compare Details Automatically",
  "يرتّب النظام البلاغات المقابلة حسب درجة التشابه بدل عرض نتائج عشوائية.": "The system ranks opposite report types by similarity instead of showing random results.",
  "لا تبدأ المحادثة الخاصة إلا بعد إرسال الطلب وقبوله من صاحب البلاغ.": "A private conversation starts only after the report owner accepts the contact request.",
  "أكّد الاستلام": "Confirm Recovery",
  "عند استعادة الغرض تُغلق البلاغات المرتبطة وتُحفظ الحالة ضمن السجل.": "Once the item is recovered, linked reports are closed and the outcome is recorded.",
  "مطابقة مبنية على التفاصيل،": "Matching built on evidence,",
  "لا على التخمين.": "not guesswork.",
  "يقارن FindBack بين بلاغ مفقود وبلاغ موجود، ثم يمنح كل نتيجة درجة واضحة بناءً على أربعة عوامل قابلة للتحقق.": "FindBack compares a lost report with a found report, then gives each result a clear score based on four verifiable factors.",
  "إنشاء بلاغ للمطابقة": "Create a Report to Match",
  "الحد الأدنى لإظهار النتيجة": "minimum score required",
  "لا نعرض كل شيء.": "Not every result is shown.",
  "نعرض النتائج الأقرب.": "Only the closest matches.",
  "تظهر المطابقة فقط عندما تجمع 50% أو أكثر، حتى يركّز المستخدم على البلاغات الأكثر ارتباطًا.": "A match appears only after reaching 50% or more, keeping attention on the most relevant reports.",
  "الصورة الواضحة": "A clear photo",
  "تسرّع التحقق.": "speeds up verification.",
  "صورة واضحة للون والخامة والعلامات المميزة.": "A clear view of color, material, and distinguishing marks.",
  "الموقع الأخير يضيّق نطاق البحث.": "The last known location narrows the search.",
  "الوصف الدقيق يرفع جودة المطابقة.": "A precise description improves match quality.",
  "كل بلاغ موثّق يزيد فرصة الاستعادة.": "Every structured report improves the chance of recovery.",
  "فقدت غرضًا أو عثرت على واحد؟": "Lost something or found an item?",
  "ابدأ البلاغ الآن.": "Start the report now.",
  "أنشئ حسابًا، أضف التفاصيل والصورة، ودع FindBack يرتّب لك النتائج الأقرب.": "Create an account, add the details and photo, and let FindBack rank the closest results.",
  "بلاغ واضح · مطابقة مرتبة · تواصل آمن": "Clear reports · Ranked matches · Secure contact",
  "بلاغاتك ومطابقاتك": "Your reports and matches",
  "في مساحة خاصة.": "in one private space.",
  "كل تفصيل": "Every detail",
  "يحسّن المطابقة.": "improves the match.",
  "اكتب معلومات يمكن لصاحب الغرض أو من عثر عليه التحقق منها بسهولة.": "Add information that the owner or finder can verify easily.",
  "محفظة جلدية ومفاتيح على طاولة خشبية": "Leather wallet and keys on a wooden table",
  "هاتف محمول حقيقي في مقهى": "A real mobile phone in a café",
  "محفظة ومفاتيح حقيقية": "A real wallet and keys",
  "هاتف محمول على طاولة مقهى": "A mobile phone on a café table",
  "مفاتيح ومحفظة جلدية": "Keys and a leather wallet",
  "حقيبة ظهر حقيقية على طاولة": "A real backpack on a table",
  "حقيبة ظهر حقيقية": "A real backpack",
  "0 سجل": "0 records",
  "هاتف محمول حقيقي على طاولة": "A real mobile phone on a table",
  "نظام الاستعادة": "Lost & Found Recovery",
  "استعادة تبدأ من دليل واضح": "Recovery starts with clear evidence",
  "من بلاغٍ دقيق": "From a precise report",
  "إلى استعادة آمنة.": "to a safe recovery.",
  "يساعد FindBack من فقد غرضًا ومن عثر عليه على توثيق التفاصيل، اكتشاف أقرب تطابق، والتواصل بخصوصية حتى اكتمال التسليم.": "FindBack helps people who lost or found an item document the details, discover the closest match, and communicate privately until the handover is complete.",
  "تفاصيل قابلة للتحقق": "Verifiable details",
  "نتائج مرتبة بالأقرب": "Closest results first",
  "تواصل بعد الموافقة": "Contact after approval",
  "تسليم حقيبة إلى صاحبتها في مكان عام": "A bag being returned to its owner in a public place",
  "حقيبة زرقاء صغيرة": "Small blue bag",
  "عمّان · صورة مرفقة": "Amman · Photo attached",
  "تطابق موثوق": "Reliable match",
  "الوصف · اللون · المكان": "Description · Color · Location",
  "خصوصية مدمجة": "Privacy by design",
  "أضف الدليل": "Add evidence",
  "راجع المطابقة": "Review the match",
  "رتّب التسليم": "Arrange the handover",
  "احفظ النتيجة": "Record the outcome",
  "أغلق البلاغ": "Close the report",
  "رحلة الاستعادة": "Recovery journey",
  "مسار مفهوم،": "A clear process,",
  "من دون خطوات مبهمة.": "without unclear steps.",
  "يبقى المستخدم داخل مسار واحد: يوثّق الغرض، يراجع الأدلة، يوافق على التواصل، ثم يؤكد الاستلام.": "The user stays in one flow: document the item, review the evidence, approve contact, then confirm receipt.",
  "01 / البلاغ": "01 / Report",
  "02 / المطابقة": "02 / Match",
  "03 / التواصل": "03 / Contact",
  "04 / الاستعادة": "04 / Recovery",
  "وثّق ما تعرفه": "Document what you know",
  "سجّل نوع الغرض ولونه ومكانه وتاريخه، وأضف صورة واضحة متى توفرت.": "Record the item type, color, location, and date, and add a clear photo whenever available.",
  "راجع أقرب النتائج": "Review the closest results",
  "تُقارن بلاغات المفقودات بالموجودات وتُرتب وفق إشارات يمكن تفسيرها.": "Lost and found reports are compared and ranked using explainable signals.",
  "احمِ بيانات الطرفين": "Protect both parties",
  "لا تُفتح المحادثة الخاصة إلا بعد إرسال طلب التواصل وقبوله.": "A private conversation opens only after the contact request is sent and accepted.",
  "أغلق الحالة بثقة": "Close the case with confidence",
  "بعد التسليم يؤكد المستلم العملية، وتُغلق البلاغات المرتبطة مع حفظ النتيجة.": "After handover, the recipient confirms the process and linked reports are closed with the outcome recorded.",
  "هاتف متروك على طاولة في مقهى": "A phone left on a café table",
  "مطابقة متعددة المعايير": "Multi-factor matching",
  "محرك المطابقة الهجين": "Hybrid matching engine",
  "كل نتيجة معها": "Every result has",
  "سبب واضح.": "a clear reason.",
  "يجمع FindBack بين بيانات البلاغ والتشابه البصري. النتيجة لا تعتمد على كلمة واحدة، بل على مجموعة أدلة تساعد المستخدم على اتخاذ قرار آمن.": "FindBack combines report data with visual similarity. A result is based on multiple pieces of evidence, not a single word, helping users make a safer decision.",
  "حد جودة النتائج": "Result quality threshold",
  "نتائج أقل،": "Fewer results,",
  "لكن أكثر صلة.": "but more relevant.",
  "لا تدخل النتيجة قائمة الاقتراحات إلا بعد تجاوز الحد المطلوب، حتى تبقى المراجعة مركّزة وقابلة للتحقق.": "A result enters the suggestions list only after passing the required threshold, keeping review focused and verifiable.",
  "تفاصيل من الواقع": "Real-world details",
  "صورة صغيرة،": "One clear photo",
  "قد تحسم المطابقة.": "can confirm the match.",
  "هاتف ومفاتيح ومحفظة وحقيبة مرتبة على سطح": "A phone, keys, wallet, and bag arranged on a surface",
  "01 / التفاصيل": "01 / Details",
  "اللون والخامة والعلامة الفارقة أدلة قابلة للمقارنة.": "Color, material, and distinguishing marks create comparable evidence.",
  "02 / المكان": "02 / Location",
  "آخر مكان معروف يضيّق نطاق البحث.": "The last known location narrows the search.",
  "تسليم حقيبة إلى صاحبتها": "A bag being returned to its owner",
  "03 / التواصل": "03 / Contact",
  "الموافقة تسبق تبادل أي معلومات خاصة.": "Approval comes before any private information is exchanged.",
  "مسار الاستعادة": "Recovery flow",
  "بلاغ\n← مطابقة\n← استعادة": "Report\n→ Match\n→ Recovery",
  "حقيبة على مقعد داخل مكتبة": "A bag on a library seat",
  "04 / الصورة": "04 / Photo",
  "الصورة الواقعية تسرّع التحقق عند ظهور النتيجة.": "A real photo speeds up verification when a result appears.",
  "ابدأ الآن": "Start now",
  "كل استعادة ناجحة": "Every successful recovery",
  "تبدأ ببلاغ واضح.": "starts with a clear report.",
  "أنشئ حسابًا، أضف ما تعرفه، وراجع النتائج التي يستطيع النظام تفسيرها لك.": "Create an account, add what you know, and review results the system can explain.",
  "بلاغ · مطابقة · استعادة": "Report · Match · Recovery",
  "منصة الاستعادة": "Recovery platform",
  "بلاغ واضح · مطابقة مفسّرة · تواصل آمن": "Clear report · Explainable match · Secure contact",
  "تسليم غرض إلى صاحبته": "An item being returned to its owner",
  "دخول آمن": "Secure access",
  "دخول المستخدم": "Member access",
  "مستخدم جديد": "New member",
  "مساحة المستخدم": "Member space",
  "الرؤية والبيانات": "Vision and data",
  "نظرة عامة": "Overview",
  "مساحتك الشخصية": "Your personal workspace",
  "مجموعة أغراض شخصية مصورة بوضوح": "A clearly photographed set of personal items",
  "مطابقة مباشرة": "Live matching",
  "أقرب النتائج لبلاغاتك": "Closest results for your reports",
  "بلاغ جديد": "New report",
  "حقيبة متروكة على مقعد داخل مكتبة": "A bag left on a library seat",
  "بلاغ ← استعادة": "Report → Recovery",
  "الرؤية الذكية / هجين 65+35": "FindBack Vision / Hybrid 65+35",
  "مطابقات الرؤية الذكية": "FindBack Vision Matches",
  "بلاغ": "Report",
  "← مطابقة": "→ Match",
  "← استعادة": "→ Recovery",
  "هاتف متروك على طاولة مقهى": "A phone left on a café table",
  "حقيبة خضراء صغيرة": "Small green bag",
  "أغراض شخصية مصورة بوضوح": "Clearly photographed personal items"
};

const arabicInterfaceTranslations = {
  "REPORT QUALITY / 07": "جودة البلاغ",
  "STATUS FLOW": "مسار الحالة",
  "NETWORK FEED": "أحدث البلاغات",
  "REPORT NETWORK": "شبكة البلاغات",
  "MY REPORTS": "بلاغاتي",
  "TRUSTED CONNECTION": "تواصل موثوق",
  "INCOMING": "الواردة",
  "OUTGOING": "المرسلة",
  "ADMIN SUPPORT / DIRECT": "دعم الإدارة",
  "CONVERSATIONS": "المحادثات",
  "PRIVATE CHANNEL": "قناة خاصة",
  "NOTIFICATION CENTER": "مركز الإشعارات",
  "ADMIN / CONTROL": "الإدارة",
  "PLATFORM CONTROL": "إدارة المنصة",
  "API CONNECTED": "النظام متصل",
  "SYSTEM / TODAY": "اليوم",
  "COMMAND CENTER / LIVE": "مركز القيادة",
  "LIVE DATA": "بيانات مباشرة",
  "LIVE PLATFORM DATA": "بيانات المنصة المباشرة",
  "STATUS DISTRIBUTION": "توزيع الحالات",
  "REPORT BALANCE": "توازن البلاغات",
  "LATEST SIGNALS": "أحدث البلاغات",
  "REPORT OPERATIONS": "عمليات البلاغات",
  "PLATFORM ANALYTICS": "تحليلات المنصة",
  "CATEGORY VOLUME": "حجم التصنيفات",
  "TOP LOCATIONS": "أكثر المواقع نشاطًا",
  "REPORT TIMELINE": "الخط الزمني للبلاغات",
  "RESOLUTION RATE": "معدل الإنجاز",
  "ACTIVITY & ALERTS": "النشاط والتنبيهات",
  "ACTIVITY FEED": "سجل النشاط",
  "REVIEW QUEUE": "قائمة المراجعة",
  "SUPPORT CHANNELS": "قنوات الدعم",
  "SUPPORT INBOX": "صندوق الدعم",
  "ADMIN CHANNEL": "قناة الإدارة",
  "ADMIN NOTIFICATIONS": "إشعارات الإدارة",
  "FINDBACK VISION / HYBRID 65+35": "الرؤية الذكية / هجين 65+35",
  "Admin": "مدير النظام",
  "PENDING REQUESTS": "طلبات قيد الانتظار",
  "ACCEPTED LINKS": "روابط تواصل مقبولة",
  "UNREAD MESSAGES": "رسائل غير مقروءة",
  "NEW NOTICES": "إشعارات جديدة"
};

const originalTextNodes = new WeakMap();
const originalAttributes = new WeakMap();
const translatableAttributes = ["placeholder", "aria-label", "alt", "title", "content"];

function isEnglish() {
  return state.language === "en";
}

function localeCode() {
  return isEnglish() ? "en-US" : "ar-JO";
}

function ui(arabicText) {
  return isEnglish() ? (englishTranslations[arabicText] || translateDynamicText(arabicText)) : arabicText;
}

function translateDynamicText(text) {
  let match;
    if (text === "طلب تواصل جديد") return "New Contact Request";
  if ((match = text.match(/^لديك رسالة جديدة من (.+?)[.]?$/)))
    return `You have a new message from ${match[1]}.`;
  if ((match = text.match(/^لديك طلب تواصل جديد بخصوص (.+?)[.]?$/)))
    return `You have a new contact request regarding ${match[1]}.`;
  if ((match = text.match(/^مرحبًا (.+)، هذه الصورة الكاملة للنظام\.$/))) return `Welcome ${match[1]}, here is the complete system overview.`;
  if ((match = text.match(/^أهلًا (.+)، هذه مساحة بلاغاتك\.$/))) return `Welcome ${match[1]}, this is your reports space.`;
  if ((match = text.match(/^منذ (\d+) ساعة$/))) return `${match[1]} hour${match[1] === "1" ? "" : "s"} ago`;
  if ((match = text.match(/^منذ (\d+) يوم$/))) return `${match[1]} day${match[1] === "1" ? "" : "s"} ago`;
  if ((match = text.match(/^(\d+) سجل$/))) return `${match[1]} record${match[1] === "1" ? "" : "s"}`;
  if ((match = text.match(/^(\d+) بلاغات$/))) return `${match[1]} reports`;
  if ((match = text.match(/^(\d+) بلاغ مفتوح بلا صورة$/))) return `${match[1]} open report${match[1] === "1" ? "" : "s"} without a photo`;
  if ((match = text.match(/^(\d+) بلاغ مفتوح منذ أكثر من أسبوع$/))) return `${match[1]} open report${match[1] === "1" ? "" : "s"} older than one week`;
  if ((match = text.match(/^(\d+) بلاغ بانتظار الإغلاق$/))) return `${match[1]} report${match[1] === "1" ? "" : "s"} awaiting closure`;
  if ((match = text.match(/^مفقود #(\d+) · موجود #(\d+)$/))) return `Lost #${match[1]} · Found #${match[2]}`;
  if ((match = text.match(/^طلب تواصل #(\d+)$/))) return `Contact Request #${match[1]}`;
  if ((match = text.match(/^صورة (.+)$/))) return `Photo of ${match[1]}`;
  if ((match = text.match(/^حالة البلاغ (\d+)$/))) return `Report ${match[1]} status`;
  if ((match = text.match(/^لديك رسالة جديدة من (.+)\.$/))) return `You have a new message from ${match[1]}.`;
  if ((match = text.match(/^أرسل (.+) رسالة إلى الدعم\.$/))) return `${match[1]} sent a support message.`;
  if ((match = text.match(/^محادثة دعم(?: · بلاغ #(\d+))?( · مغلقة)?$/))) return `Support Conversation${match[1] ? ` · Report #${match[1]}` : ""}${match[2] ? " · Closed" : ""}`;
  if ((match = text.match(/^محادثة مطابقة · بلاغ #(.+?)( · اكتملت الاستعادة)?$/))) return `Match Conversation · Report #${match[1]}${match[2] ? " · Recovery Complete" : ""}`;
  if ((match = text.match(/^(.+) · الحالة (مفتوح|متطابق|مغلق)$/))) return `${match[1]} · Status: ${englishTranslations[match[2]]}`;
  return text;
}

function translateTextValue(value) {
  if (!value) return value;
  const core = value.trim();
  if (!core) return value;
  const translated = isEnglish()
    ? (englishTranslations[core] || translateDynamicText(core))
    : (arabicInterfaceTranslations[core] || core);
  if (translated === core) return value;
  return `${value.match(/^\s*/)?.[0] || ""}${translated}${value.match(/\s*$/)?.[0] || ""}`;
}

function translateTextNode(node) {
  if (!originalTextNodes.has(node)) originalTextNodes.set(node, node.nodeValue);
  const original = originalTextNodes.get(node);
  node.nodeValue = translateTextValue(original);
}

function translateElementAttributes(element) {
  if (!originalAttributes.has(element)) originalAttributes.set(element, {});
  const originals = originalAttributes.get(element);
  translatableAttributes.forEach((attribute) => {
    if (!element.hasAttribute(attribute)) return;
    if (!(attribute in originals)) originals[attribute] = element.getAttribute(attribute);
    element.setAttribute(attribute, translateTextValue(originals[attribute]));
  });
}

function translateSubtree(root) {
  if (root.nodeType === Node.TEXT_NODE) {
    if (!root.parentElement?.closest("script, style")) translateTextNode(root);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
  const elementRoot = root.nodeType === Node.ELEMENT_NODE ? root : root.documentElement;
  translateElementAttributes(elementRoot);
  elementRoot.querySelectorAll("*").forEach(translateElementAttributes);
  const walker = document.createTreeWalker(elementRoot, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.parentElement?.closest("script, style") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }
  });
  while (walker.nextNode()) translateTextNode(walker.currentNode);
}

function applyLanguage() {
  document.documentElement.lang = state.language;
  document.documentElement.dir = isEnglish() ? "ltr" : "rtl";
  translateSubtree(document);
  document.querySelectorAll("[data-language-toggle]").forEach((button) => {
    button.textContent = isEnglish() ? "AR" : "EN";
    button.setAttribute("aria-label", isEnglish() ? "Switch to Arabic" : "التبديل إلى الإنجليزية");
  });
}

function refreshLocalizedView() {
  if (!state.user) return;
  const firstName = state.user.full_name.trim().split(" ")[0];
  if (state.user.role === "admin") {
    document.getElementById("adminGreeting").textContent = isEnglish()
      ? `Welcome ${firstName}, here is the complete system overview.`
      : `مرحبًا ${firstName}، هذه الصورة الكاملة للنظام.`;
    document.getElementById("adminDate").textContent = new Intl.DateTimeFormat(localeCode(), { weekday: "long", day: "numeric", month: "long" }).format(new Date());
    showAdminView(document.querySelector(".active-admin-view")?.id || "adminOverview");
  } else {
    document.getElementById("userWelcomeTitle").textContent = isEnglish()
      ? `Welcome ${firstName}, this is your reports space.`
      : `أهلًا ${firstName}، هذه مساحة بلاغاتك.`;
    document.getElementById("userDate").textContent = new Intl.DateTimeFormat(localeCode(), { weekday: "long", day: "numeric", month: "long" }).format(new Date());
    showUserView(document.querySelector(".active-user-view")?.id || "userDashboard");
  }
}

function toggleLanguage() {
  state.language = isEnglish() ? "ar" : "en";
  localStorage.setItem("findback_language", state.language);
  applyLanguage();
  refreshLocalizedView();
}

const els = {
  publicSite: document.getElementById("publicSite"),
  authModal: document.getElementById("authModal"),
  loginTab: document.getElementById("loginTab"),
  registerTab: document.getElementById("registerTab"),
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  userShell: document.getElementById("userShell"),
  adminShell: document.getElementById("adminShell"),
  userStatsGrid: document.getElementById("userStatsGrid"),
  smartMatchList: document.getElementById("smartMatchList"),
  userRecentGrid: document.getElementById("userRecentGrid"),
  allReportsGrid: document.getElementById("allReportsGrid"),
  myReportsGrid: document.getElementById("myReportsGrid"),
  createReportForm: document.getElementById("createReportForm"),
  matchesModal: document.getElementById("matchesModal"),
  matchesContent: document.getElementById("matchesContent"),
  statisticsGrid: document.getElementById("statisticsGrid"),
  adminReportsTable: document.getElementById("adminReportsTable"),
  incomingRequests: document.getElementById("incomingRequests"),
  outgoingRequests: document.getElementById("outgoingRequests"),
  communicationSummary: document.getElementById("communicationSummary"),
  userConversationList: document.getElementById("userConversationList"),
  userMessagesList: document.getElementById("userMessagesList"),
  adminConversationList: document.getElementById("adminConversationList"),
  adminMessagesList: document.getElementById("adminMessagesList"),
  userNotificationList: document.getElementById("userNotificationList"),
  adminNotificationList: document.getElementById("adminNotificationList"),
  toast: document.getElementById("toast")
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function errorMessage(detail) {
  if (Array.isArray(detail)) return detail.map((item) => item.msg || "بيانات غير صحيحة").join("، ");
  return detail || "حدث خطأ غير متوقع";
}

async function api(path, options = {}) {
  const request = { ...options };
  const headers = new Headers(request.headers || {});
  if (state.token) headers.set("Authorization", `Bearer ${state.token}`);
  if (request.body && !(request.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    if (typeof request.body !== "string") request.body = JSON.stringify(request.body);
  }
  request.headers = headers;
  const response = await fetch(`${API_BASE}${path}`, request);
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(errorMessage(data?.detail));
  return data;
}

function showToast(message, type = "success") {
  clearTimeout(state.toastTimer);
  els.toast.textContent = message;
  els.toast.classList.toggle("error", type === "error");
  els.toast.classList.add("show");
  state.toastTimer = setTimeout(() => els.toast.classList.remove("show"), 3600);
}

function setButtonLoading(button, loading, label = "جاري التنفيذ...") {
  if (!button) return;
  if (loading) {
    button.dataset.original = button.innerHTML;
    button.innerHTML = label;
    button.disabled = true;
  } else {
    button.innerHTML = button.dataset.original || button.innerHTML;
    button.disabled = false;
  }
}

function formatDate(value, short = false) {
  if (!value) return ui("غير محدد");
  return new Intl.DateTimeFormat(localeCode(), short
    ? { month: "short", day: "numeric" }
    : { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return ui("الآن");
  return new Intl.DateTimeFormat(localeCode(), {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
  }).format(new Date(value));
}

function timeAgo(value) {
  if (!value) return ui("الآن");
  const hours = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 3600000));
  if (hours < 1) return ui("منذ أقل من ساعة");
  if (hours < 24) return isEnglish() ? `${hours} hour${hours === 1 ? "" : "s"} ago` : `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return isEnglish() ? `${days} day${days === 1 ? "" : "s"} ago` : `منذ ${days} يوم`;
}

function imageUrl(path) {
  if (!path || path === "string") return "";
  const realImageAssets = {
    "assets/hero-signal-v4.webp": "https://images.unsplash.com/photo-1675582090584-4ae9400f7326?auto=format&fit=crop&w=1600&q=86",
    "assets/user-objects-v4.webp": "https://images.unsplash.com/photo-1675582090584-4ae9400f7326?auto=format&fit=crop&w=1400&q=86",
    "assets/phone-scene-v2.webp": "https://images.unsplash.com/photo-1570581279607-c6b53be50dda?auto=format&fit=crop&w=1400&q=86",
    "assets/keys-wallet-v2.webp": "https://images.unsplash.com/photo-1675582090584-4ae9400f7326?auto=format&fit=crop&w=1400&q=86",
    "assets/campus-bag-v2.webp": "https://images.unsplash.com/photo-1561126135-b7a5dfadace6?auto=format&fit=crop&w=1400&q=86"
  };
  if (realImageAssets[path]) return realImageAssets[path];
  if (/^https?:\/\//i.test(path) || path.startsWith("assets/")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

function loadingState() {
  return '<div class="loading-state">جاري تحميل البيانات...</div>';
}

function emptyState(title, text, icon = "◇") {
  return `<div class="empty-state"><span>${icon}</span><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div></div>`;
}

function errorState(message) {
  return `<div class="error-state"><span>!</span><div><h3>تعذّر تحميل البيانات</h3><p>${escapeHtml(message)}</p></div></div>`;
}

function reportCard(report, options = {}) {
  const src = imageUrl(report.image_url);
  const actions = [];
  if (report.status === "open") {
    actions.push(`<button class="neon-button small-button" data-action="matches" data-id="${report.id}">عرض المطابقات</button>`);
  }
  if (options.mine && report.status === "open") {
    actions.push(`<button class="outline-button small-button" data-action="upload" data-id="${report.id}">رفع صورة</button>`);
  }
  if (options.mine) actions.push(`<button class="danger-button small-button" data-action="delete" data-id="${report.id}">حذف</button>`);

  return `<article class="report-card">
    <div class="report-image">
      ${src ? `<img src="${escapeHtml(src)}" alt="صورة ${escapeHtml(report.item_name)}" loading="lazy">` : `<div class="report-placeholder">${dictionary.icon[report.category] || "◇"}</div>`}
      <span class="report-type-badge type-${escapeHtml(report.report_type)}">${dictionary.type[report.report_type] || escapeHtml(report.report_type)}</span>
    </div>
    <div class="report-body">
      <div class="report-meta"><span class="category-label">${dictionary.category[report.category] || escapeHtml(report.category)}</span><span class="status-badge status-${escapeHtml(report.status)}">${dictionary.status[report.status] || escapeHtml(report.status)}</span></div>
      <h3>${escapeHtml(report.item_name)}</h3>
      <p class="report-description">${escapeHtml(report.description)}</p>
      <div class="report-details"><span>⌖ ${escapeHtml(report.location)}</span><span>● ${escapeHtml(report.color || "غير محدد")}</span><span>◷ ${formatDate(report.item_date)}</span></div>
      ${actions.length ? `<div class="report-actions">${actions.join("")}</div>` : ""}
    </div>
  </article>`;
}

function renderReports(target, reports, options = {}) {
  if (!reports.length) {
    target.innerHTML = emptyState(options.emptyTitle || "لا توجد بلاغات", options.emptyText || "ابدأ ببلاغ جديد أو غيّر خيارات البحث.");
    return;
  }
  target.innerHTML = reports.map((report) => reportCard(report, options)).join("");
}

function saveSession(token, user) {
  state.token = token;
  state.user = user;
  sessionStorage.setItem("findback_token", token);
  sessionStorage.setItem("findback_user", JSON.stringify(user));
}

function clearSession() {
  state.token = "";
  state.user = null;
  state.adminReports = [];
  state.adminStats = null;
  state.userConversations = [];
  state.adminConversations = [];
  state.currentUserConversationId = null;
  state.currentAdminConversationId = null;
  clearInterval(state.backgroundTimer);
  state.backgroundTimer = null;
  sessionStorage.removeItem("findback_token");
  sessionStorage.removeItem("findback_user");
}

function setMode(mode) {
  els.publicSite.classList.toggle("hidden", mode !== "public");
  els.userShell.classList.toggle("hidden", mode !== "user");
  els.adminShell.classList.toggle("hidden", mode !== "admin");
  document.body.classList.toggle("admin-mode", mode === "admin");
  window.scrollTo({ top: 0, behavior: "auto" });
}

function openAuth(tab = "login") {
  if (tab === "register") els.registerTab.click(); else els.loginTab.click();
  els.authModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeAuth() {
  els.authModal.classList.add("hidden");
  document.body.style.overflow = "";
}

function showPublic() {
  setMode("public");
  closeAuth();
}

async function enterApp(user = state.user) {
  try {
    const currentUser = user?.role && user?.full_name ? user : await api("/users/me");
    state.user = currentUser;
    sessionStorage.setItem("findback_user", JSON.stringify(currentUser));
    closeAuth();
    const firstName = currentUser.full_name.trim().split(" ")[0];
    if (currentUser.role === "admin") {
      setMode("admin");
      document.getElementById("adminName").textContent = currentUser.full_name;
      document.getElementById("adminInitial").textContent = currentUser.full_name.trim().charAt(0).toUpperCase();
      document.getElementById("adminGreeting").textContent = isEnglish()
        ? `Welcome ${firstName}, here is the complete system overview.`
        : `مرحبًا ${firstName}، هذه الصورة الكاملة للنظام.`;
      document.getElementById("adminDate").textContent = new Intl.DateTimeFormat(localeCode(), { weekday: "long", day: "numeric", month: "long" }).format(new Date());
      showAdminView("adminOverview");
    } else {
      setMode("user");
      document.getElementById("userName").textContent = currentUser.full_name;
      document.getElementById("userInitial").textContent = currentUser.full_name.trim().charAt(0).toUpperCase();
      document.getElementById("userWelcomeTitle").textContent = isEnglish()
        ? `Welcome ${firstName}, this is your reports space.`
        : `أهلًا ${firstName}، هذه مساحة بلاغاتك.`;
      document.getElementById("userDate").textContent = new Intl.DateTimeFormat(localeCode(), { weekday: "long", day: "numeric", month: "long" }).format(new Date());
      showUserView("userDashboard");
    }
    await refreshBadges();
    startBackgroundUpdates();
  } catch (error) {
    clearSession();
    showPublic();
    showToast("انتهت الجلسة، سجّل الدخول من جديد.", "error");
  }
}

const userPageTitles = {
  userDashboard: "لوحة المتابعة",
  userExplore: "استكشف البلاغات",
  userCreate: "بلاغ جديد",
  userMine: "بلاغاتي",
  userConnect: "مركز التواصل",
  userNotifications: "الإشعارات"
};

function showUserView(viewId) {
  if (!state.token) return openAuth("login");
  document.querySelectorAll(".user-view").forEach((view) => view.classList.toggle("active-user-view", view.id === viewId));
  document.querySelectorAll("[data-user-view]").forEach((button) => button.classList.toggle("active", button.dataset.userView === viewId && button.closest(".side-nav")));
  document.getElementById("userPageTitle").textContent = userPageTitles[viewId] || "FindBack";
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (viewId === "userDashboard") loadUserDashboard();
  if (viewId === "userExplore") loadAllReports();
  if (viewId === "userMine") loadMyReports();
  if (viewId === "userConnect") loadUserCommunication();
  if (viewId === "userNotifications") loadNotifications("user");
}

const adminPageTitles = {
  adminOverview: "مركز القيادة",
  adminReports: "إدارة البلاغات",
  adminAnalytics: "تحليلات المنصة",
  adminActivity: "النشاط والتنبيهات",
  adminMessages: "محادثات الدعم",
  adminNotifications: "إشعارات الإدارة"
};

function showAdminView(viewId) {
  if (state.user?.role !== "admin") return;
  document.querySelectorAll(".admin-view").forEach((view) => view.classList.toggle("active-admin-view", view.id === viewId));
  document.querySelectorAll("[data-admin-view]").forEach((button) => button.classList.toggle("active", button.dataset.adminView === viewId && button.closest("nav")));
  document.getElementById("adminPageTitle").textContent = adminPageTitles[viewId] || "لوحة الإدارة";
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (["adminOverview", "adminReports", "adminAnalytics", "adminActivity"].includes(viewId)) loadAdminDashboard();
  if (viewId === "adminMessages") loadAdminConversations();
  if (viewId === "adminNotifications") loadNotifications("admin");
}

async function loadUserDashboard() {
  els.userStatsGrid.innerHTML = loadingState();
  els.smartMatchList.innerHTML = loadingState();
  els.userRecentGrid.innerHTML = loadingState();
  try {
    const [mine, all] = await Promise.all([api("/users/me/reports"), api("/reports")]);
    const openMine = mine.filter((report) => report.status === "open");
    const matchSets = await Promise.all(openMine.slice(0, 3).map(async (report) => {
      try { return { report, matches: await api(`/reports/${report.id}/matches`) }; }
      catch (_) { return { report, matches: [] }; }
    }));
    const strongest = matchSets.reduce((top, item) => Math.max(top, Number(item.matches[0]?.match_score) || 0), 0);
    renderUserStats(mine, strongest);
    renderSmartMatches(matchSets);
    renderReports(els.userRecentGrid, all.filter((report) => report.status === "open").slice(0, 3), { emptyTitle: "لا توجد بلاغات مفتوحة", emptyText: "لا توجد إشارات جديدة في الشبكة حاليًا." });
  } catch (error) {
    els.userStatsGrid.innerHTML = errorState(error.message);
    els.smartMatchList.innerHTML = errorState(error.message);
    els.userRecentGrid.innerHTML = errorState(error.message);
  }
}

function renderUserStats(reports, strongest) {
  const data = [
    ["إجمالي بلاغاتي", reports.length, "◎", "var(--violet)"],
    ["قيد البحث", reports.filter((r) => r.status === "open").length, "⌕", "var(--orange)"],
    ["تمت مطابقتها", reports.filter((r) => r.status === "matched").length, "◇", "var(--acid)"],
    ["أقوى نتيجة", `${strongest}%`, "%", "var(--cyan)"]
  ];
  els.userStatsGrid.innerHTML = data.map(([label, value, icon, color]) => `<article class="user-stat" style="--stat-color:${color}"><header><span>${label}</span><i>${icon}</i></header><strong>${value}</strong><small>تحديث مباشر من حسابك</small></article>`).join("");
}

function miniObject(report) {
  const src = imageUrl(report?.image_url);
  return `<div class="mini-object">${src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(report.item_name)}">` : dictionary.icon[report?.category] || "◇"}</div>`;
}

function renderSmartMatches(matchSets) {
  if (!matchSets.length) {
    els.smartMatchList.innerHTML = emptyState("لا توجد بلاغات مفتوحة", "أضف بلاغًا جديدًا وسيظهر مسار مطابقته هنا.", "＋");
    return;
  }
  els.smartMatchList.innerHTML = matchSets.map(({ report, matches }) => {
    const match = matches[0];
    return `<article class="smart-match-row"><div class="match-side">${miniObject(report)}<p><strong>${escapeHtml(report.item_name)}</strong><small>بلاغك · ${escapeHtml(report.location)}</small></p></div><div class="match-connector"></div>${match ? `<div class="match-side">${miniObject(match)}<p><strong>${escapeHtml(match.item_name)}</strong><small>أقرب نتيجة · ${escapeHtml(match.location)}</small></p></div><button class="match-score-box" data-action="matches" data-id="${report.id}"><strong>${Number(match.match_score) || 0}%</strong><small>عرض النتائج</small></button>` : `<div class="match-side"><div class="mini-object">···</div><p><strong>جاري تتبع الإشارات</strong><small>لم تتجاوز أي نتيجة حد 50%</small></p></div><button class="match-score-box" data-action="matches" data-id="${report.id}"><strong>0%</strong><small>فحص النتائج</small></button>`}</article>`;
  }).join("");
}

async function loadAllReports() {
  els.allReportsGrid.innerHTML = loadingState();
  const type = document.getElementById("reportTypeFilter").value;
  const search = document.getElementById("reportSearch").value.trim();
  const params = new URLSearchParams();
  if (type) params.set("report_type", type);
  if (search) params.set("search", search);
  try {
    const reports = await api(`/reports${params.toString() ? `?${params}` : ""}`);
    renderReports(els.allReportsGrid, reports.filter((report) => report.status === "open"));
  } catch (error) { els.allReportsGrid.innerHTML = errorState(error.message); }
}

async function loadMyReports() {
  els.myReportsGrid.innerHTML = loadingState();
  try {
    const reports = await api("/users/me/reports");
    renderReports(els.myReportsGrid, reports, { mine: true, emptyTitle: "لا توجد بلاغات في حسابك", emptyText: "ابدأ بإنشاء أول بلاغ لتشغيل محرك المطابقة." });
  } catch (error) { els.myReportsGrid.innerHTML = errorState(error.message); }
}

function setBadge(id, value) {
  const badge = document.getElementById(id);
  if (!badge) return;
  const count = Number(value) || 0;
  badge.textContent = count > 99 ? "99+" : count;
  badge.classList.toggle("hidden", count < 1);
}

async function refreshBadges() {
  if (!state.token || !state.user) return;
  try {
    const [notifications, conversations] = await Promise.all([
      api("/notifications"), api("/conversations")
    ]);
    const unreadNotifications = notifications.filter((item) => !item.is_read).length;
    const unreadMessages = conversations.reduce((total, item) => total + (Number(item.unread_count) || 0), 0);
    if (state.user.role === "admin") {
      setBadge("adminNotificationBadge", unreadNotifications);
      setBadge("adminMessageBadge", unreadMessages);
    } else {
      let pendingRequests = 0;
      try {
        const incoming = await api("/contact-requests/incoming");
        pendingRequests = incoming.filter((item) => item.status === "pending").length;
      } catch (_) { pendingRequests = 0; }
      setBadge("userNotificationBadge", unreadNotifications);
      setBadge("userCommunicationBadge", unreadMessages + pendingRequests);
    }
  } catch (_) {
    // Badges are helpful but must never block the main interface.
  }
}

function startBackgroundUpdates() {
  clearInterval(state.backgroundTimer);
  state.backgroundTimer = setInterval(refreshBadges, 25000);
}

function renderCommunicationSummary(incoming, outgoing, conversations, notifications) {
  const pendingIncoming = incoming.filter((item) => item.status === "pending").length;
  const accepted = outgoing.filter((item) => item.status === "accepted").length;
  const unreadMessages = conversations.reduce((total, item) => total + (Number(item.unread_count) || 0), 0);
  const unreadNotifications = notifications.filter((item) => !item.is_read).length;
  const cards = [
    ["وارد بانتظارك", pendingIncoming, "PENDING REQUESTS", "var(--orange)"],
    ["طلبات مقبولة", accepted, "ACCEPTED LINKS", "var(--acid)"],
    ["رسائل غير مقروءة", unreadMessages, "UNREAD MESSAGES", "var(--violet)"],
    ["إشعارات جديدة", unreadNotifications, "NEW NOTICES", "var(--cyan)"]
  ];
  els.communicationSummary.innerHTML = cards.map(([label, value, code, color]) => `<article class="communication-stat" style="--accent:${color}"><span>${label}</span><strong>${value}</strong><small>${code}</small></article>`).join("");
}

function renderContactRequests(target, requests, incoming = false) {
  if (!requests.length) {
    target.innerHTML = '<div class="request-item"><p><strong>لا توجد طلبات</strong><small>ستظهر هنا عند وجود مطابقة.</small></p></div>';
    return;
  }
  target.innerHTML = requests.map((request) => {
    const details = isEnglish()
  ? `Lost #${request.lost_report_id} · Found #${request.found_report_id}`
  : `مفقود #${request.lost_report_id} · موجود #${request.found_report_id}`;
    const action = incoming && request.status === "pending"
      ? `<div class="request-actions"><button class="request-accept" data-request-status="accepted" data-request-id="${request.id}">قبول</button><button class="request-reject" data-request-status="rejected" data-request-id="${request.id}">رفض</button></div>`
      : `<span class="request-status ${escapeHtml(request.status)}">${dictionary.requestStatus[request.status] || escapeHtml(request.status)}</span>`;
    return `<article class="request-item"><p><strong>طلب تواصل #${request.id}</strong><small>${details} · ${formatDateTime(request.created_at)}</small></p>${action}</article>`;
  }).join("");
}

function fillSupportReports(reports) {
  const select = document.getElementById("supportReportSelect");
  const current = select.value;
  select.innerHTML = '<option value="">بدون بلاغ محدد</option>' + reports.map((report) => `<option value="${report.id}">#${report.id} · ${escapeHtml(report.item_name)} · ${ui(dictionary.type[report.report_type] || report.report_type)}</option>`).join("");
  if ([...select.options].some((option) => option.value === current)) select.value = current;
}

async function loadUserCommunication() {
  els.incomingRequests.innerHTML = loadingState();
  els.outgoingRequests.innerHTML = loadingState();
  els.userConversationList.innerHTML = loadingState();
  try {
    const [incoming, outgoing, conversations, reports, notifications] = await Promise.all([
      api("/contact-requests/incoming"), api("/contact-requests/outgoing"),
      api("/conversations"), api("/users/me/reports"), api("/notifications")
    ]);
    state.userConversations = conversations;
    renderCommunicationSummary(incoming, outgoing, conversations, notifications);
    renderContactRequests(els.incomingRequests, incoming, true);
    renderContactRequests(els.outgoingRequests, outgoing, false);
    fillSupportReports(reports);
    renderConversationList("user");
    setBadge("userCommunicationBadge", incoming.filter((item) => item.status === "pending").length + conversations.reduce((sum, item) => sum + (Number(item.unread_count) || 0), 0));
    setBadge("userNotificationBadge", notifications.filter((item) => !item.is_read).length);
    if (state.currentUserConversationId && conversations.some((item) => item.id === state.currentUserConversationId)) {
      await openConversation("user", state.currentUserConversationId);
    }
  } catch (error) {
    els.incomingRequests.innerHTML = errorState(error.message);
    els.outgoingRequests.innerHTML = errorState(error.message);
    els.userConversationList.innerHTML = errorState(error.message);
  }
}

async function updateContactRequest(requestId, nextStatus, button) {
  setButtonLoading(button, true, "...");
  try {
    await api(`/contact-requests/${requestId}`, { method: "PATCH", body: { status: nextStatus } });
    showToast(nextStatus === "accepted" ? "تم قبول الطلب وإنشاء محادثة خاصة." : "تم رفض طلب التواصل.");
    await loadUserCommunication();
  } catch (error) { showToast(error.message, "error"); }
  finally { setButtonLoading(button, false); }
}

async function createContactRequest(requesterReportId, matchedReportId, button) {
  setButtonLoading(button, true, "جاري الإرسال...");
  try {
    await api("/contact-requests", { method: "POST", body: {
      requester_report_id: requesterReportId,
      matched_report_id: matchedReportId
    }});
    showToast("تم إرسال طلب التواصل لصاحب البلاغ.");
    els.matchesModal.classList.add("hidden");
    document.body.style.overflow = "";
    showUserView("userConnect");
  } catch (error) { showToast(error.message, "error"); }
  finally { setButtonLoading(button, false); }
}

function conversationState(mode) {
  return mode === "admin"
    ? { conversations: state.adminConversations, current: state.currentAdminConversationId, list: els.adminConversationList }
    : { conversations: state.userConversations, current: state.currentUserConversationId, list: els.userConversationList };
}

function renderConversationList(mode) {
  const config = conversationState(mode);
  if (!config.conversations.length) {
    config.list.innerHTML = '<div class="request-item"><p><strong>لا توجد محادثات</strong><small>ابدأ بطلب تواصل أو رسالة دعم.</small></p></div>';
    return;
  }
  config.list.innerHTML = config.conversations.map((conversation) => {
    const unread = Number(conversation.unread_count) || 0;
    const support = conversation.conversation_type === "support";
    const name = conversation.other_user_name || (support ? "FindBack Admin" : "مستخدم FindBack");
    return `<button class="conversation-entry ${support ? "support-entry" : ""} ${config.current === conversation.id ? "active" : ""}" data-open-conversation="${conversation.id}" data-conversation-mode="${mode}"><span class="conversation-avatar">${escapeHtml(name.trim().charAt(0).toUpperCase() || "F")}</span><p><strong>${escapeHtml(name)}</strong><small>${escapeHtml(conversation.last_message || (support ? "محادثة دعم" : "محادثة مطابقة"))}</small></p><span>${formatDate(conversation.created_at, true)}${unread ? `<b>${unread}</b>` : ""}</span></button>`;
  }).join("");
}

function chatElements(mode) {
  const prefix = mode === "admin" ? "admin" : "user";
  return {
    empty: document.getElementById(`${prefix}ChatEmpty`),
    active: document.getElementById(`${prefix}ChatActive`),
    avatar: document.getElementById(`${prefix}ChatAvatar`),
    name: document.getElementById(`${prefix}ChatName`),
    meta: document.getElementById(`${prefix}ChatMeta`),
    messages: mode === "admin" ? els.adminMessagesList : els.userMessagesList
  };
}

async function openConversation(mode, conversationId) {
  const config = conversationState(mode);
  const conversation = config.conversations.find((item) => item.id === Number(conversationId));
  if (!conversation) return;
  if (mode === "admin") state.currentAdminConversationId = conversation.id;
  else state.currentUserConversationId = conversation.id;
  renderConversationList(mode);
  const chat = chatElements(mode);
  const name = conversation.other_user_name || "مستخدم FindBack";
  chat.empty.classList.add("hidden");
  chat.active.classList.remove("hidden");
  chat.avatar.textContent = name.trim().charAt(0).toUpperCase() || "F";
  chat.name.textContent = name;
  const isClosed = conversation.status !== "active";
  chat.meta.textContent = conversation.conversation_type === "support"
    ? `محادثة دعم${conversation.report_id ? ` · بلاغ #${conversation.report_id}` : ""}${isClosed ? " · مغلقة" : ""}`
    : `محادثة مطابقة · بلاغ #${conversation.report_id || "—"}${isClosed ? " · اكتملت الاستعادة" : ""}`;
  const composer = document.getElementById(mode === "admin" ? "adminMessageForm" : "userMessageForm");
  composer.classList.toggle("hidden", isClosed);
  if (mode === "user") {
    const completeButton = document.getElementById("userCompleteRecovery");
    completeButton.dataset.conversationId = conversation.id;
    completeButton.classList.toggle("hidden", conversation.conversation_type !== "match" || isClosed);
  }
  chat.messages.innerHTML = loadingState();
  try {
    const messages = await api(`/conversations/${conversation.id}/messages`);
    renderMessages(chat.messages, messages);
    await refreshBadges();
  } catch (error) { chat.messages.innerHTML = errorState(error.message); }
}

function renderMessages(target, messages) {
  if (!messages.length) {
    target.innerHTML = emptyState("المحادثة جاهزة", "أرسل أول رسالة بطريقة واضحة وآمنة.", "✦");
    return;
  }
  target.innerHTML = messages.map((message) => `<article class="message-bubble ${message.sender_id === state.user.id ? "own" : ""}"><p>${escapeHtml(message.content)}</p><footer><strong>${escapeHtml(message.sender_name || "FindBack")}</strong><time>${formatDateTime(message.created_at)}</time></footer></article>`).join("");
  requestAnimationFrame(() => { target.scrollTop = target.scrollHeight; });
}

async function refreshConversationIndex(mode) {
  const conversations = await api("/conversations");
  if (mode === "admin") state.adminConversations = conversations.filter((item) => item.conversation_type === "support");
  else state.userConversations = conversations;
  renderConversationList(mode);
}

async function loadAdminConversations() {
  els.adminConversationList.innerHTML = loadingState();
  try {
    await refreshConversationIndex("admin");
    setBadge("adminMessageBadge", state.adminConversations.reduce((sum, item) => sum + (Number(item.unread_count) || 0), 0));
    if (state.currentAdminConversationId && state.adminConversations.some((item) => item.id === state.currentAdminConversationId)) {
      await openConversation("admin", state.currentAdminConversationId);
    }
  } catch (error) { els.adminConversationList.innerHTML = errorState(error.message); }
}

async function sendConversationMessage(mode, event) {
  event.preventDefault();
  const conversationId = mode === "admin" ? state.currentAdminConversationId : state.currentUserConversationId;
  const input = document.getElementById(mode === "admin" ? "adminMessageInput" : "userMessageInput");
  const content = input.value.trim();
  if (!conversationId || !content) return;
  const button = event.submitter;
  setButtonLoading(button, true, "جاري الإرسال...");
  try {
    await api(`/conversations/${conversationId}/messages`, { method: "POST", body: { content } });
    input.value = "";
    await refreshConversationIndex(mode);
    await openConversation(mode, conversationId);
  } catch (error) { showToast(error.message, "error"); }
  finally { setButtonLoading(button, false); }
}

async function completeRecovery(button) {
  const conversationId = Number(button.dataset.conversationId || state.currentUserConversationId);
  if (!conversationId) return;
  if (!window.confirm(ui("هل تأكدت من استلام الغرض؟ سيتم إغلاق البلاغين والمحادثة."))) return;
  setButtonLoading(button, true, "جاري الإغلاق...");
  try {
    await api(`/conversations/${conversationId}/complete`, { method: "PATCH" });
    showToast("اكتملت الاستعادة، وتم إغلاق البلاغين بنجاح.");
    await refreshConversationIndex("user");
    await openConversation("user", conversationId);
  } catch (error) { showToast(error.message, "error"); }
  finally { setButtonLoading(button, false); }
}

async function createSupportConversation(event) {
  event.preventDefault();
  const button = event.submitter;
  const reportValue = document.getElementById("supportReportSelect").value;
  const messageInput = document.getElementById("supportMessage");
  setButtonLoading(button, true, "جاري الإرسال...");
  try {
    const conversation = await api("/support/conversations", { method: "POST", body: {
      report_id: reportValue ? Number(reportValue) : null,
      message: messageInput.value.trim()
    }});
    messageInput.value = "";
    state.currentUserConversationId = conversation.id;
    showToast("وصلت رسالتك إلى إدارة FindBack.");
    await loadUserCommunication();
  } catch (error) { showToast(error.message, "error"); }
  finally { setButtonLoading(button, false); }
}

function renderNotifications(mode, notifications) {
  const target = mode === "admin" ? els.adminNotificationList : els.userNotificationList;
  if (!notifications.length) {
    target.innerHTML = emptyState("لا توجد إشعارات", "سيظهر هنا أي تحديث مهم يخص حسابك.", "◉");
    return;
  }
  target.innerHTML = notifications.map((item) => `<article class="notification-item ${item.is_read ? "" : "unread"}"><i>${dictionary.notificationIcon[item.notification_type] || "◉"}</i><p><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.content)}</small></p><div><time>${formatDateTime(item.created_at)}</time>${item.is_read ? "" : `<button data-open-notification="${item.id}" data-notification-mode="${mode}" data-notification-type="${escapeHtml(item.notification_type)}" data-reference-id="${item.reference_id ?? ""}">فتح</button>`}</div></article>`).join("");
}

async function loadNotifications(mode) {
  const target = mode === "admin" ? els.adminNotificationList : els.userNotificationList;
  target.innerHTML = loadingState();
  try {
    const notifications = await api("/notifications");
    renderNotifications(mode, notifications);
    setBadge(mode === "admin" ? "adminNotificationBadge" : "userNotificationBadge", notifications.filter((item) => !item.is_read).length);
  } catch (error) { target.innerHTML = errorState(error.message); }
}

async function openNotification(notificationId, mode, type, referenceId) {
  try {
    await api(`/notifications/${notificationId}/read`, { method: "PATCH" });
    const isMessage = ["new_message", "support_message", "contact_request_accepted"].includes(type) && referenceId;
    if (mode === "admin" && isMessage) {
      showAdminView("adminMessages");
      await loadAdminConversations();
      await openConversation("admin", Number(referenceId));
    } else if (mode === "user") {
      showUserView("userConnect");
      await loadUserCommunication();
      if (isMessage) await openConversation("user", Number(referenceId));
    } else {
      await loadNotifications(mode);
    }
    await refreshBadges();
  } catch (error) { showToast(error.message, "error"); }
}

async function markAllNotifications(mode, button) {
  setButtonLoading(button, true, "...");
  try {
    await api("/notifications/read-all", { method: "PATCH" });
    showToast("تم تعيين جميع الإشعارات كمقروءة.");
    await loadNotifications(mode);
    await refreshBadges();
  } catch (error) { showToast(error.message, "error"); }
  finally { setButtonLoading(button, false); }
}

function normalizedScore(value, fallback = 0) {
  const numericValue = Number(value);
  const score = Number.isFinite(numericValue) ? numericValue : fallback;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function matchReasonChips(reasons = []) {
  const labels = reasons
    .map((reason) => dictionary.matchReason[reason])
    .filter(Boolean)
    .map((label) => `<span>${escapeHtml(ui(label))}</span>`)
    .join("");

  return labels || `<span>${escapeHtml(ui("تطابق البيانات"))}</span>`;
}

async function showMatches(reportId) {
  els.matchesModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  els.matchesContent.innerHTML = loadingState();
  try {
    const matches = await api(`/reports/${reportId}/matches`);
    if (!matches.length) {
      els.matchesContent.innerHTML = emptyState("لم تظهر نتيجة فوق 50%", "حسّن الوصف أو انتظر وصول بلاغ مقابل جديد.", "⌁");
      return;
    }
    els.matchesContent.innerHTML = matches.map((match) => {
      const src = imageUrl(match.image_url);
      const finalScore = normalizedScore(match.match_score);
      const textScore = normalizedScore(match.text_score, finalScore);
      const hasVision = match.match_method === "hybrid" && match.visual_score !== null && match.visual_score !== undefined;
      const visualScore = hasVision ? normalizedScore(match.visual_score) : null;
      const methodLabel = hasVision ? "تحليل هجين" : "مطابقة البيانات";
      const itemType = dictionary.type[match.report_type] || match.report_type;

      return `<article class="match-card ${hasVision ? "vision-match" : "text-match"}">
        <div class="match-thumb">${src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(match.item_name)}">` : dictionary.icon[match.category] || "◇"}</div>
        <div class="match-copy">
          <div class="match-card-head"><span class="vision-badge"><i></i>${hasVision ? "FINDBACK VISION" : escapeHtml(ui(methodLabel))}</span><small>${escapeHtml(ui(methodLabel))}</small></div>
          <h3>${escapeHtml(match.item_name)}</h3>
          <p>⌖ ${escapeHtml(match.location)} · ● ${escapeHtml(match.color || ui("غير محدد"))}</p>
          <p>${formatDate(match.item_date)} · ${escapeHtml(ui(itemType))}</p>
          <div class="match-metrics">
            <div><span>${escapeHtml(ui("تطابق البيانات"))}</span><strong>${textScore}%</strong><i style="--match-value:${textScore}%"></i></div>
            <div class="${hasVision ? "" : "metric-pending"}"><span>${escapeHtml(ui("تشابه الصورة"))}</span><strong>${hasVision ? `${visualScore}%` : "—"}</strong><i style="--match-value:${hasVision ? visualScore : 0}%"></i>${hasVision ? "" : `<small>${escapeHtml(ui("بانتظار صورتين واضحتين"))}</small>`}</div>
          </div>
          <div class="match-reasons"><b>${escapeHtml(ui("أسباب الترشيح"))}</b><div>${matchReasonChips(match.match_reasons)}</div></div>
        </div>
        <div class="match-card-actions"><div class="match-score"><small>${escapeHtml(ui("النتيجة النهائية"))}</small><strong>${finalScore}%</strong></div><button class="contact-match-button" data-action="request-contact" data-requester-id="${reportId}" data-matched-id="${match.id}">${escapeHtml(ui("طلب تواصل"))}</button></div>
      </article>`;
    }).join("");
  } catch (error) { els.matchesContent.innerHTML = errorState(error.message); }
}

async function uploadImage(reportId) {
  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "image/jpeg,image/png,image/webp";
  picker.addEventListener("change", async () => {
    const file = picker.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return showToast("حجم الصورة يجب ألا يتجاوز 5 MB.", "error");
    const body = new FormData();
    body.append("image", file);
    try {
      await api(`/reports/${reportId}/image`, { method: "POST", body });
      showToast("تم تحديث صورة البلاغ.");
      loadMyReports();
    } catch (error) { showToast(error.message, "error"); }
  });
  picker.click();
}

async function deleteReport(reportId) {
  if (!window.confirm(ui("هل تريد حذف هذا البلاغ نهائيًا؟"))) return;
  try {
    await api(`/reports/${reportId}`, { method: "DELETE" });
    showToast("تم حذف البلاغ.");
    loadMyReports();
  } catch (error) { showToast(error.message, "error"); }
}

async function loadAdminDashboard(force = false) {
  if (state.user?.role !== "admin") return;
  if (!force && state.adminStats && state.adminReports.length) {
    renderAdminAll();
    return;
  }
  els.statisticsGrid.innerHTML = loadingState();
  els.adminReportsTable.innerHTML = '<tr><td colspan="7">جاري تحميل البيانات...</td></tr>';
  try {
    const [stats, reports] = await Promise.all([api("/admin/statistics"), api("/admin/reports")]);
    state.adminStats = stats;
    state.adminReports = reports;
    renderAdminAll();
  } catch (error) {
    els.statisticsGrid.innerHTML = errorState(error.message);
    els.adminReportsTable.innerHTML = `<tr><td colspan="7">${escapeHtml(error.message)}</td></tr>`;
  }
}

function renderAdminAll() {
  renderAdminStats(state.adminStats, state.adminReports);
  renderAdminReports(filterAdminReports());
  renderAdminOverview(state.adminStats, state.adminReports);
  renderAdminAnalytics(state.adminStats, state.adminReports);
  renderAdminActivity(state.adminReports);
}

function renderAdminStats(stats, reports) {
  document.getElementById("adminTotalHero").textContent = Number(stats.total_reports) || 0;
  const withImages = reports.filter((r) => imageUrl(r.image_url)).length;
  const cards = [
    ["المستخدمون", stats.total_users, "↗", "var(--cyan)"], ["كل البلاغات", stats.total_reports, "◎", "var(--violet-2)"],
    ["المفتوحة", stats.open_reports, "●", "var(--orange)"], ["المتطابقة", stats.matched_reports, "◇", "var(--acid)"],
    ["المغلقة", stats.closed_reports, "✓", "var(--cyan)"], ["المفقودة", stats.lost_reports, "−", "var(--orange)"],
    ["الموجودة", stats.found_reports, "+", "var(--acid)"], ["مرفقة بصورة", withImages, "▣", "var(--pink)"]
  ];
  els.statisticsGrid.innerHTML = cards.map(([label, value, icon, color]) => `<article class="admin-stat" style="--stat:${color}"><header><span>${label}</span><i>${icon}</i></header><strong>${Number(value) || 0}</strong><small>LIVE PLATFORM DATA</small></article>`).join("");
}

function renderAdminOverview(stats, reports) {
  const total = Math.max(Number(stats.total_reports) || 0, 1);
  const open = Number(stats.open_reports) || 0;
  const matched = Number(stats.matched_reports) || 0;
  const closed = Number(stats.closed_reports) || 0;
  const openEnd = (open / total) * 100;
  const matchedEnd = openEnd + (matched / total) * 100;
  const donut = document.getElementById("statusDonut");
  donut.style.background = `conic-gradient(var(--orange) 0 ${openEnd}%,var(--acid) ${openEnd}% ${matchedEnd}%,var(--violet) ${matchedEnd}% 100%)`;
  donut.querySelector("strong").textContent = Number(stats.total_reports) || 0;
  document.getElementById("statusLegend").innerHTML = [["var(--orange)","مفتوح",open],["var(--acid)","متطابق",matched],["var(--violet)","مغلق",closed]].map(([color,label,value]) => `<div><i style="background:${color}"></i><span>${label}</span><strong>${value}</strong></div>`).join("");

  const lost = Number(stats.lost_reports) || 0;
  const found = Number(stats.found_reports) || 0;
  const typeTotal = Math.max(lost + found, 1);
  document.getElementById("typeBalance").innerHTML = `<div class="balance-number"><div><span>بلاغات مفقودة</span><strong>${lost}</strong></div><span>${Math.round(lost/typeTotal*100)}%</span></div><div class="balance-number"><div><span>بلاغات موجودة</span><strong>${found}</strong></div><span>${Math.round(found/typeTotal*100)}%</span></div><div class="balance-track"><i style="width:${lost/typeTotal*100}%"></i><i style="width:${found/typeTotal*100}%"></i></div><p class="balance-note">التوازن بين النوعين يزيد فرص تكوين أزواج مطابقة داخل النظام.</p>`;

  document.getElementById("adminRecentMini").innerHTML = reports.slice(0, 5).map((report) => `<div><i>${dictionary.icon[report.category] || "◇"}</i><p><strong>${escapeHtml(report.item_name)}</strong><small>${escapeHtml(report.location)} · ${ui(dictionary.type[report.report_type] || report.report_type)}</small></p><span>${timeAgo(report.created_at)}</span></div>`).join("") || '<p>لا يوجد نشاط بعد.</p>';
}

function filterAdminReports() {
  const search = document.getElementById("adminReportSearch")?.value.trim().toLowerCase() || "";
  const status = document.getElementById("adminStatusFilter")?.value || "";
  const type = document.getElementById("adminTypeFilter")?.value || "";
  return state.adminReports.filter((report) => {
    const haystack = `${report.item_name} ${report.location} ${report.category} ${report.description}`.toLowerCase();
    return (!search || haystack.includes(search)) && (!status || report.status === status) && (!type || report.report_type === type);
  });
}

function renderAdminReports(reports) {
  document.getElementById("adminTableCount").textContent = `${reports.length} سجل`;
  if (!reports.length) {
    els.adminReportsTable.innerHTML = '<tr><td colspan="7">لا توجد نتائج مطابقة للفلتر.</td></tr>';
    return;
  }
  els.adminReportsTable.innerHTML = reports.map((report) => `<tr><td>#${report.id}</td><td><strong>${escapeHtml(report.item_name)}</strong></td><td>${dictionary.category[report.category] || escapeHtml(report.category)}</td><td>${dictionary.type[report.report_type] || escapeHtml(report.report_type)}</td><td>${escapeHtml(report.location)}</td><td><select id="admin-status-${report.id}" aria-label="حالة البلاغ ${report.id}"><option value="open" ${report.status === "open" ? "selected" : ""}>مفتوح</option><option value="matched" ${report.status === "matched" ? "selected" : ""}>متطابق</option><option value="closed" ${report.status === "closed" ? "selected" : ""}>مغلق</option></select></td><td><button class="admin-save" data-admin-update="${report.id}">حفظ</button></td></tr>`).join("");
}

function renderAdminAnalytics(stats, reports) {
  const categoryCounts = reports.reduce((acc, report) => { acc[report.category] = (acc[report.category] || 0) + 1; return acc; }, {});
  const categoryData = Object.entries(categoryCounts).sort((a,b) => b[1]-a[1]);
  const maxCategory = Math.max(...categoryData.map(([,n]) => n), 1);
  document.getElementById("adminCategoryChart").innerHTML = categoryData.length ? categoryData.map(([key,value]) => `<div class="bar-row"><span>${dictionary.category[key] || escapeHtml(key)}</span><div><i style="width:${value/maxCategory*100}%"></i></div><strong>${value}</strong></div>`).join("") : '<p>لا توجد بيانات تصنيف.</p>';

  const locationCounts = reports.reduce((acc, report) => { const key = report.location || "غير محدد"; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
  const locations = Object.entries(locationCounts).sort((a,b) => b[1]-a[1]).slice(0,6);
  document.getElementById("adminLocationList").innerHTML = locations.length ? locations.map(([place,count],index) => `<div><span>0${index+1}</span><p><strong>${escapeHtml(place)}</strong><small>${count === 1 ? "بلاغ واحد" : `${count} بلاغات`}</small></p><b>${count}</b></div>`).join("") : '<p>لا توجد بيانات مواقع.</p>';

  const dayLabels = [];
  const dayCounts = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(); day.setHours(0,0,0,0); day.setDate(day.getDate()-offset);
    const next = new Date(day); next.setDate(next.getDate()+1);
    dayLabels.push(new Intl.DateTimeFormat(localeCode(), { weekday: "short" }).format(day));
    dayCounts.push(reports.filter((report) => { const date = new Date(report.created_at); return date >= day && date < next; }).length);
  }
  const maxDay = Math.max(...dayCounts, 1);
  document.getElementById("adminTrendChart").innerHTML = dayCounts.map((value,index) => `<div class="trend-col"><strong>${value}</strong><i style="height:${Math.max(3,value/maxDay*210)}px"></i><span>${dayLabels[index]}</span></div>`).join("");

  const total = Math.max(Number(stats.total_reports) || 0, 1);
  const completion = Math.round(((Number(stats.matched_reports)||0)+(Number(stats.closed_reports)||0))/total*100);
  const imageRate = Math.round(reports.filter((r)=>imageUrl(r.image_url)).length/total*100);
  const openRate = Math.round((Number(stats.open_reports)||0)/total*100);
  document.getElementById("adminPerformance").innerHTML = [["نسبة الإنجاز",`${completion}%`,"متطابق + مغلق"],["توثيق الصور",`${imageRate}%`,"من جميع البلاغات"],["قيد المعالجة",`${openRate}%`,"بلاغات مفتوحة"],["كثافة المستخدم",Number(stats.total_users)||0,"حساب مسجل"]].map(([label,value,note]) => `<div class="performance-item"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join("");
}

function renderAdminActivity(reports) {
  document.getElementById("adminActivityFeed").innerHTML = reports.slice(0, 9).map((report,index) => `<article class="activity-item"><i style="--item-color:${index%3===0?'var(--orange)':index%3===1?'var(--acid)':'var(--violet-2)'}">${dictionary.icon[report.category] || "◇"}</i><p><strong>${ui(dictionary.type[report.report_type] || report.report_type)}: ${escapeHtml(report.item_name)}</strong><small>${escapeHtml(report.location)} · الحالة ${dictionary.status[report.status] || report.status}</small></p><span>${timeAgo(report.created_at)}</span></article>`).join("") || '<p>لا يوجد نشاط مسجل.</p>';
  const noImage = reports.filter((r) => r.status === "open" && !imageUrl(r.image_url));
  const oldOpen = reports.filter((r) => r.status === "open" && r.created_at && Date.now()-new Date(r.created_at).getTime() > 7*86400000);
  const alerts = [
    ["var(--orange)", `${noImage.length} بلاغ مفتوح بلا صورة`, "إضافة الصور تحسّن التحقق البصري من النتائج."],
    ["var(--acid)", `${oldOpen.length} بلاغ مفتوح منذ أكثر من أسبوع`, "راجع الحالات القديمة وحدّث ما تم حله."],
    ["var(--violet-2)", `${reports.filter((r)=>r.status==='matched').length} بلاغ بانتظار الإغلاق`, "تحقق من اكتمال عملية الاستعادة قبل الإغلاق."]
  ];
  document.getElementById("adminAlerts").innerHTML = alerts.map(([color,title,text]) => `<article class="alert-item"><i style="--alert:${color}"></i><p><strong>${title}</strong><small>${text}</small></p></article>`).join("");
}

async function updateAdminStatus(reportId, button) {
  const select = document.getElementById(`admin-status-${reportId}`);
  setButtonLoading(button, true, "...");
  try {
    await api(`/admin/reports/${reportId}/status`, { method: "PATCH", body: { status: select.value } });
    showToast("تم تحديث حالة البلاغ.");
    await loadAdminDashboard(true);
  } catch (error) { showToast(error.message, "error"); }
  finally { setButtonLoading(button, false); }
}

function logout() {
  clearSession();
  showPublic();
  showToast("تم تسجيل الخروج.");
}

els.loginTab.addEventListener("click", () => {
  els.loginTab.classList.add("active"); els.registerTab.classList.remove("active");
  els.loginForm.classList.remove("hidden"); els.registerForm.classList.add("hidden");
});

els.registerTab.addEventListener("click", () => {
  els.registerTab.classList.add("active"); els.loginTab.classList.remove("active");
  els.registerForm.classList.remove("hidden"); els.loginForm.classList.add("hidden");
});

els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.submitter;
  setButtonLoading(button, true);
  try {
    const result = await api("/users/login", { method: "POST", body: { email: document.getElementById("loginEmail").value.trim(), password: document.getElementById("loginPassword").value } });
    saveSession(result.access_token, { id: result.user_id, full_name: result.full_name, role: result.role });
    showToast("تم تسجيل الدخول بنجاح.");
    await enterApp();
  } catch (error) { showToast(error.message, "error"); }
  finally { setButtonLoading(button, false); }
});

els.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.submitter;
  setButtonLoading(button, true);
  try {
    const email = document.getElementById("registerEmail").value.trim();
    await api("/users/register", { method: "POST", body: { full_name: document.getElementById("registerName").value.trim(), email, password: document.getElementById("registerPassword").value } });
    document.getElementById("loginEmail").value = email;
    els.registerForm.reset();
    els.loginTab.click();
    showToast("تم إنشاء الحساب. يمكنك الدخول الآن.");
  } catch (error) { showToast(error.message, "error"); }
  finally { setButtonLoading(button, false); }
});

els.createReportForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.submitter;
  const image = document.getElementById("itemImage").files[0];
  if (image && image.size > 5*1024*1024) return showToast("حجم الصورة يجب ألا يتجاوز 5 MB.", "error");
  setButtonLoading(button, true, "جاري نشر البلاغ...");
  try {
    const color = document.getElementById("itemColor").value.trim();
    const report = await api("/reports", { method: "POST", body: {
      report_type: document.querySelector('input[name="reportType"]:checked').value,
      item_name: document.getElementById("itemName").value.trim(),
      category: document.getElementById("itemCategory").value,
      description: document.getElementById("itemDescription").value.trim(),
      color: color || null,
      location: document.getElementById("itemLocation").value.trim(),
      item_date: new Date(document.getElementById("itemDate").value).toISOString()
    }});
    if (image) {
      const body = new FormData(); body.append("image", image);
      await api(`/reports/${report.id}/image`, { method: "POST", body });
    }
    els.createReportForm.reset();
    document.querySelector('input[name="reportType"][value="lost"]').checked = true;
    document.querySelectorAll(".type-option").forEach((option,index) => option.classList.toggle("selected", index===0));
    setDefaultDate();
    document.getElementById("fileName").textContent = "اختر JPG / PNG / WEBP";
    showToast("تم نشر البلاغ وتشغيل المطابقة.");
    showUserView("userDashboard");
  } catch (error) { showToast(error.message, "error"); }
  finally { setButtonLoading(button, false); }
});

document.addEventListener("click", (event) => {
  const languageToggle = event.target.closest("[data-language-toggle]");
  if (languageToggle) {
    toggleLanguage();
    return;
  }
  const auth = event.target.closest("[data-open-auth]");
  if (auth) openAuth(auth.dataset.openAuth || "login");
  if (event.target.closest("[data-public-create]")) {
    if (!state.token) openAuth("register");
    else if (state.user?.role === "admin") enterApp();
    else { setMode("user"); showUserView("userCreate"); }
  }
  const userView = event.target.closest("[data-user-view]");
  if (userView) { event.preventDefault(); showUserView(userView.dataset.userView); }
  const adminView = event.target.closest("[data-admin-view]");
  if (adminView) { event.preventDefault(); showAdminView(adminView.dataset.adminView); }
  const action = event.target.closest("[data-action]");
  if (action) {
    const id = Number(action.dataset.id);
    if (action.dataset.action === "matches") showMatches(id);
    if (action.dataset.action === "upload") uploadImage(id);
    if (action.dataset.action === "delete") deleteReport(id);
    if (action.dataset.action === "request-contact") createContactRequest(Number(action.dataset.requesterId), Number(action.dataset.matchedId), action);
  }
  const requestStatus = event.target.closest("[data-request-status]");
  if (requestStatus) updateContactRequest(Number(requestStatus.dataset.requestId), requestStatus.dataset.requestStatus, requestStatus);
  const conversationButton = event.target.closest("[data-open-conversation]");
  if (conversationButton) openConversation(conversationButton.dataset.conversationMode, Number(conversationButton.dataset.openConversation));
  const notificationButton = event.target.closest("[data-open-notification]");
  if (notificationButton) openNotification(Number(notificationButton.dataset.openNotification), notificationButton.dataset.notificationMode, notificationButton.dataset.notificationType, Number(notificationButton.dataset.referenceId) || null);
  const completeButton = event.target.closest("[data-complete-recovery]");
  if (completeButton) completeRecovery(completeButton);
  const adminUpdate = event.target.closest("[data-admin-update]");
  if (adminUpdate) updateAdminStatus(Number(adminUpdate.dataset.adminUpdate), adminUpdate);
  if (event.target.closest("[data-close-auth]")) closeAuth();
  if (event.target.closest("[data-close-matches]")) {
    els.matchesModal.classList.add("hidden");
    document.body.style.overflow = "";
  }
});

document.getElementById("mobileMenuButton").addEventListener("click", () => document.querySelector(".public-nav").classList.toggle("open"));
document.querySelectorAll(".public-nav a").forEach((link) => link.addEventListener("click", () => document.querySelector(".public-nav").classList.remove("open")));
document.getElementById("userLogout").addEventListener("click", logout);
document.getElementById("adminLogout").addEventListener("click", logout);
document.getElementById("searchReportsButton").addEventListener("click", loadAllReports);
document.getElementById("reportTypeFilter").addEventListener("change", loadAllReports);
document.getElementById("reportSearch").addEventListener("keydown", (event) => { if (event.key === "Enter") loadAllReports(); });
document.getElementById("refreshAdminButton").addEventListener("click", () => loadAdminDashboard(true));
["adminReportSearch","adminStatusFilter","adminTypeFilter"].forEach((id) => document.getElementById(id).addEventListener(id === "adminReportSearch" ? "input" : "change", () => renderAdminReports(filterAdminReports())));
document.querySelectorAll('input[name="reportType"]').forEach((radio) => radio.addEventListener("change", () => document.querySelectorAll(".type-option").forEach((option) => option.classList.toggle("selected", option.contains(radio)))));
document.getElementById("itemImage").addEventListener("change", (event) => { document.getElementById("fileName").textContent = event.target.files[0]?.name || "اختر JPG / PNG / WEBP"; });
document.getElementById("supportConversationForm").addEventListener("submit", createSupportConversation);
document.getElementById("userMessageForm").addEventListener("submit", (event) => sendConversationMessage("user", event));
document.getElementById("adminMessageForm").addEventListener("submit", (event) => sendConversationMessage("admin", event));
document.getElementById("refreshUserCommunication").addEventListener("click", loadUserCommunication);
document.getElementById("refreshUserConversations").addEventListener("click", async () => {
  try {
    await refreshConversationIndex("user");
    if (state.currentUserConversationId) await openConversation("user", state.currentUserConversationId);
  } catch (error) { showToast(error.message, "error"); }
});
document.getElementById("refreshAdminConversations").addEventListener("click", loadAdminConversations);
document.getElementById("markAllUserNotifications").addEventListener("click", (event) => markAllNotifications("user", event.currentTarget));
document.getElementById("markAllAdminNotifications").addEventListener("click", (event) => markAllNotifications("admin", event.currentTarget));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAuth();
    els.matchesModal.classList.add("hidden");
    document.body.style.overflow = "";
  }
});

function setDefaultDate() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById("itemDate").value = now.toISOString().slice(0,16);
}

applyLanguage();
const languageObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => translateSubtree(node)));
});
languageObserver.observe(document.body, { childList: true, subtree: true });

setDefaultDate();
if (state.token) enterApp(); else showPublic();
