// Serves HTML map pages for /share/TOKEN links.
// Queries Supabase PostgREST directly — zero dependencies.
//
// Supabase Edge Runtime overrides Content-Type to text/plain and injects
// restrictive CSP headers on unauthenticated functions, so we handle the
// full request lifecycle here in Cloudflare Pages instead of proxying.

const TOKEN_REGEX = /^[a-z2-9]{10,16}$/i;

// ── Locale dictionaries ────────────────────────────────────────────────────
const STRINGS = {
  en: {
    invalidTitle: "Invalid Share Link",
    invalidBody: "<h1>Invalid link format</h1>",
    unavailableTitle: "Temporarily Unavailable",
    unavailableBody: "<h1>502 — Temporarily Unavailable</h1><p>Please try again in a moment.</p>",
    notFoundTitle: "Link Not Found",
    notFoundBody: "<h1>This link doesn't exist</h1><p>It may have been revoked or never existed.</p>",
    expiredH1: "⏰ This link has expired",
    expiredP: "Location sharing links are temporary for your privacy.",
    getCrewRadr: "Get CrewRadr",
    availableOn: "Available on",
    liveTitle: "Live Location",
    crewMember: "Crew Member",
    noCrewLocations: "No members have shared location yet",
    waitingForLocation: "Waiting for location...",
    updated: "Updated",
    viewingCrew: "Viewing crew location via CrewRadr",
    viewingLive: "Viewing live location via CrewRadr",
    seeCrew: "See your whole crew on the map",
    seeLive: "See live location on the map",
    getTheApp: "Get the App",
    speedMph: "{s} mph",
    speedKmh: "{s} km/h",
    mapThemeTitle: "Map theme",
    mapThemeSystem: "System",
    mapThemeLight: "Light",
    mapThemeDark: "Dark",
    encIncompleteTitle: "This link is incomplete",
    encIncompleteBody: "Part of the link is missing, so the location can't be unlocked. Ask the sender to share the full link again and open it exactly as received.",
    encUndecryptableTitle: "This link can't be opened",
    encUndecryptableBody: "The location couldn't be decrypted with this link. It may have been copied incorrectly. Ask the sender for a new link.",
    encUnsupportedTitle: "Browser not supported",
    encUnsupportedBody: "This browser can't open encrypted location links. Update it or open the link in another browser.",
    encRevokedTitle: "This link is no longer available",
    encRevokedBody: "The sender may have stopped sharing or revoked the link.",
    encStale: "Location may be out of date",
    encUpdatedJustNow: "Updated just now",
    encUpdatedMinAgo: "Updated {n} min ago",
    encEncrypted: "End-to-end encrypted",
    encLoading: "Loading location...",
    encRetrying: "Connection problem. Retrying...",
    encMapUnavailable: "Map could not be loaded. Last position:",
  },
  es: {
    invalidTitle: "Enlace de compartir no válido",
    invalidBody: "<h1>Formato de enlace no válido</h1>",
    unavailableTitle: "No disponible temporalmente",
    unavailableBody: "<h1>502 — No disponible temporalmente</h1><p>Inténtalo de nuevo en un momento.</p>",
    notFoundTitle: "Enlace no encontrado",
    notFoundBody: "<h1>Este enlace no existe</h1><p>Puede haber sido revocado o no haber existido nunca.</p>",
    expiredH1: "⏰ Este enlace ha caducado",
    expiredP: "Los enlaces para compartir ubicación son temporales para tu privacidad.",
    getCrewRadr: "Obtener CrewRadr",
    availableOn: "Disponible en",
    liveTitle: "Ubicación en vivo",
    crewMember: "Miembro del grupo",
    noCrewLocations: "Aún no hay miembros que compartan ubicación",
    waitingForLocation: "Esperando ubicación...",
    updated: "Actualizado",
    viewingCrew: "Viendo la ubicación del grupo vía CrewRadr",
    viewingLive: "Viendo la ubicación en vivo vía CrewRadr",
    seeCrew: "Ve a todo tu grupo en el mapa",
    seeLive: "Mira la ubicación en vivo en el mapa",
    getTheApp: "Descarga la app",
    speedMph: "{s} mph",
    speedKmh: "{s} km/h",
    mapThemeTitle: "Tema del mapa",
    mapThemeSystem: "Sistema",
    mapThemeLight: "Claro",
    mapThemeDark: "Oscuro",
    encIncompleteTitle: "Este enlace está incompleto",
    encIncompleteBody: "Falta parte del enlace, así que no se puede desbloquear la ubicación. Pide al remitente que vuelva a compartir el enlace completo y ábrelo tal como lo recibiste.",
    encUndecryptableTitle: "No se puede abrir este enlace",
    encUndecryptableBody: "No se pudo descifrar la ubicación con este enlace. Puede que se haya copiado mal. Pide al remitente un enlace nuevo.",
    encUnsupportedTitle: "Navegador no compatible",
    encUnsupportedBody: "Este navegador no puede abrir enlaces de ubicación cifrados. Actualízalo o abre el enlace en otro navegador.",
    encRevokedTitle: "Este enlace ya no está disponible",
    encRevokedBody: "Es posible que el remitente haya dejado de compartir o haya revocado el enlace.",
    encStale: "Es posible que la ubicación no esté actualizada",
    encUpdatedJustNow: "Actualizado justo ahora",
    encUpdatedMinAgo: "Actualizado hace {n} min",
    encEncrypted: "Cifrado de extremo a extremo",
    encLoading: "Cargando ubicación...",
    encRetrying: "Problema de conexión. Reintentando...",
    encMapUnavailable: "No se pudo cargar el mapa. Última posición:",
  },
  fr: {
    invalidTitle: "Lien de partage invalide",
    invalidBody: "<h1>Format de lien invalide</h1>",
    unavailableTitle: "Temporairement indisponible",
    unavailableBody: "<h1>502 — Temporairement indisponible</h1><p>Veuillez réessayer dans un instant.</p>",
    notFoundTitle: "Lien introuvable",
    notFoundBody: "<h1>Ce lien n'existe pas</h1><p>Il a peut-être été révoqué ou n'a jamais existé.</p>",
    expiredH1: "⏰ Ce lien a expiré",
    expiredP: "Les liens de partage de position sont temporaires pour votre confidentialité.",
    getCrewRadr: "Télécharger CrewRadr",
    availableOn: "Disponible sur",
    liveTitle: "Position en direct",
    crewMember: "Membre de l'équipe",
    noCrewLocations: "Aucun membre n'a encore partagé sa position",
    waitingForLocation: "En attente de la position...",
    updated: "Mis à jour",
    viewingCrew: "Position de l'équipe via CrewRadr",
    viewingLive: "Position en direct via CrewRadr",
    seeCrew: "Voyez toute votre équipe sur la carte",
    seeLive: "Voyez la position en direct sur la carte",
    getTheApp: "Télécharger l'app",
    speedMph: "{s} mph",
    speedKmh: "{s} km/h",
    mapThemeTitle: "Thème de la carte",
    mapThemeSystem: "Système",
    mapThemeLight: "Clair",
    mapThemeDark: "Sombre",
    encIncompleteTitle: "Ce lien est incomplet",
    encIncompleteBody: "Une partie du lien est manquante, la position ne peut donc pas être déverrouillée. Demandez à l'expéditeur de partager à nouveau le lien complet et ouvrez-le tel que vous l'avez reçu.",
    encUndecryptableTitle: "Impossible d'ouvrir ce lien",
    encUndecryptableBody: "La position n'a pas pu être déchiffrée avec ce lien. Il a peut-être été mal copié. Demandez un nouveau lien à l'expéditeur.",
    encUnsupportedTitle: "Navigateur non pris en charge",
    encUnsupportedBody: "Ce navigateur ne peut pas ouvrir les liens de position chiffrés. Mettez-le à jour ou ouvrez le lien dans un autre navigateur.",
    encRevokedTitle: "Ce lien n'est plus disponible",
    encRevokedBody: "L'expéditeur a peut-être arrêté le partage ou révoqué le lien.",
    encStale: "La position n'est peut-être plus à jour",
    encUpdatedJustNow: "Mis à jour à l'instant",
    encUpdatedMinAgo: "Mis à jour il y a {n} min",
    encEncrypted: "Chiffré de bout en bout",
    encLoading: "Chargement de la position...",
    encRetrying: "Problème de connexion. Nouvelle tentative...",
    encMapUnavailable: "Impossible de charger la carte. Dernière position :",
  },
  ar: {
    invalidTitle: "رابط مشاركة غير صالح",
    invalidBody: "<h1>صيغة الرابط غير صالحة</h1>",
    unavailableTitle: "غير متاح مؤقتاً",
    unavailableBody: "<h1>502 — غير متاح مؤقتاً</h1><p>يرجى المحاولة مرة أخرى بعد لحظة.</p>",
    notFoundTitle: "الرابط غير موجود",
    notFoundBody: "<h1>هذا الرابط غير موجود</h1><p>ربما تم إلغاؤه أو لم يكن موجوداً أصلاً.</p>",
    expiredH1: "⏰ انتهت صلاحية هذا الرابط",
    expiredP: "روابط مشاركة الموقع مؤقتة لحماية خصوصيتك.",
    getCrewRadr: "احصل على CrewRadr",
    availableOn: "متاح على",
    liveTitle: "الموقع المباشر",
    crewMember: "عضو في الطاقم",
    noCrewLocations: "لم يشارك أي عضو موقعه بعد",
    waitingForLocation: "في انتظار الموقع...",
    updated: "آخر تحديث",
    viewingCrew: "عرض موقع الطاقم عبر CrewRadr",
    viewingLive: "عرض الموقع المباشر عبر CrewRadr",
    seeCrew: "شاهد طاقمك بالكامل على الخريطة",
    seeLive: "شاهد الموقع المباشر على الخريطة",
    getTheApp: "حمّل التطبيق",
    speedMph: "{s} ميل/س",
    speedKmh: "{s} كم/س",
    mapThemeTitle: "سمة الخريطة",
    mapThemeSystem: "النظام",
    mapThemeLight: "فاتح",
    mapThemeDark: "داكن",
    encIncompleteTitle: "هذا الرابط غير مكتمل",
    encIncompleteBody: "جزء من الرابط مفقود، لذا لا يمكن فتح الموقع. اطلب من المرسل مشاركة الرابط كاملاً مرة أخرى وافتحه كما وصلك تماماً.",
    encUndecryptableTitle: "تعذّر فتح هذا الرابط",
    encUndecryptableBody: "تعذّر فك تشفير الموقع باستخدام هذا الرابط. ربما نُسخ بشكل غير صحيح. اطلب من المرسل رابطاً جديداً.",
    encUnsupportedTitle: "المتصفح غير مدعوم",
    encUnsupportedBody: "لا يمكن لهذا المتصفح فتح روابط الموقع المشفّرة. قم بتحديثه أو افتح الرابط في متصفح آخر.",
    encRevokedTitle: "هذا الرابط لم يعد متاحاً",
    encRevokedBody: "ربما أوقف المرسل المشاركة أو ألغى الرابط.",
    encStale: "قد لا يكون الموقع محدّثاً",
    encUpdatedJustNow: "تم التحديث الآن",
    encUpdatedMinAgo: "تم التحديث قبل {n} دقيقة",
    encEncrypted: "مشفّر من طرف إلى طرف",
    encLoading: "جارٍ تحميل الموقع...",
    encRetrying: "مشكلة في الاتصال. جارٍ إعادة المحاولة...",
    encMapUnavailable: "تعذّر تحميل الخريطة. آخر موقع:",
  },
  zh: {
    invalidTitle: "分享链接无效",
    invalidBody: "<h1>链接格式无效</h1>",
    unavailableTitle: "暂时不可用",
    unavailableBody: "<h1>502 — 暂时不可用</h1><p>请稍后重试。</p>",
    notFoundTitle: "链接不存在",
    notFoundBody: "<h1>此链接不存在</h1><p>它可能已被撤销或从未存在过。</p>",
    expiredH1: "⏰ 此链接已过期",
    expiredP: "为了保护您的隐私，位置共享链接是临时的。",
    getCrewRadr: "获取 CrewRadr",
    availableOn: "可在以下平台获取",
    liveTitle: "实时位置",
    crewMember: "团队成员",
    noCrewLocations: "还没有成员共享位置",
    waitingForLocation: "等待位置信息...",
    updated: "更新于",
    viewingCrew: "通过 CrewRadr 查看团队位置",
    viewingLive: "通过 CrewRadr 查看实时位置",
    seeCrew: "在地图上查看您的整个团队",
    seeLive: "在地图上查看实时位置",
    getTheApp: "下载应用",
    speedMph: "{s} 英里/小时",
    speedKmh: "{s} 公里/小时",
    mapThemeTitle: "地图主题",
    mapThemeSystem: "系统",
    mapThemeLight: "浅色",
    mapThemeDark: "深色",
    encIncompleteTitle: "此链接不完整",
    encIncompleteBody: "链接缺少一部分，因此无法解锁位置。请让发送者重新分享完整链接，并按收到时的原样打开。",
    encUndecryptableTitle: "无法打开此链接",
    encUndecryptableBody: "无法使用此链接解密位置。链接可能复制有误。请向发送者索取新链接。",
    encUnsupportedTitle: "不支持此浏览器",
    encUnsupportedBody: "此浏览器无法打开加密的位置链接。请更新浏览器或在其他浏览器中打开链接。",
    encRevokedTitle: "此链接已不可用",
    encRevokedBody: "发送者可能已停止共享或撤销了此链接。",
    encStale: "位置可能已过时",
    encUpdatedJustNow: "刚刚更新",
    encUpdatedMinAgo: "{n} 分钟前更新",
    encEncrypted: "端到端加密",
    encLoading: "正在加载位置...",
    encRetrying: "连接出现问题，正在重试...",
    encMapUnavailable: "无法加载地图。最新位置：",
  },
  ru: {
    invalidTitle: "Недействительная ссылка",
    invalidBody: "<h1>Неверный формат ссылки</h1>",
    unavailableTitle: "Временно недоступно",
    unavailableBody: "<h1>502 — Временно недоступно</h1><p>Пожалуйста, повторите попытку через мгновение.</p>",
    notFoundTitle: "Ссылка не найдена",
    notFoundBody: "<h1>Эта ссылка не существует</h1><p>Возможно, она была отозвана или никогда не существовала.</p>",
    expiredH1: "⏰ Срок действия этой ссылки истёк",
    expiredP: "Ссылки для обмена местоположением временные — ради вашей конфиденциальности.",
    getCrewRadr: "Скачать CrewRadr",
    availableOn: "Доступно в",
    liveTitle: "Живое местоположение",
    crewMember: "Участник команды",
    noCrewLocations: "Участники ещё не поделились местоположением",
    waitingForLocation: "Ожидание местоположения...",
    updated: "Обновлено",
    viewingCrew: "Просмотр местоположения команды через CrewRadr",
    viewingLive: "Просмотр живого местоположения через CrewRadr",
    seeCrew: "Смотрите всю команду на карте",
    seeLive: "Смотрите местоположение на карте в реальном времени",
    getTheApp: "Скачать приложение",
    speedMph: "{s} миль/ч",
    speedKmh: "{s} км/ч",
    mapThemeTitle: "Тема карты",
    mapThemeSystem: "Система",
    mapThemeLight: "Светлая",
    mapThemeDark: "Тёмная",
    encIncompleteTitle: "Ссылка неполная",
    encIncompleteBody: "Часть ссылки отсутствует, поэтому местоположение нельзя открыть. Попросите отправителя снова поделиться полной ссылкой и откройте её в точности в том виде, в каком получили.",
    encUndecryptableTitle: "Не удаётся открыть ссылку",
    encUndecryptableBody: "Не удалось расшифровать местоположение по этой ссылке. Возможно, она скопирована с ошибкой. Попросите у отправителя новую ссылку.",
    encUnsupportedTitle: "Браузер не поддерживается",
    encUnsupportedBody: "Этот браузер не может открывать зашифрованные ссылки на местоположение. Обновите его или откройте ссылку в другом браузере.",
    encRevokedTitle: "Ссылка больше недоступна",
    encRevokedBody: "Возможно, отправитель прекратил делиться местоположением или отозвал ссылку.",
    encStale: "Местоположение может быть устаревшим",
    encUpdatedJustNow: "Обновлено только что",
    encUpdatedMinAgo: "Обновлено {n} мин назад",
    encEncrypted: "Сквозное шифрование",
    encLoading: "Загрузка местоположения...",
    encRetrying: "Проблема с соединением. Повторная попытка...",
    encMapUnavailable: "Не удалось загрузить карту. Последнее местоположение:",
  },
};

