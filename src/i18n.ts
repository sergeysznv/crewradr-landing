"use client";

// Comprehensive i18n for the landing site: flat dictionaries + client-side
// locale resolution.

export const LOCALES = [
  { code: "en", label: "English", flag: "🇺🇸", dir: "ltr" },
  { code: "es", label: "Español", flag: "🇪🇸", dir: "ltr" },
  { code: "fr", label: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "ar", label: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "zh", label: "中文", flag: "🇨🇳", dir: "ltr" },
  { code: "ru", label: "Русский", flag: "🇷🇺", dir: "ltr" },
] as const;

export type LocaleCode = (typeof LOCALES)[number]["code"];

export const LOCALE_DIRS: Record<LocaleCode, "ltr" | "rtl"> = {
  en: "ltr", es: "ltr", fr: "ltr", ar: "rtl", zh: "ltr", ru: "ltr",
};

const strings = {
  toggleTheme: {
    en: "Toggle theme", es: "Cambiar tema", fr: "Changer de thème",
    ar: "تبديل المظهر", zh: "切换主题", ru: "Переключить тему",
  },
  headingPart1: {
    en: "CrewRadr is", es: "CrewRadr está", fr: "CrewRadr arrive",
    ar: "CrewRadr قادم", zh: "CrewRadr 即将", ru: "CrewRadr уже",
  },
  headingPart2: {
    en: "coming soon", es: "llegando pronto", fr: "bientôt",
    ar: "قريباً", zh: "上线", ru: "совсем скоро",
  },
  subtitle: {
    en: "Real-time location sharing for trusted crews. We're putting the finishing touches on something great.",
    es: "Comparte tu ubicación en tiempo real con tu equipo de confianza. Estamos dando los últimos retoques a algo grande.",
    fr: "Partage de position en temps réel pour vos équipes de confiance. Nous mettons la touche finale à quelque chose de grand.",
    ar: "مشاركة الموقع في الوقت الفعلي لطواقمك الموثوقة. نضع اللمسات الأخيرة على شيء رائع.",
    zh: "为值得信赖的团队提供实时位置共享。我们正在为即将推出的出色产品做最后的润色。",
    ru: "Обмен местоположением в реальном времени для надёжных команд. Мы наносим последние штрихи на что-то большое.",
  },
  language: {
    en: "Language", es: "Idioma", fr: "Langue",
    ar: "اللغة", zh: "语言", ru: "Язык",
  },
  documentTitle: {
    en: "CrewRadr — Safety & Location Intelligence",
    es: "CrewRadr — Seguridad e Inteligencia de Ubicación",
    fr: "CrewRadr — Sécurité et Localisation en Temps Réel",
    ar: "CrewRadr — أمان وموقع في الوقت الفعلي",
    zh: "CrewRadr — 安全与实时位置智能",
    ru: "CrewRadr — Безопасность и геолокация в реальном времени",
  },
  documentDescription: {
    en: "Universal real-time safety, radar, geofencing, and telematics for family, friends, and teams on land, sea, and air.",
    es: "Seguridad universal en tiempo real, radar, geocercas y telemática para familias, amigos y equipos en tierra, mar y aire.",
    fr: "Sécurité universelle en temps réel, radar, géorepérage et télématique pour familles, amis et équipes sur terre, mer et air.",
    ar: "أمان شامل في الوقت الفعلي، رادار، سياج جغرافي وتتبع عن بعد للعائلات والأصدقاء والفرق براً وبحراً وجواً.",
    zh: "适用于陆地、海洋和空中的家庭、朋友和团队的通用实时安全、雷达、地理围栏和远程信息处理。",
    ru: "Универсальная безопасность в реальном времени, радар, геозоны и телематика для семей, друзей и команд на суше, море и в воздухе.",
  },
  privacy: {
    en: "Privacy Policy", es: "Política de Privacidad", fr: "Confidentialité",
    ar: "سياسة الخصوصية", zh: "隐私政策", ru: "Конфиденциальность",
  },
  terms: {
    en: "Terms of Service", es: "Términos del Servicio", fr: "Conditions d'utilisation",
    ar: "شروط الخدمة", zh: "服务条款", ru: "Условия обслуживания",
  },
  notFoundTitle: {
    en: "Page not found", es: "Página no encontrada", fr: "Page introuvable",
    ar: "الصفحة غير موجودة", zh: "页面未找到", ru: "Страница не найдена",
  },
  notFoundBody: {
    en: "The page you're looking for doesn't exist or has moved.",
    es: "La página que buscas no existe o se ha movido.",
    fr: "La page que vous recherchez n'existe pas ou a été déplacée.",
    ar: "الصفحة التي تبحث عنها غير موجودة أو تم نقلها.",
    zh: "您要查找的页面不存在或已被移动。",
    ru: "Страница, которую вы ищете, не существует или была перемещена.",
  },
  backHome: {
    en: "Back to home", es: "Volver al inicio", fr: "Retour à l'accueil",
    ar: "العودة إلى الرئيسية", zh: "返回首页", ru: "Вернуться на главную",
  },

  // ── Nav ──────────────────────────────────────────────────────────────────
  navFeatures: {
    en: "Features", es: "Funciones", fr: "Fonctionnalités",
    ar: "الميزات", zh: "功能特性", ru: "Возможности",
  },
  navSafety: {
    en: "Safety & Privacy", es: "Seguridad y Privacidad", fr: "Sécurité & Confidentialité",
    ar: "الأمان والخصوصية", zh: "安全与隐私", ru: "Безопасность",
  },
  navPricing: {
    en: "Pricing", es: "Planes", fr: "Tarifs",
    ar: "الأسعار", zh: "价格方案", ru: "Тарифы",
  },
  navFaq: {
    en: "FAQ", es: "Preguntas", fr: "FAQ",
    ar: "الأسئلة الشائعة", zh: "常见问题", ru: "Частые вопросы",
  },
  navAdminPortal: {
    en: "Admin Web Portal", es: "Portal Web Admin", fr: "Portail Web Admin",
    ar: "بوابة الإدارة", zh: "管理后台", ru: "Веб-портал",
  },

  // ── Hero ─────────────────────────────────────────────────────────────────
  heroBadge: {
    en: "Universal Safety & Intelligence · Land, Sea, Air & Road",
    es: "Inteligencia Universal de Ubicación · Tierra, Mar, Aire y Carretera",
    fr: "Intelligence Universelle · Terre, Mer, Air & Route",
    ar: "ذكاء موقع شامل · بر، بحر، جو وطريق",
    zh: "全域安全与位置智能 · 陆、海、空与道路",
    ru: "Универсальная геолокация · Суша, море, воздух и дороги",
  },
  heroTitle: {
    en: "Stay Connected. Stay Protected. Wherever Life Moves.",
    es: "Mantente Conectado. Mantente Seguro. En Cualquier Lugar.",
    fr: "Restez Connecté. Restez Protégé. Où Que Vous Alliez.",
    ar: "ابق على اتصال. ابق في أمان. أينما كنت.",
    zh: "无论身在何处，时刻保持互联与守护。",
    ru: "Оставайтесь на связи. Под надёжной защитой. Везде.",
  },
  heroSubtitle: {
    en: "Real-time location radar, predictive driving telematics, severe weather overlays, and instant check-ins for the family, friends, and teams you trust.",
    es: "Radar de ubicación en tiempo real, telemática de conducción predictiva, alertas meteorológicas severas y confirmaciones de seguridad instantáneas para tu familia, amigos y equipos.",
    fr: "Radar de position en temps réel, télématique de conduite prédictive, superpositions météo extrêmes et confirmations de sécurité instantanées.",
    ar: "رادار موقع فوري، تحليلات قيادة تنبؤية، تراكبات طقس قاسي، وتأكيدات أمان فورية للعائلة والأصدقاء والفرق.",
    zh: "实时位置雷达、预测性驾驶分析、恶劣天气预警叠加层以及即时安全签到，守护您信赖的家人、朋友与团队。",
    ru: "Радар местоположения в реальном времени, предиктивная телематика вождения, наложение опасных погодных явлений и мгновенные подтверждения безопасности.",
  },
  heroGetStarted: {
    en: "Launch Web Portal", es: "Iniciar Portal Web", fr: "Accéder au Portail",
    ar: "فتح بوابة الويب", zh: "访问网页端", ru: "Открыть веб-портал",
  },
  heroDownloadApp: {
    en: "Get Mobile App", es: "Obtener App Móvil", fr: "Télécharger l'App",
    ar: "تحميل التطبيق", zh: "下载移动应用", ru: "Скачать мобильное приложение",
  },

  // ── Features ─────────────────────────────────────────────────────────────
  featuresHeader: {
    en: "Engineered for Complete Situational Awareness",
    es: "Diseñado para un Conocimiento Situacional Total",
    fr: "Conçu pour une Conscience Situationnelle Complète",
    ar: "مصمم لتوفير وعي شامل بالموقف",
    zh: "专为全方位态势感知而生",
    ru: "Создано для полного контроля обстановки",
  },
  featuresSub: {
    en: "From neighborhood family trips to commercial vehicle fleets and maritime ventures, CrewRadr keeps everyone safe.",
    es: "Desde viajes familiares por el vecindario hasta flotas de vehículos y travesías, CrewRadr cuida de todos.",
    fr: "Des trajets familiaux quotidiens aux flottes professionnelles et expéditions maritimes, CrewRadr protège tout le monde.",
    ar: "من الرحلات العائلية اليومية إلى أساطيل المركبات والرحلات البحرية، CrewRadr يحافظ على سلامة الجميع.",
    zh: "从日常家庭出行到商业车队以及海上航行，CrewRadr 守护每位乘员的安全。",
    ru: "От семейных поездок до коммерческих автопарков и морских путешествий — CrewRadr защищает каждого.",
  },
  f1Title: {
    en: "Universal Real-Time Radar", es: "Radar Universal en Tiempo Real", fr: "Radar Universel en Temps Réel",
    ar: "رادار شامل في الوقت الفعلي", zh: "全域实时雷达", ru: "Универсальный радар",
  },
  f1Desc: {
    en: "Instant GPS positioning across road, sea, trail, and air. Sub-second WebSocket streaming keeps your crew's map up to the second.",
    es: "Posicionamiento GPS instantáneo en carretera, mar y senderos con transmisión WebSocket en tiempo real.",
    fr: "Positionnement GPS instantané sur route, mer et sentiers avec diffusion WebSocket inférieure à une seconde.",
    ar: "تحديد موقع GPS فوري عبر الطرق والبحار والمسارات الجوية مع تدفق سريع عبر WebSocket.",
    zh: "覆盖公路、水域、山道和天空的毫秒级 GPS 定位与 WebSocket 实时流式传输。",
    ru: "Мгновенное GPS-позиционирование на дорогах, в море и воздухе с субсекундной синхронизацией через WebSocket.",
  },
  f2Title: {
    en: "Safe Landings Geofencing", es: "Geocercas de Safe Landings", fr: "Géorepérage Safe Landings",
    ar: "سياج جغرافي للمناطق الآمنة", zh: "Safe Landings 地理围栏", ru: "Геозоны Safe Landings",
  },
  f2Desc: {
    en: "Create designated safety perimeters (50m–1000m) around home, work, docks, or schools. Get notified automatically upon arrival and departure.",
    es: "Establece perímetros seguros alrededor del hogar, trabajo, puertos o escuelas con alertas automáticas de entrada y salida.",
    fr: "Créez des périmètres de sécurité autour du domicile, du bureau ou de l'école. Notifications automatiques à l'arrivée et au départ.",
    ar: "أنشئ محيطات أمان مخصصة حول المنزل أو العمل أو المدرسة مع إشعارات فورية عند الدخول والمغادرة.",
    zh: "为家、办公室、码头或学校设定 50m–1000m 安全范围，到离时自动发送无缝提醒。",
    ru: "Настраиваемые периметры безопасности (50–1000 м) вокруг дома, работы, порта или школы с авто-оповещениями о прибытии.",
  },
  f3Title: {
    en: "Severe Weather Overlays", es: "Superposiciones Meteorológicas", fr: "Alertes Météo & Radar",
    ar: "تراكبات الطقس القاسي والرادار", zh: "恶劣天气与降水雷达", ru: "Погодный радар и штормовые зоны",
  },
  f3Desc: {
    en: "Live RainViewer Doppler precipitation radar and active National Weather Service severe warning polygons (tornado, severe storm, flood).",
    es: "Radar Doppler de precipitaciones RainViewer en vivo y polígonos de advertencia activa del NWS (tornados, tormentas, inundaciones).",
    fr: "Radar de précipitations RainViewer et alertes météo extrêmes NWS (tornades, orages violents, inondations).",
    ar: "رادار هطول الأمطار المباشر مع مضلعات تحذيرات الطقس القاسي من NWS (الأعاصير، العواصف، والفيضانات).",
    zh: "集成实时 RainViewer 多普勒降水雷达与国家气象局严重风暴、龙卷风、洪涝预警多边形区域。",
    ru: "Живой доплеровский радар осадков RainViewer и активные штормовые полигоны NWS (торнадо, грозы, наводнения).",
  },
  f4Title: {
    en: "Driving Safety Telematics", es: "Telemática de Conducción Segura", fr: "Télématique & Sécurité Routière",
    ar: "تحليلات القيادة الآمنة", zh: "驾驶安全远程信息处理", ru: "Телематика безопасного вождения",
  },
  f4Desc: {
    en: "Automated trip scorecards (0–100), speed limit adherence, harsh braking detection, and fatigue warnings based on circadian schedules.",
    es: "Tarjetas de puntuación de viaje (0–100), detección de frenado brusco, exceso de velocidad y alertas de fatiga al volante.",
    fr: "Scores de trajet automatiques (0–100), respect des limitations, freinages brusques et alertes de fatigue préventives.",
    ar: "بطاقات تقييم للرحلات (0–100)، رصد الفرملة المفاجئة وتجاوز السرعة، وتنبيهات الإرهاق أثناء القيادة.",
    zh: "全自动行程安全评分 (0–100)、急刹车与急转弯监测、超速分析及生理作息疲劳预警。",
    ru: "Автоматический расчёт баллов поездки (0–100), выявление резких торможений, превышений скорости и риска утомления.",
  },
  f5Title: {
    en: "Total Privacy & Zero Ad Sales", es: "Privacidad Total Sin Anuncios", fr: "Confidentialité Totale Sans Pub",
    ar: "خصوصية كاملة وبدون إعلانات", zh: "隐私至上 · 零广告与数据出售", ru: "Полная приватность без рекламы",
  },
  f5Desc: {
    en: "Device-level KMS encryption key rotation, tier-based automated data purging (7d/30d/90d/365d), and strict non-commercial sharing modes.",
    es: "Rotación de claves de cifrado KMS, purga automática de datos por nivel y modos de uso personal sin venta de datos.",
    fr: "Chiffrement KMS sur l'appareil, purge automatique selon votre formule (7j/30j/90j/365j) et respect strict des données.",
    ar: "تشفير محلي متقدم بمفاتيح KMS، حذف تلقائي دوري للبيانات، وحظر كامل لبيع بيانات موقعك.",
    zh: "设备端 KMS 密钥轮换加密、按订阅等级自动安全擦除历史数据，绝不向任何第三方出售位置数据。",
    ru: "Шифрование KMS на устройствах, автоматическое удаление логов по подписке (7/30/90/365 дней) и нулевая продажа данных.",
  },
  f6Title: {
    en: "Offline Resilient Mapping", es: "Mapas Sin Conexión Resistentes", fr: "Cartographie Hors Ligne",
    ar: "خرائط تعمل بدون اتصال", zh: "强韧的离线离网地图", ru: "Надёжные офлайн-карты",
  },
  f6Desc: {
    en: "Download OpenStreetMap vector regions to device storage. When cellular signals fail in remote areas, offline queues ensure zero telemetry loss.",
    es: "Descarga regiones de mapas en tu dispositivo. Si la señal falla en zonas remotas, la cola sin conexión previene pérdidas de datos.",
    fr: "Téléchargez des régions cartographiques sur votre appareil. La file d'attente hors ligne prévient toute perte de données.",
    ar: "تحميل خرائط للمناطق على جهازك. عندما تنقطع التغطية، تضمن قوائم الانتظار عدم فقدان أي بيانات تتبع.",
    zh: "预先下载地图区域至本地储存。在无信号的偏远荒野，离线队列确保恢复连接后数据完整同步。",
    ru: "Загрузка регионов карт в память устройства. Офлайн-очередь гарантирует сохранность данных даже вдали от вышек связи.",
  },

  // ── Pricing ──────────────────────────────────────────────────────────────
  pricingHeader: {
    en: "Transparent Plans for Every Crew",
    es: "Planes Transparentes para Cada Equipo",
    fr: "Des Formules Adaptées à Chaque Équipe",
    ar: "خطط واضحة لكل فريق",
    zh: "为各类团队量身打造的透明方案",
    ru: "Прозрачные тарифы для любых команд",
  },
  pricingSub: {
    en: "From close families to commercial fleets, unlock the exact level of intelligence and safety retention you need.",
    es: "Desde familias cercanas hasta flotas comerciales, obtén el nivel de seguridad e historial que necesitas.",
    fr: "Des familles aux flottes commerciales, choisissez le niveau d'intelligence et d'historique adapté.",
    ar: "من العائلات إلى الأساطيل التجارية، اختر المستوى الذي يناسب احتياجاتك بدقة.",
    zh: "从亲密家庭到商用企业车队，灵活解锁所需的智能保障与历史存储周期。",
    ru: "От семейных кругов до коммерческих флотов — выберите необходимый уровень безопасности и хранения истории.",
  },
  tierDeckhandName: { en: "Deckhand", es: "Deckhand", fr: "Deckhand", ar: "ديكهاند", zh: "水手 (Deckhand)", ru: "Deckhand" },
  tierDeckhandPrice: { en: "Free", es: "Gratis", fr: "Gratuit", ar: "مجاناً", zh: "免费", ru: "Бесплатно" },
  tierDeckhandPeriod: { en: "Forever", es: "Para siempre", fr: "Pour toujours", ar: "دائماً", zh: "永久免费", ru: "Навсегда" },
  tierDeckhandDesc: {
    en: "Essential location radar for families and small trusted circles.",
    es: "Radar de ubicación esencial para familias y círculos de confianza.",
    fr: "Localisation essentielle pour la famille et les proches.",
    ar: "رادار موقع أساسي للعائلات والدوائر المقربة الصغيرة.",
    zh: "适用于家庭和亲友核心圈的基础实时位置雷达。",
    ru: "Базовый радар местоположения для семей и небольших доверенных кругов.",
  },

  tierFirstMateName: { en: "First Mate", es: "First Mate", fr: "First Mate", ar: "فيرست ميت", zh: "大副 (First Mate)", ru: "First Mate" },
  tierFirstMatePrice: { en: "$4.99", es: "$4.99", fr: "4,99 €", ar: "$4.99", zh: "$4.99", ru: "$4.99" },
  tierFirstMatePeriod: { en: "/ month", es: "/ mes", fr: "/ mois", ar: "/ شهر", zh: "/ 月", ru: "/ мес" },
  tierFirstMateDesc: {
    en: "Live weather radar, 30-day history, and 10 Safe Landings for up to 15 members.",
    es: "Radar meteorológico en vivo, 30 días de historial y 10 Safe Landings para hasta 15 miembros.",
    fr: "Radar météo en direct, 30 jours d'historique et 10 Safe Landings jusqu'à 15 membres.",
    ar: "رادار طقس مباشر، تاريخ 30 يوماً، و10 مناطق آمنة لما يصل إلى 15 عضواً.",
    zh: "实时降水雷达、30天历史追踪、10个安全围栏，支持最多15名成员。",
    ru: "Погодный радар, 30 дней истории и 10 геозон Safe Landings до 15 участников.",
  },

  tierCaptainName: { en: "Captain", es: "Captain", fr: "Captain", ar: "كابتن", zh: "船长 (Captain)", ru: "Captain" },
  tierCaptainPrice: { en: "$9.99", es: "$9.99", fr: "9,99 €", ar: "$9.99", zh: "$9.99", ru: "$9.99" },
  tierCaptainPeriod: { en: "/ month", es: "/ mes", fr: "/ mois", ar: "/ شهر", zh: "/ 月", ru: "/ мес" },
  tierCaptainDesc: {
    en: "Full driving telematics, 90-day retention, unlimited Safe Landings, and fleet CSV/PDF reports.",
    es: "Telemática completa de conducción, 90 días de historial, Safe Landings ilimitados e informes en PDF/CSV.",
    fr: "Télématique complète, 90 jours d'historique, Safe Landings illimités et rapports d'activité PDF/CSV.",
    ar: "تحليلات قيادة كاملة، تاريخ 90 يوماً، مناطق غير محدودة، وتقارير أسطول PDF/CSV.",
    zh: "全功能驾驶分析、90天留存、无限地理围栏及企业级 CSV/PDF 合规报表导出。",
    ru: "Полная телематика вождения, 90 дней истории, безлимитные геозоны и отчёты CSV/PDF.",
  },

  tierAdmiralName: { en: "Admiral", es: "Admiral", fr: "Admiral", ar: "أدميرال", zh: "上将 (Admiral)", ru: "Admiral" },
  tierAdmiralPrice: { en: "$19.99", es: "$19.99", fr: "19,99 €", ar: "$19.99", zh: "$19.99", ru: "$19.99" },
  tierAdmiralPeriod: { en: "/ month", es: "/ mes", fr: "/ mois", ar: "/ شهر", zh: "/ 月", ru: "/ мес" },
  tierAdmiralDesc: {
    en: "Unlimited capacity, 365-day history, AI arrival and risk predictions, and enterprise SSO.",
    es: "Capacidad ilimitada, 365 días de historial, predicciones de IA de llegada y riesgo, y SSO empresarial.",
    fr: "Membres illimités, 365 jours d'historique, prédictions d'arrivée et de risques par IA, et SSO.",
    ar: "سعة غير محدودة، تاريخ 365 يوماً، توقعات الذكاء الاصطناعي للمخاطر والوصول، وSSO مؤسسي.",
    zh: "无限成员容量、365天历史存留、AI 风险与到达时间预测、企业级 SSO / SCIM 单点登录。",
    ru: "Безлимитный состав, 365 дней истории, ИИ-прогнозы прибытия и рисков, корпоративный SSO.",
  },

  // ── Safety Strip ─────────────────────────────────────────────────────────
  statEncValue: { en: "256-Bit", es: "256-Bit", fr: "256-Bit", ar: "256-بت", zh: "256-位", ru: "256-бит" },
  statEncLabel: { en: "KMS Device Encryption", es: "Cifrado KMS en Dispositivo", fr: "Chiffrement KMS Embarqué", ar: "تشفير أجهزة متقدم", zh: "端到端 KMS 设备级加密", ru: "Шифрование KMS на устройствах" },
  statZeroValue: { en: "0 Ads", es: "0 Anuncios", fr: "0 Publicité", ar: "0 إعلانات", zh: "0 广告", ru: "0 рекламы" },
  statZeroLabel: { en: "Zero Location Data Sales", es: "Nunca Vendemos tu Ubicación", fr: "Aucune Revente de Données", ar: "لا نبيع بيانات موقعك أبداً", zh: "绝不向任何第三方出售数据", ru: "Нулевая продажа геолокации" },
  statSyncValue: { en: "< 1 sec", es: "< 1 seg", fr: "< 1 s", ar: "< 1 ثانية", zh: "< 1 秒", ru: "< 1 сек" },
  statSyncLabel: { en: "Real-Time Telemetry Sync", es: "Sincronización en Tiempo Real", fr: "Synchronisation Instantanée", ar: "مزامنة لحظية للبيانات", zh: "毫秒级实时遥测流", ru: "Синхронизация телеметрии" },

  // ── Disclaimers & FAQ ────────────────────────────────────────────────────
  emergencyNotice: {
    en: "Notice: CrewRadr is a peer-to-peer location & situational awareness tool. It is not an authorized emergency dispatch or replacement for official 911/112 emergency services.",
    es: "Aviso: CrewRadr es una herramienta de conocimiento situacional y ubicación. No reemplaza los servicios oficiales de emergencias (911/112).",
    fr: "Avis : CrewRadr est un outil de sensibilisation et de localisation. Il ne remplace pas les services officiels d'urgence (911/112/15).",
    ar: "تنبيه: CrewRadr هي أداة لمشاركة الموقع والتوعية الظرفية وليست بديلاً لخدمات الطوارئ الرسمية 911.",
    zh: "提示：CrewRadr 是一款位置共享与协同安全工具，不能替代官方 911/110/120 等法定紧急救援服务。",
    ru: "Внимание: CrewRadr является инструментом ситуационной осведомлённости и не заменяет официальные экстренные службы (112/911).",
  },
  previewModeActive: {
    en: "Launch Preview Mode Active (Internal Review)",
    es: "Modo Vista Previa de Lanzamiento Activo (Revisión Interna)",
    fr: "Mode Prévisualisation Actif (Usage Interne)",
    ar: "وضع معاينة الإطلاق نشط (مراجعة داخلية)",
    zh: "发布预览模式已激活（仅供内部审核）",
    ru: "Режим предпросмотра запуска активен (внутренний доступ)",
  },
  lockPage: {
    en: "Lock Preview", es: "Bloquear Vista Previa", fr: "Verrouiller",
    ar: "إقفال المعاينة", zh: "锁定页面", ru: "Заблокировать",
  },
} as const;

export type MessageKey = keyof typeof strings;

export function t(locale: LocaleCode, key: MessageKey): string {
  return strings[key]?.[locale] ?? strings[key]?.["en"] ?? String(key);
}

export function resolveLocale(searchParams?: string): LocaleCode {
  if (typeof searchParams === "string") {
    const m = /[?&]lang=([a-z]{2})/i.exec(searchParams);
    if (m && (LOCALES as readonly { code: string }[]).some((l) => l.code === m[1])) {
      return m[1] as LocaleCode;
    }
  }
  if (typeof navigator !== "undefined" && navigator.language) {
    const primary = navigator.language.slice(0, 2).toLowerCase();
    if ((LOCALES as readonly { code: string }[]).some((l) => l.code === primary)) {
      return primary as LocaleCode;
    }
  }
  return "en";
}

export function applyLocale(code: LocaleCode) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = code;
  document.documentElement.dir = LOCALE_DIRS[code];
}