const SUPPORTED = ["en", "es", "fr", "ar", "zh", "ru"];
// Open Graph locales — used for the unfurl tags on share pages.
const OG_LOCALES = { en: "en_US", es: "es_ES", fr: "fr_FR", ar: "ar_AR", zh: "zh_CN", ru: "ru_RU" };

function resolveLang(url, acceptLanguage) {
  // ?lang= override wins
  const q = url.searchParams.get("lang");
  if (q && SUPPORTED.includes(q)) return q;
  if (acceptLanguage) {
    for (const part of acceptLanguage.split(",")) {
      const code = part.trim().slice(0, 2).toLowerCase();
      if (SUPPORTED.includes(code)) return code;
    }
  }
  return "en";
}

const IMPERIAL_COUNTRIES = new Set(["US", "GB", "LR", "MM"]);

function resolveUnits(url, request) {
  const q = url.searchParams.get("units");
  if (q === "metric" || q === "imperial") return q;
  const cfCountry = (request.cf && request.cf.country) ? request.cf.country.toUpperCase() : null;
  if (cfCountry && IMPERIAL_COUNTRIES.has(cfCountry)) return "imperial";
  const acceptLang = request.headers.get("accept-language");
  if (acceptLang) {
    const match = acceptLang.match(/[-_]([A-Za-z]{2})/);
    if (match && match[1] && IMPERIAL_COUNTRIES.has(match[1].toUpperCase())) {
      return "imperial";
    }
  }
  return "metric";
}

export async function onRequest(context) {
  const { request, env, params } = context;

  // 1. Extract token from [[token]] catch-all route
  const rawToken = params.token ? params.token[0] : null;
  const url = new URL(request.url);
  const lang = resolveLang(url, request.headers.get("accept-language"));
  const t = STRINGS[lang];
  const viewerUnits = resolveUnits(url, request);

  if (!rawToken || !TOKEN_REGEX.test(rawToken)) {
    return htmlResponse(400, t.invalidTitle, t.invalidBody, lang);
  }

  const token = rawToken.toLowerCase();
  const isJson = url.searchParams.get("json") === "1";

  const supabaseUrl = env.SUPABASE_URL;
  // Public share links only ever need the get_shared_location RPC, which is
  // SECURITY DEFINER and granted to anon. Never bind the service-role key to
  // this function: it would bypass RLS for the whole database.
  const anonKey = env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return htmlResponse(503, t.unavailableTitle, t.unavailableBody, lang);
  }
  const authHeaders = {
    "apikey": anonKey,
    "Authorization": `Bearer ${anonKey}`,
    "Accept": "application/json",
  };

  try {
    // 2a. Primary: Try get_shared_location RPC (SECURITY DEFINER, granted to anon)
    let rpcSucceeded = false;
    let shareMode = "single";
    let locations = [];

    try {
      const rpcUrl = `${supabaseUrl}/rest/v1/rpc/get_shared_location`;
      const rpcRes = await fetch(rpcUrl, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ p_token: token }),
      });

      if (rpcRes.ok) {
        const rpcData = await rpcRes.json();
        if (rpcData && rpcData.status === "not_found") {
          return htmlResponse(404, t.notFoundTitle, t.notFoundBody, lang);
        }
        if (rpcData && rpcData.status === "expired") {
          return htmlResponse(410, t.expiredH1, renderExpiredPage(t), lang);
        }
        if (rpcData && rpcData.status === "ok" && rpcData.encrypted === true) {
          // End-to-end encrypted share: the server only ever relays ciphertext.
          return isJson
            ? encryptedJsonResponse(rpcData)
            : encryptedPageResponse(token, t, lang, viewerUnits);
        }
        if (rpcData && rpcData.status === "ok") {
          rpcSucceeded = true;
          shareMode = rpcData.mode || "single";
          locations = (rpcData.locations || []).map(loc => {
            const memberUnits = loc.units || viewerUnits;
            const speedMs = loc.speed_ms != null ? loc.speed_ms : null;
            let speedDisplay = loc.speed_display;
            if (!speedDisplay && speedMs != null && speedMs >= 0) {
              const isImp = memberUnits === "imperial";
              const sNum = isImp ? (speedMs * 2.23694) : (speedMs * 3.6);
              const tpl = isImp ? t.speedMph : t.speedKmh;
              speedDisplay = tpl.replace("{s}", Math.round(sNum));
            }
            return {
              user_id: loc.user_id || null,
              latitude: loc.latitude,
              longitude: loc.longitude,
              display_name: loc.display_name || t.crewMember,
              updated_at: loc.updated_at,
              avatar_url: loc.avatar_url || null,
              profile_emoji: loc.profile_emoji || null,
              speed_ms: speedMs,
              speed_display: speedDisplay,
              units: memberUnits,
            };
          });
        }
      }
    } catch (rpcErr) {
      console.warn("get_shared_location RPC attempt failed:", rpcErr);
    }

    if (!rpcSucceeded) {
      // The RPC is the only data path; fail closed instead of querying tables.
      return htmlResponse(502, t.unavailableTitle, t.unavailableBody, lang);
    }

    // JSON mode for client-side polling
    if (isJson) {
      const escapedLocations = locations.map(loc => ({
        ...loc,
        escaped_display_name: escapeHtml(loc.display_name),
      }));
      return new Response(JSON.stringify({ locations: escapedLocations, mode: shareMode }), {
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      });
    }

    return htmlResponse(200, t.liveTitle, renderPage(token, locations, shareMode, t, lang, viewerUnits), lang);
  } catch (err) {
    console.error("share worker error:", err);
    return htmlResponse(502, t.unavailableTitle, t.unavailableBody, lang);
  }
}

// --- Response helpers ---

function htmlResponse(status, title, body, lang) {
  const dir = lang === "ar" ? ' dir="rtl"' : "";
  const rtlFont = lang === "ar"
    ? 'html[dir="rtl"]{font-family:"Noto Naskh Arabic",system-ui,-apple-system,sans-serif}'
    : "";
  const html = `<!DOCTYPE html><html lang="${lang}"${dir}><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no"><title>${title}</title><style>body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:0;background:#1a1a2e;color:#eee;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:20px;box-sizing:border-box}h1{font-size:1.5rem;margin-bottom:0.5rem}p{color:#aaa}${rtlFont}</style></head><body>${body}</body></html>`;
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}

// --- Page templates ---

function renderExpiredPage(t) {
  return `
    <h1>${t.expiredH1}</h1>
    <p>${t.expiredP}</p>
    <div style="margin-top:24px">
      <a href="https://crewradr.app" style="display:inline-block;padding:12px 24px;background:#4f8cff;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">${t.getCrewRadr}</a>
    </div>
  `;
}

function renderPage(token, locations, mode, t, lang, viewerUnits) {
  // Only members with real coordinates can be pinned; stale/no-fix members
  // still appear in the JSON feed so the UI can surface them separately.
  const pinnable = locations.filter(loc => loc.latitude != null && loc.longitude != null);
  const locJson = JSON.stringify(locations).replace(/</g, '\\u003c');
  const center = pinnable.length > 0
    ? `[${pinnable[0].latitude}, ${pinnable[0].longitude}]`
    : "[40.7128, -74.0060]";
  const zoom = pinnable.length > 0 ? "15" : "4";
  const noLocationsMessage = pinnable.length === 0
    ? `<div id="noloc" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.7);color:#fff;padding:12px 20px;border-radius:8px;z-index:1000;font-size:0.9rem">${mode === 'crew' ? t.noCrewLocations : t.waitingForLocation}</div>`
    : "";

  const updatedLabel = t.updated;

  // Unfurl metadata — the map is client-rendered, so crawlers only ever see
  // this markup; it has to carry the resolved locale.
  const unfurlDesc = mode === "crew" ? t.viewingCrew : t.viewingLive;
  const unfurlTags = `<meta name="description" content="${escapeHtml(unfurlDesc)}">
    <meta property="og:title" content="${escapeHtml(t.liveTitle)}">
    <meta property="og:description" content="${escapeHtml(unfurlDesc)}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="CrewRadr">
    <meta property="og:locale" content="${OG_LOCALES[lang] || "en_US"}">
    <meta property="og:image" content="https://crewradr.app/logo-512.png">
    <meta name="twitter:card" content="summary">`;

  return `<!DOCTYPE html><html lang="${lang}"${lang === "ar" ? ' dir="rtl"' : ""}><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <meta name="robots" content="noindex,nofollow">
    <title>${escapeHtml(t.liveTitle)}</title>
    ${unfurlTags}
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin="anonymous"><\/script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { height: 100%; width: 100%; font-family: system-ui, -apple-system, sans-serif; }
      #map { height: 100%; width: 100%; }
      #cta {
        position: fixed; bottom: 0; left: 0; right: 0;
        background: linear-gradient(180deg, transparent, rgba(26,26,46,0.95) 30%);
        padding: 24px 16px 20px; z-index: 1001;
        display: flex; flex-direction: column; align-items: center; gap: 10px;
      }
      #cta .badge { font-size: 0.8rem; color: #888; }
      #cta .title { font-size: 1rem; font-weight: 600; color: #fff; }
      #cta .btn {
        display: inline-block; padding: 12px 32px;
        background: #4f8cff; color: #fff; text-decoration: none;
        border-radius: 8px; font-weight: 600; font-size: 0.95rem;
      }
      .leaflet-popup-content { font-family: system-ui, -apple-system, sans-serif; font-size: 0.9rem; }
      /* Dark mode: invert Google raster tiles (tile pane only — markers are
         in a sibling pane and stay untouched) and theme Leaflet chrome. */
      #map.dark { background: #12161a; }
      #map.dark .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.92) contrast(0.9) grayscale(0.12); }
      #map.dark .leaflet-popup-content-wrapper, #map.dark .leaflet-popup-tip { background: #1e242b; color: #e6e6e6; }
      #map.dark .leaflet-bar a { background: #1e242b; color: #e6e6e6; border-color: #333a42; }
      #map.dark .leaflet-control-attribution { background: rgba(18,22,26,0.85); color: #999; }
      #map.dark .leaflet-control-attribution a { color: #b0c4ff; }
      #theme-btn {
        position: fixed; top: 12px; right: 12px; z-index: 1100;
        display: flex; align-items: center; gap: 6px;
        padding: 8px 10px; border: none; border-radius: 8px;
        background: rgba(26,26,46,0.92); color: #fff;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 0.8rem; font-weight: 600; cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      }
      #theme-menu {
        position: fixed; top: 48px; right: 12px; z-index: 1100;
        display: none; flex-direction: column; min-width: 130px;
        background: rgba(26,26,46,0.96); border-radius: 10px;
        padding: 6px; box-shadow: 0 4px 16px rgba(0,0,0,0.35);
      }
      #theme-menu.open { display: flex; }
      #theme-menu button {
        border: none; background: transparent; color: #ddd;
        text-align: left; padding: 8px 10px; border-radius: 6px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 0.85rem; cursor: pointer;
      }
      #theme-menu button:hover { background: rgba(255,255,255,0.08); }
      #theme-menu button.selected { color: #fff; font-weight: 700; }
    </style>
    </head><body>
    <div id="map"></div>
    <button id="theme-btn" title="${escapeHtml(t.mapThemeTitle)}" aria-haspopup="true" aria-expanded="false">🎨 <span id="theme-label"></span></button>
    <div id="theme-menu" role="menu"></div>
    ${noLocationsMessage}
    <div id="cta">
      <div class="badge">📍 ${mode === 'crew' ? t.viewingCrew : t.viewingLive}</div>
      <div class="title">${mode === 'crew' ? t.seeCrew : t.seeLive}</div>
      <a href="https://crewradr.app" class="btn">${t.getTheApp}</a>
    </div>
    <script>
      const UPDATED_LABEL = ${JSON.stringify(updatedLabel)};
      const LANG = ${JSON.stringify(lang)};
      const THEME = { system: ${JSON.stringify(t.mapThemeSystem)}, light: ${JSON.stringify(t.mapThemeLight)}, dark: ${JSON.stringify(t.mapThemeDark)} };
      const locations = ${locJson};
      const pinnable = locations.filter(l => l.latitude != null && l.longitude != null);
      const map = L.map('map').setView(${center}, ${zoom});

      // Profile icon marker: emoji (when set) or first initial on a
      // deterministic color, matching the in-app crew markers.
      // profile_emoji is user-writable via the API, so HTML-escape it —
      // real emoji contain no HTML metacharacters and render unchanged.
      function escapeHtml(s) {
        return String(s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }
      function profileIcon(name, emoji, avatarUrl) {
        // Profile photo (crew_members.avatar_url) wins when present and a
        // sane https URL — otherwise emoji / initial on deterministic color.
        // avatar_url is user-writable, so validate shape AND escape it.
        // NOTE: no regex — backslash escapes get mangled by the server-side
        // template literal, and the broken regex kills the whole script.
        function isSafeAvatarUrl(u) {
          if (typeof u !== 'string' || u.length === 0 || u.length > 500) return false;
          if (u.indexOf('https://') !== 0) return false;
          for (let i = 0; i < u.length; i++) {
            const c = u.charCodeAt(i);
            // space/control chars (<=32) and " ' < > are forbidden
            if (c <= 32 || c === 34 || c === 39 || c === 60 || c === 62) return false;
          }
          return true;
        }
        if (isSafeAvatarUrl(avatarUrl)) {
          return L.divIcon({
            className: '',
            html: '<div style="width:34px;height:34px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);background-image:url(&quot;' + escapeHtml(avatarUrl) + '&quot;);background-size:cover;background-position:center"></div>',
            iconSize: [34, 34],
            iconAnchor: [17, 17],
            popupAnchor: [0, -19],
          });
        }
        let hue = 0;
        for (let i = 0; i < name.length; i++) hue = (hue * 31 + name.charCodeAt(i)) % 360;
        const bg = 'hsl(' + hue + ', 65%, 48%)';
        const safeEmoji = escapeHtml(emoji || '');
        const inner = emoji
          ? '<span style="font-size:19px;line-height:1">' + safeEmoji + '</span>'
          : '<span style="color:#fff;font-weight:700;font-size:15px;font-family:system-ui,-apple-system,sans-serif">' + (name.trim().charAt(0).toUpperCase() || '?') + '</span>';
        return L.divIcon({
          className: '',
          html: '<div style="width:34px;height:34px;border-radius:50%;background:' + bg + ';border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;overflow:hidden">' + inner + '</div>',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          popupAnchor: [0, -19],
        });
      }

      // Google Maps raster tiles — same provider as the in-app map.
      L.tileLayer('https://{s}.google.com/vt/lyrs=m&hl=${lang}&x={x}&y={y}&z={z}', {
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps',
        maxZoom: 20,
      }).addTo(map);

      // Map theme: System follows the OS; Light/Dark are explicit. Stored
      // per-viewer in localStorage (default system).
      const darkMq = window.matchMedia('(prefers-color-scheme: dark)') || { matches: false, addEventListener: null, addListener: null };
      function storedMapTheme() {
        try {
          const v = localStorage.getItem('crewradr-map-theme');
          return (v === 'light' || v === 'dark') ? v : 'system';
        } catch (e) { return 'system'; }
      }
      function themeLabel(option) {
        return option === 'light' ? THEME.light : option === 'dark' ? THEME.dark : THEME.system;
      }
      function applyTheme(option) {
        const dark = option === 'dark' || (option === 'system' && darkMq.matches);
        document.getElementById('map').classList.toggle('dark', dark);
        document.getElementById('theme-label').textContent = themeLabel(option);
        const menu = document.getElementById('theme-menu');
        Array.prototype.forEach.call(menu.children, function (btn) {
          btn.classList.toggle('selected', btn.dataset.theme === option);
        });
      }
      const menu = document.getElementById('theme-menu');
      ['system', 'light', 'dark'].forEach(function (option) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = themeLabel(option);
        btn.dataset.theme = option;
        btn.setAttribute('role', 'menuitem');
        btn.addEventListener('click', function () {
          try { localStorage.setItem('crewradr-map-theme', option); } catch (e) {}
          mapTheme = option;
          applyTheme(option);
          menu.classList.remove('open');
          document.getElementById('theme-btn').setAttribute('aria-expanded', 'false');
        });
        menu.appendChild(btn);
      });
      document.getElementById('theme-btn').addEventListener('click', function () {
        const open = menu.classList.toggle('open');
        document.getElementById('theme-btn').setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      document.addEventListener('click', function (e) { if (!document.getElementById('theme-btn').contains(e.target) && !document.getElementById('theme-menu').contains(e.target)) { menu.classList.remove('open'); document.getElementById('theme-btn').setAttribute('aria-expanded', 'false'); } });
      let mapTheme = storedMapTheme();
      applyTheme(mapTheme);
      if (darkMq.addEventListener) darkMq.addEventListener('change', function () { if (mapTheme === 'system') applyTheme(mapTheme); });
      else if (darkMq.addListener) darkMq.addListener(function () { if (mapTheme === 'system') applyTheme(mapTheme); });

      function popupHtml(loc) {
        const spText = loc.speed_display ? ' &middot; &#128663; ' + escapeHtml(loc.speed_display) : '';
        const emojiPrefix = loc.profile_emoji ? '<span style="font-size:1.15rem;vertical-align:middle;margin-right:4px">' + escapeHtml(loc.profile_emoji) + '</span>' : '';
        const ts = loc.updated_at
          ? new Date(loc.updated_at).toLocaleString(LANG, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : '';
        return emojiPrefix + '<b>' + escapeHtml(loc.display_name) + '</b>' + spText + '<br><small>' + UPDATED_LABEL + ' ' + ts + '</small>';
      }

      // Marker sync: update in place so open popups survive the 15-second
      // poll — no churn, no flicker, markers keep their identity.
      const markers = new Map();
      function markerKey(loc) { return loc.user_id || loc.display_name; }

      function syncMarkers(list) {
        const seen = new Set();
        list.forEach(loc => {
          if (loc.latitude == null || loc.longitude == null) return;
          const key = markerKey(loc);
          seen.add(key);
          const latlng = [loc.latitude, loc.longitude];
          const html = popupHtml(loc);
          const existing = markers.get(key);
          if (existing) {
            const wasOpen = existing.isPopupOpen();
            existing.setLatLng(latlng);
            existing.setPopupContent(html);
            if (wasOpen) { existing.closePopup(); existing.openPopup(); }
          } else {
            markers.set(key, L.marker(latlng, { icon: profileIcon(loc.display_name || '', loc.profile_emoji || null, loc.avatar_url || null) })
              .bindPopup(html)
              .addTo(map));
          }
        });
        for (const [key, m] of markers) {
          if (!seen.has(key)) { map.removeLayer(m); markers.delete(key); }
        }
      }

      syncMarkers(locations);

      if (pinnable.length > 1) {
        const bounds = L.latLngBounds(pinnable.map(l => [l.latitude, l.longitude]));
        map.fitBounds(bounds.pad(0.1));
      }

      // Auto-refresh every 15 seconds
      setInterval(async () => {
        try {
          const resp = await fetch('?json=1&units=' + encodeURIComponent(${JSON.stringify(viewerUnits)}) + '&lang=' + encodeURIComponent(LANG));
          if (!resp.ok) return;
          const data = await resp.json();
          if (!data.locations || data.locations.length === 0) return;
          const noloc = document.getElementById('noloc');
          if (noloc) noloc.remove();
          syncMarkers(data.locations);
          // Recenter when the page initially had no pinnable locations.
          if (pinnable.length === 0) {
            const fresh = data.locations.filter(l => l.latitude != null && l.longitude != null);
            if (fresh.length === 1) {
              map.setView([fresh[0].latitude, fresh[0].longitude], 15);
            } else if (fresh.length > 1) {
              const bounds = L.latLngBounds(fresh.map(l => [l.latitude, l.longitude]));
              map.fitBounds(bounds.pad(0.1));
            }
          }
        } catch(e) { /* silent — polling is best-effort */ }
      }, 15000);
    <\/script>
    </body></html>
  `;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// BEGIN encrypted viewer
// End-to-end encrypted shares (`encrypted: true` from get_shared_location).
// The key lives only in the URL fragment (#k=...), which browsers never send
// to a server, so this function only ever sees and relays ciphertext. The
// shell page carries no position, name, avatar or payload; the browser
// decrypts with /assets/share-viewer-core.js. Decrypted, sender-controlled
// text is rendered with textContent only (never as HTML).

const ENC_STRING_KEYS = [
  "encIncompleteTitle", "encIncompleteBody", "encUndecryptableTitle", "encUndecryptableBody",
  "encUnsupportedTitle", "encUnsupportedBody", "encRevokedTitle", "encRevokedBody",
  "encStale", "encUpdatedJustNow", "encUpdatedMinAgo", "encEncrypted", "encLoading",
  "encRetrying", "expiredH1", "expiredP", "waitingForLocation", "crewMember",
  "speedMph", "speedKmh", "encMapUnavailable",
];

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_CSS_SRI = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_JS_SRI = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";

function makeNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

// Headers shared by the encrypted HTML shell and its JSON feed.
function encryptedPrivacyHeaders(contentType) {
  return {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex",
    "X-Content-Type-Options": "nosniff",
  };
}

// Nonce-based strict CSP following Google's Maps JavaScript API CSP guidance
// (per-response nonce + 'strict-dynamic', `https:` fallback for browsers
// without 'strict-dynamic', object-src and base-uri locked down). The viewer
// draws Google raster tiles through Leaflet, exactly like the legacy page,
// not the Maps JS API, so the guidance's 'unsafe-eval'/blob: allowances
// (needed only by the Maps JS API) are left out.
function encryptedCsp(nonce) {
  return [
    "default-src 'none'",
    `script-src 'nonce-${nonce}' 'strict-dynamic' https:`,
    "style-src 'self' 'unsafe-inline' https://unpkg.com",
    "img-src 'self' data: https://*.google.com https://unpkg.com",
    "connect-src 'self'",
    "font-src 'self'",
    "manifest-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join("; ");
}

function encryptedJsonResponse(rpcData) {
  const body = {
    encrypted: true,
    enc_payload: rpcData.enc_payload ?? null,
    enc_updated_at: rpcData.enc_updated_at ?? null,
    enc_seq: rpcData.enc_seq ?? null,
    expires_at: rpcData.expires_at ?? null,
    server_time: rpcData.server_time ?? null,
    share_kind: rpcData.share_kind ?? null,
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      ...encryptedPrivacyHeaders("application/json; charset=utf-8"),
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    },
  });
}

function encryptedPageResponse(token, t, lang, viewerUnits) {
  const nonce = makeNonce();
  return new Response(renderEncryptedPage(token, t, lang, viewerUnits, nonce), {
    status: 200,
    headers: {
      ...encryptedPrivacyHeaders("text/html; charset=utf-8"),
      "Content-Security-Policy": encryptedCsp(nonce),
      "X-Frame-Options": "DENY",
      "Permissions-Policy": "geolocation=(), camera=(), microphone=()",
    },
  });
}

function renderEncryptedPage(token, t, lang, viewerUnits, nonce) {
  const s = {};
  for (const k of ENC_STRING_KEYS) s[k] = t[k];
  // `<` is escaped so no string can close the script element.
  const cfg = JSON.stringify({ token, lang, units: viewerUnits, s }).replace(/</g, "\\u003c");
  const dir = lang === "ar" ? ' dir="rtl"' : "";
  const rtlFont = lang === "ar"
    ? 'html[dir="rtl"] { font-family: "Noto Naskh Arabic", system-ui, -apple-system, sans-serif; }'
    : "";
  const e = escapeHtml;

  return `<!DOCTYPE html><html lang="${lang}"${dir}><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <meta name="robots" content="noindex,nofollow">
    <meta name="referrer" content="no-referrer">
    <title>${e(t.liveTitle)}</title>
    <meta name="description" content="${e(t.viewingLive)}">
    <meta property="og:title" content="${e(t.liveTitle)}">
    <meta property="og:description" content="${e(t.viewingLive)}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="CrewRadr">
    <meta property="og:locale" content="${OG_LOCALES[lang] || "en_US"}">
    <meta property="og:image" content="https://crewradr.app/logo-512.png">
    <meta name="twitter:card" content="summary">
    <link rel="stylesheet" href="${LEAFLET_CSS}" integrity="${LEAFLET_CSS_SRI}" crossorigin="">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      [hidden] { display: none !important; }
      html, body { height: 100%; width: 100%; font-family: system-ui, -apple-system, sans-serif; background: #1a1a2e; }
      ${rtlFont}
      #map { height: 100%; width: 100%; }
      #map.dark { background: #12161a; }
      #map.dark .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.92) contrast(0.9) grayscale(0.12); }
      #map.dark .leaflet-bar a { background: #1e242b; color: #e6e6e6; border-color: #333a42; }
      #map.dark .leaflet-control-attribution { background: rgba(18,22,26,0.85); color: #999; }
      .pin {
        width: 34px; height: 34px; border-radius: 50%; border: 2px solid #fff;
        box-shadow: 0 2px 6px rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center;
        color: #fff; font-weight: 700; font-size: 15px; overflow: hidden;
      }
      #status {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.7); color: #fff; padding: 12px 20px; border-radius: 8px;
        z-index: 1000; font-size: 0.9rem; text-align: center; white-space: pre-line;
      }
      #stale {
        position: fixed; top: 12px; left: 12px; right: 12px; z-index: 1050;
        background: #b45309; color: #fff; padding: 8px 12px; border-radius: 8px;
        font-size: 0.85rem; font-weight: 600; text-align: center;
      }
      #card {
        position: fixed; left: 12px; right: 12px; bottom: 150px; z-index: 1050;
        background: rgba(26,26,46,0.94); color: #fff; padding: 10px 14px; border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }
      #who { font-weight: 700; font-size: 1rem; overflow-wrap: anywhere; }
      #meta, #retry { font-size: 0.8rem; color: #bbb; margin-top: 2px; }
      .panel {
        position: fixed; inset: 0; z-index: 2000; background: #1a1a2e; color: #eee;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        text-align: center; padding: 20px; gap: 12px;
      }
      .panel h1 { font-size: 1.5rem; }
      .panel p { color: #aaa; max-width: 34rem; }
      .panel a, #cta .btn {
        display: inline-block; padding: 12px 28px; background: #4f8cff; color: #fff;
        text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 0.95rem;
      }
      #cta {
        position: fixed; bottom: 0; left: 0; right: 0;
        background: linear-gradient(180deg, transparent, rgba(26,26,46,0.95) 30%);
        padding: 24px 16px 20px; z-index: 1001;
        display: flex; flex-direction: column; align-items: center; gap: 10px;
      }
      #cta .badge { font-size: 0.8rem; color: #aaa; }
    </style>
    </head><body>
    <div id="map"></div>
    <div id="status">${e(t.encLoading)}</div>
    <div id="stale" role="status" hidden>&#9888; ${e(t.encStale)}</div>
    <div id="card" hidden>
      <div id="who"></div>
      <div id="meta"></div>
      <div id="retry" hidden>${e(t.encRetrying)}</div>
    </div>
    <div id="panel" class="panel" hidden>
      <h1 id="panel-title"></h1>
      <p id="panel-body"></p>
      <a href="https://crewradr.app">${e(t.getCrewRadr)}</a>
    </div>
    <noscript><div class="panel"><h1>${e(t.encUnsupportedTitle)}</h1><p>${e(t.encUnsupportedBody)}</p></div></noscript>
    <div id="cta">
      <div class="badge">&#128274; ${e(t.encEncrypted)} &middot; ${e(t.viewingLive)}</div>
      <a href="https://crewradr.app" class="btn">${e(t.getTheApp)}</a>
    </div>
    <script nonce="${nonce}" src="/assets/share-viewer-core.js"></script>
    <script nonce="${nonce}" src="${LEAFLET_JS}" integrity="${LEAFLET_JS_SRI}" crossorigin="anonymous"></script>
    <script nonce="${nonce}">
    (function () {
      'use strict';
      var CFG = ${cfg};
      var S = CFG.s;
      var C = window.CrewRadrShare;
      var VISIBLE_MS = 5000;
      var HIDDEN_MS = 15000;
      var MAX_BACKOFF_MS = 120000;

      function byId(id) { return document.getElementById(id); }
      function show(id, on) { byId(id).hidden = !on; }

      var store = null;
      try { store = window.sessionStorage; } catch (err) { store = null; }

      // Read the key (fragment first, then this tab's sessionStorage), then
      // drop the fragment from the address bar.
      var hash = location.hash;
      var key = C ? C.resolveKey(location.hash, store, CFG.token) : null;
      if (location.hash) {
        try { history.replaceState(history.state, '', location.pathname + location.search); } catch (err) { /* ignore */ }
      }

      var stopped = false;
      var timer = null;
      var inFlight = false;
      var failures = 0;
      var lastSeq = null;
      var last = null;
      var lastName = null;
      var map = null;
      var marker = null;

      function stop() {
        stopped = true;
        if (timer) { clearTimeout(timer); timer = null; }
      }

      function showPanel(title, body) {
        stop();
        show('map', false);
        show('status', false);
        show('stale', false);
        show('card', false);
        show('cta', false);
        byId('panel-title').textContent = title;
        byId('panel-body').textContent = body;
        show('panel', true);
      }

      var hasSubtle = !!(window.isSecureContext !== false && window.crypto && window.crypto.subtle);
      if (!C) { showPanel(S.encUnsupportedTitle, S.encUnsupportedBody); return; }
      var state = C.viewerState(hash, hasSubtle, key);
      if (state === 'unsupported') { showPanel(S.encUnsupportedTitle, S.encUnsupportedBody); return; }
      if (state !== 'ready' || !key) { showPanel(S.encIncompleteTitle, S.encIncompleteBody); return; }

      function isDark() {
        var pref = 'system';
        try { pref = localStorage.getItem('crewradr-map-theme') || 'system'; } catch (err) { /* ignore */ }
        if (pref === 'dark') return true;
        if (pref === 'light') return false;
        return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      }

      function ensureMap() {
        if (map || !window.L) return;
        byId('map').classList.toggle('dark', isDark());
        map = L.map('map').setView([20, 0], 2);
        L.tileLayer('https://{s}.google.com/vt/lyrs=m&hl=' + encodeURIComponent(CFG.lang) + '&x={x}&y={y}&z={z}', {
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '&copy; Google Maps',
          maxZoom: 20,
        }).addTo(map);
      }

      // Marker icon built from DOM nodes: the initial goes in via textContent.
      function pinIcon(name) {
        var el = document.createElement('div');
        el.className = 'pin';
        var hue = 0;
        for (var i = 0; i < name.length; i++) hue = (hue * 31 + name.charCodeAt(i)) % 360;
        el.style.background = 'hsl(' + hue + ', 65%, 48%)';
        el.textContent = name.trim().charAt(0).toUpperCase() || '?';
        return L.divIcon({ className: '', html: el, iconSize: [34, 34], iconAnchor: [17, 17] });
      }

      function speedText(speedMs) {
        if (typeof speedMs !== 'number' || speedMs < 0) return '';
        var imperial = CFG.units === 'imperial';
        var n = Math.round(imperial ? speedMs * 2.23694 : speedMs * 3.6);
        return (imperial ? S.speedMph : S.speedKmh).replace('{s}', String(n));
      }

      function render(p) {
        var name = C.sanitizeName(p.name);
        byId('who').textContent = name || S.crewMember;
        show('card', true);
        if (p.status === 'waiting' || p.lat === null || p.lng === null) {
          byId('status').textContent = S.waitingForLocation;
          show('status', true);
          return;
        }
        ensureMap();
        if (!map) {
          // Leaflet did not load (blocked, offline or SRI mismatch): still show
          // where the sharer is, as plain text, and keep polling.
          // ('\\n' is escaped once for the enclosing server-side template.)
          byId('status').textContent = S.encMapUnavailable + '\\n' +
            Number(p.lat).toFixed(5) + ', ' + Number(p.lng).toFixed(5);
          show('status', true);
          return;
        }
        show('status', false);
        var ll = [p.lat, p.lng];
        if (!marker) {
          marker = L.marker(ll, { icon: pinIcon(name), keyboard: false, interactive: false }).addTo(map);
          map.setView(ll, 15);
        } else {
          marker.setLatLng(ll);
          if (name !== lastName) marker.setIcon(pinIcon(name));
        }
        lastName = name;
      }

      // Age and staleness are judged on server_time, never the local clock.
      function renderAge(serverTime) {
        if (!last || last.status === 'waiting' || last.lat === null) {
          show('stale', false);
          byId('meta').textContent = '';
          return;
        }
        var mins = C.minutesAgo(last.fixAt, serverTime);
        var parts = [];
        if (mins !== null) parts.push(mins < 1 ? S.encUpdatedJustNow : S.encUpdatedMinAgo.replace('{n}', String(mins)));
        var sp = speedText(last.speedMs);
        if (sp) parts.push(sp);
        byId('meta').textContent = parts.join(' · ');
        show('stale', C.isStale(last.fixAt, serverTime));
      }

      function schedule(ms) {
        if (stopped) return;
        if (timer) clearTimeout(timer);
        timer = setTimeout(poll, ms);
      }

      function nextDelay() { return document.hidden ? HIDDEN_MS : VISIBLE_MS; }

      function retryLater() {
        failures++;
        if (failures >= 2) show('retry', true);
        schedule(Math.min(nextDelay() * Math.pow(2, failures), MAX_BACKOFF_MS));
      }

      async function poll() {
        timer = null;
        if (stopped || inFlight) return;
        inFlight = true;
        try {
          await pollOnce();
        } catch (err) {
          retryLater();
        } finally {
          inFlight = false;
        }
      }

      async function pollOnce() {
        var res;
        try {
          res = await fetch('?json=1&lang=' + encodeURIComponent(CFG.lang), {
            cache: 'no-store',
            credentials: 'omit',
            headers: { Accept: 'application/json' },
          });
        } catch (err) { retryLater(); return; }

        if (res.status === 404) {
          C.forgetKey(store, CFG.token);
          showPanel(S.encRevokedTitle, S.encRevokedBody);
          return;
        }
        if (res.status === 410) {
          C.forgetKey(store, CFG.token);
          showPanel(S.expiredH1, S.expiredP);
          return;
        }
        if (!res.ok) { retryLater(); return; }

        var data;
        try { data = await res.json(); } catch (err) { retryLater(); return; }
        if (!data || data.encrypted !== true) { retryLater(); return; }
        failures = 0;
        show('retry', false);

        // enc_seq is only a hint to skip work; the decrypted seq decides.
        var hint = Number(data.enc_seq);
        var maybeNewer = lastSeq === null || data.enc_seq === null || !isFinite(hint) || C.isNewer(lastSeq, hint);
        if (data.enc_payload && maybeNewer) {
          try {
            var p = await C.decryptSharePayload(data.enc_payload, key, CFG.token);
            if (C.isNewer(lastSeq, p.seq)) {
              lastSeq = p.seq;
              last = p;
              render(p);
            }
          } catch (err) {
            if (!last) {
              showPanel(S.encUndecryptableTitle, S.encUndecryptableBody);
              return;
            }
            // Keep the last good position; a bad update never replaces it.
          }
        } else if (!data.enc_payload && !last) {
          byId('status').textContent = S.waitingForLocation;
        }
        renderAge(data.server_time);
        schedule(nextDelay());
      }

      document.addEventListener('visibilitychange', function () {
        if (!document.hidden && !stopped && !inFlight) {
          if (timer) clearTimeout(timer);
          timer = null;
          poll();
        }
      });

      poll();
    })();
    </script>
    </body></html>
  `;
}
// END encrypted viewer
