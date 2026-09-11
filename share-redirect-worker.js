const TOKEN_REGEX = /^[a-z2-9]{10,16}$/i;

// ── Rate Limiter ─────────────────────────────────────────────────────────────
const RL_WINDOW_MS = 60000;  // 1 minute
const RL_MAX_FAILS = 10;     // 10 failed attempts per window
var rlMap = new Map();       // IP → {count, resetTime}

function rateLimit(ip) {
  var now = Date.now();
  var entry = rlMap.get(ip);
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + RL_WINDOW_MS };
    rlMap.set(ip, entry);
  }
  entry.count++;
  return entry.count > RL_MAX_FAILS;
}

// ── Multi-Language Dictionaries ──────────────────────────────────────────────
const STRINGS = {
  en: {
    invalidTitle: "Invalid Share Link",
    invalidHeading: "🔗 Invalid Link",
    invalidBody: "This share link doesn't exist or has been revoked.",
    expiredTitle: "Link Expired",
    expiredHeading: "⏰ This link has expired",
    expiredBody: "Location sharing links are temporary for your privacy.",
    unavailableTitle: "Temporarily Unavailable",
    unavailableHeading: "502 — Temporarily Unavailable",
    unavailableBody: "Please try again in a moment.",
    tooManyTitle: "Too Many Requests",
    tooManyHeading: "🚦 Too Many Requests",
    tooManyBody: "Too many requests in a short time. Please wait a minute and try again.",
    liveTitle: "Live Location — CrewRadr",
    crewMember: "Crew Member",
    waitingForLocation: "Waiting for location...",
    noCrewLocations: "No members have shared location yet",
    justNow: "Just now",
    minAgo: "{m}m",
    hoursAgo: "{h}h {m}m",
    updated: "Updated",
    staleWarning: "⚠️ Location may have changed. Last updated {t} ago.",
    googleMaps: "Google Maps",
    appleMaps: "Apple Maps",
    viewingCrew: "Viewing crew location via CrewRadr",
    viewingLive: "Viewing live location via CrewRadr",
    encrypted: "Encrypted",
    autoExpires: "Auto-expires",
    getTheApp: "Get CrewRadr Free",
    speedMph: "{s} mph",
    speedKmh: "{s} km/h",
    mapThemeTitle: "Map theme",
    mapThemeSystem: "System",
    mapThemeLight: "Light",
    mapThemeDark: "Dark",
  },
  es: {
    invalidTitle: "Enlace de compartir no válido",
    invalidHeading: "🔗 Enlace no válido",
    invalidBody: "Este enlace de compartir no existe o ha sido revocado.",
    expiredTitle: "Enlace caducado",
    expiredHeading: "⏰ Este enlace ha caducado",
    expiredBody: "Los enlaces para compartir ubicación son temporales para tu privacidad.",
    unavailableTitle: "No disponible temporalmente",
    unavailableHeading: "502 — No disponible temporalmente",
    unavailableBody: "Inténtalo de nuevo en un momento.",
    tooManyTitle: "Demasiadas solicitudes",
    tooManyHeading: "🚦 Demasiadas solicitudes",
    tooManyBody: "Demasiadas solicitudes en poco tiempo. Espera un minuto e inténtalo de nuevo.",
    liveTitle: "Ubicación en vivo — CrewRadr",
    crewMember: "Miembro del grupo",
    waitingForLocation: "Esperando ubicación...",
    noCrewLocations: "Aún no hay miembros que compartan ubicación",
    justNow: "Justo ahora",
    minAgo: "{m}m",
    hoursAgo: "{h}h {m}m",
    updated: "Actualizado",
    staleWarning: "⚠️ La ubicación puede haber cambiado. Actualizado hace {t}.",
    googleMaps: "Google Maps",
    appleMaps: "Apple Maps",
    viewingCrew: "Viendo la ubicación del grupo vía CrewRadr",
    viewingLive: "Viendo la ubicación en vivo vía CrewRadr",
    encrypted: "Cifrado",
    autoExpires: "Caduca automáticamente",
    getTheApp: "Descarga CrewRadr Gratis",
    speedMph: "{s} mph",
    speedKmh: "{s} km/h",
    mapThemeTitle: "Tema del mapa",
    mapThemeSystem: "Sistema",
    mapThemeLight: "Claro",
    mapThemeDark: "Oscuro",
  },
  fr: {
    invalidTitle: "Lien de partage invalide",
    invalidHeading: "🔗 Lien invalide",
    invalidBody: "Ce lien de partage n'existe pas ou a été révoqué.",
    expiredTitle: "Lien expiré",
    expiredHeading: "⏰ Ce lien a expiré",
    expiredBody: "Les liens de partage de position sont temporaires pour votre confidentialité.",
    unavailableTitle: "Temporairement indisponible",
    unavailableHeading: "502 — Temporairement indisponible",
    unavailableBody: "Veuillez réessayer dans un instant.",
    tooManyTitle: "Trop de requêtes",
    tooManyHeading: "🚦 Trop de requêtes",
    tooManyBody: "Trop de requêtes en peu de temps. Veuillez patienter une minute et réessayer.",
    liveTitle: "Position en direct — CrewRadr",
    crewMember: "Membre de l'équipe",
    waitingForLocation: "En attente de la position...",
    noCrewLocations: "Aucun membre n'a encore partagé sa position",
    justNow: "À l'instant",
    minAgo: "{m}m",
    hoursAgo: "{h}h {m}m",
    updated: "Mis à jour",
    staleWarning: "⚠️ La position a pu changer. Mis à jour il y a {t}.",
    googleMaps: "Google Maps",
    appleMaps: "Apple Maps",
    viewingCrew: "Position de l'équipe via CrewRadr",
    viewingLive: "Position en direct via CrewRadr",
    encrypted: "Chiffré",
    autoExpires: "Expire automatiquement",
    getTheApp: "Obtenir CrewRadr Gratuitement",
    speedMph: "{s} mph",
    speedKmh: "{s} km/h",
    mapThemeTitle: "Thème de la carte",
    mapThemeSystem: "Système",
    mapThemeLight: "Clair",
    mapThemeDark: "Sombre",
  },
  ar: {
    invalidTitle: "رابط مشاركة غير صالح",
    invalidHeading: "🔗 رابط غير صالح",
    invalidBody: "رابط المشاركة هذا غير موجود أو تم إلغاؤه.",
    expiredTitle: "انتهت صلاحية الرابط",
    expiredHeading: "⏰ انتهت صلاحية هذا الرابط",
    expiredBody: "روابط مشاركة الموقع مؤقتة لحماية خصوصيتك.",
    unavailableTitle: "غير متاح مؤقتاً",
    unavailableHeading: "502 — غير متاح مؤقتاً",
    unavailableBody: "يرجى المحاولة مرة أخرى بعد لحظة.",
    tooManyTitle: "طلبات كثيرة جداً",
    tooManyHeading: "🚦 طلبات كثيرة جداً",
    tooManyBody: "طلبات كثيرة جداً في وقت قصير. يرجى الانتظار دقيقة ثم المحاولة مجدداً.",
    liveTitle: "الموقع المباشر — CrewRadr",
    crewMember: "عضو في الطاقم",
    waitingForLocation: "في انتظار الموقع...",
    noCrewLocations: "لم يشارك أي عضو موقعه بعد",
    justNow: "الآن",
    minAgo: "{m} د",
    hoursAgo: "{h} س {m} د",
    updated: "آخر تحديث",
    staleWarning: "⚠️ قد يكون الموقع قد تغير. آخر تحديث منذ {t}.",
    googleMaps: "خرائط Google",
    appleMaps: "خرائط Apple",
    viewingCrew: "عرض موقع الطاقم عبر CrewRadr",
    viewingLive: "عرض الموقع المباشر عبر CrewRadr",
    encrypted: "مشفر",
    autoExpires: "ينتهي تلقائياً",
    getTheApp: "احصل على CrewRadr مجاناً",
    speedMph: "{s} ميل/س",
    speedKmh: "{s} كم/س",
    mapThemeTitle: "سمة الخريطة",
    mapThemeSystem: "النظام",
    mapThemeLight: "فاتح",
    mapThemeDark: "داكن",
  },
  zh: {
    invalidTitle: "分享链接无效",
    invalidHeading: "🔗 链接无效",
    invalidBody: "此分享链接不存在或已被撤销。",
    expiredTitle: "链接已过期",
    expiredHeading: "⏰ 此链接已过期",
    expiredBody: "为了保护您的隐私，位置共享链接是临时的。",
    unavailableTitle: "暂时不可用",
    unavailableHeading: "502 — 暂时不可用",
    unavailableBody: "请稍后重试。",
    tooManyTitle: "请求过多",
    tooManyHeading: "🚦 请求过多",
    tooManyBody: "短时间内请求过多。请等待一分钟后再试。",
    liveTitle: "实时位置 — CrewRadr",
    crewMember: "团队成员",
    waitingForLocation: "等待位置信息...",
    noCrewLocations: "还没有成员共享位置",
    justNow: "刚刚",
    minAgo: "{m}分钟",
    hoursAgo: "{h}小时{m}分",
    updated: "更新于",
    staleWarning: "⚠️ 位置可能已改变。最后更新于 {t} 前。",
    googleMaps: "谷歌地图",
    appleMaps: "苹果地图",
    viewingCrew: "通过 CrewRadr 查看团队位置",
    viewingLive: "通过 CrewRadr 查看实时位置",
    encrypted: "已加密",
    autoExpires: "自动过期",
    getTheApp: "免费下载 CrewRadr",
    speedMph: "{s} 英里/小时",
    speedKmh: "{s} 公里/小时",
    mapThemeTitle: "地图主题",
    mapThemeSystem: "系统",
    mapThemeLight: "浅色",
    mapThemeDark: "深色",
  },
  ru: {
    invalidTitle: "Недействительная ссылка",
    invalidHeading: "🔗 Неверная ссылка",
    invalidBody: "Эта ссылка не существует или была отозвана.",
    expiredTitle: "Срок действия истёк",
    expiredHeading: "⏰ Срок действия этой ссылки истёк",
    expiredBody: "Ссылки для обмена местоположением временные — ради вашей конфиденциальности.",
    unavailableTitle: "Временно недоступно",
    unavailableHeading: "502 — Временно недоступно",
    unavailableBody: "Пожалуйста, повторите попытку через мгновение.",
    tooManyTitle: "Слишком много запросов",
    tooManyHeading: "🚦 Слишком много запросов",
    tooManyBody: "Слишком много запросов за короткое время. Подождите минуту и попробуйте снова.",
    liveTitle: "Живое местоположение — CrewRadr",
    crewMember: "Участник команды",
    waitingForLocation: "Ожидание местоположения...",
    noCrewLocations: "Участники ещё не поделились местоположением",
    justNow: "Только что",
    minAgo: "{m} мин",
    hoursAgo: "{h} ч {m} мин",
    updated: "Обновлено",
    staleWarning: "⚠️ Местоположение могло измениться. Обновлено {t} назад.",
    googleMaps: "Google Карты",
    appleMaps: "Apple Карты",
    viewingCrew: "Просмотр местоположения команды через CrewRadr",
    viewingLive: "Просмотр живого местоположения через CrewRadr",
    encrypted: "Зашифровано",
    autoExpires: "Автоматически истекает",
    getTheApp: "Скачать CrewRadr бесплатно",
    speedMph: "{s} миль/ч",
    speedKmh: "{s} км/ч",
    mapThemeTitle: "Тема карты",
    mapThemeSystem: "Система",
    mapThemeLight: "Светлая",
    mapThemeDark: "Тёмная",
  },
};

const SUPPORTED_LANGS = ["en", "es", "fr", "ar", "zh", "ru"];
const IMPERIAL_COUNTRIES = new Set(["US", "GB", "LR", "MM"]);
// Open Graph locales — used for the unfurl tags on share pages.
const OG_LOCALES = { en: "en_US", es: "es_ES", fr: "fr_FR", ar: "ar_AR", zh: "zh_CN", ru: "ru_RU" };

function resolveLang(url, acceptLanguage) {
  var q = url.searchParams.get("lang");
  if (q && SUPPORTED_LANGS.includes(q.toLowerCase())) return q.toLowerCase();
  if (acceptLanguage) {
    var parts = acceptLanguage.split(",");
    for (var i = 0; i < parts.length; i++) {
      var code = parts[i].trim().slice(0, 2).toLowerCase();
      if (SUPPORTED_LANGS.includes(code)) return code;
    }
  }
  return "en";
}

function resolveUnits(url, request, profileUnits) {
  var q = url.searchParams.get("units");
  if (q === "metric" || q === "imperial") return q;
  if (profileUnits === "metric" || profileUnits === "imperial") return profileUnits;
  var cfCountry = (request.cf && request.cf.country) ? request.cf.country.toUpperCase() : null;
  if (cfCountry && IMPERIAL_COUNTRIES.has(cfCountry)) return "imperial";
  var acceptLang = request.headers.get("accept-language");
  if (acceptLang) {
    var match = acceptLang.match(/[-_]([A-Za-z]{2})/);
    if (match && match[1] && IMPERIAL_COUNTRIES.has(match[1].toUpperCase())) {
      return "imperial";
    }
  }
  return "metric";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/share/')) {
      return handleShare(request, env, url);
    }

    // All other requests pass through to origin (Cloudflare Pages)
    return fetch(request);
  }
};

async function handleShare(request, env, url) {
  var clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
  var lang = resolveLang(url, request.headers.get("accept-language"));
  var t = STRINGS[lang] || STRINGS.en;

  const match = url.pathname.match(/\/share\/([a-z2-9]+)$/i);
  if (!match) {
    rateLimit(clientIP);
    return htmlRes(404, t.invalidTitle, t.invalidHeading, t.invalidBody, t, lang);
  }

  const token = match[1].toLowerCase();
  const isJson = url.searchParams.get("json") === "1";

  if (!TOKEN_REGEX.test(token)) {
    rateLimit(clientIP);
    return htmlRes(400, t.invalidTitle, t.invalidHeading, t.invalidBody, t, lang);
  }

  if (rateLimit(clientIP)) {
    return htmlRes(429, t.tooManyTitle, t.tooManyHeading, t.tooManyBody, t, lang);
  }

  const base = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const mapsKey = env.GOOGLE_MAPS_API_KEY || "";
  const auth = { "apikey": key, "Authorization": "Bearer " + key };

  try {
    // 1. Primary: Try get_shared_location RPC (SECURITY DEFINER — works with publishable/anon or service key)
    try {
      const rpcUrl = base + "/rest/v1/rpc/get_shared_location";
      const rpcRes = await fetch(rpcUrl, {
        method: "POST",
        headers: Object.assign({}, auth, { "Content-Type": "application/json" }),
        body: JSON.stringify({ p_token: token }),
      });

      if (rpcRes.ok) {
        const rpcData = await rpcRes.json();
        if (rpcData) {
          if (rpcData.status === "not_found") {
            rateLimit(clientIP);
            return htmlRes(404, t.invalidTitle, t.invalidHeading, t.invalidBody, t, lang);
          }
          if (rpcData.status === "expired") {
            rateLimit(clientIP);
            return htmlRes(410, t.expiredTitle, t.expiredHeading, t.expiredBody, t, lang);
          }
          if (rpcData.status === "ok") {
            const viewerUnits = resolveUnits(url, request, null);
            const rpcLocs = (rpcData.locations || []).map(function(l) {
              const mUnits = l.units || viewerUnits;
              const sMs = l.speed_ms != null ? l.speed_ms : null;
              let sDisplay = l.speed_display;
              if (!sDisplay && sMs != null && sMs >= 0) {
                const isImp = mUnits === "imperial";
                const sNum = isImp ? (sMs * 2.23694) : (sMs * 3.6);
                const tpl = isImp ? t.speedMph : t.speedKmh;
                sDisplay = tpl.replace("{s}", Math.round(sNum));
              }
              return {
                latitude: l.latitude,
                longitude: l.longitude,
                display_name: l.display_name || t.crewMember,
                updated_at: l.updated_at,
                avatar_url: l.avatar_url || null,
                profile_emoji: l.profile_emoji || null,
                escaped_display_name: esc(l.display_name || t.crewMember),
                speed: sMs != null ? Math.round(mUnits === "imperial" ? sMs * 2.23694 : sMs * 3.6) : null,
                speed_ms: sMs,
                speed_display: sDisplay,
                units: mUnits,
              };
            });

            if (isJson) {
              return new Response(JSON.stringify({
                locations: rpcLocs,
                mode: rpcData.mode,
                units: viewerUnits,
                lang: lang,
                expires_at: rpcData.expires_at,
              }), { headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
                "X-Robots-Tag": "noindex, nofollow",
              }});
            }

            var html = renderPage(rpcLocs, rpcData.mode, mapsKey, t, lang, viewerUnits);
            return new Response(html, {
              status: 200,
              headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Referrer-Policy": "no-referrer",
                "X-Content-Type-Options": "nosniff",
              },
            });
          }
        }
      }
    } catch (rpcErr) {
      // Fall through to PostgREST query
    }

    // 2. Fallback: Direct PostgREST queries
    const now = new Date().toISOString();
    const shareRes = await fetch(
      base + "/rest/v1/location_shares?token=eq." + encodeURIComponent(token) + "&expires_at=gt." + encodeURIComponent(now) + "&select=*",
      { headers: auth }
    );
    if (!shareRes.ok) {
      return htmlRes(502, t.unavailableTitle, t.unavailableHeading, t.unavailableBody, t, lang);
    }

    const shares = await shareRes.json();
    if (!shares || shares.length === 0) {
      const allRes = await fetch(
        base + "/rest/v1/location_shares?token=eq." + encodeURIComponent(token) + "&select=id",
        { headers: auth }
      );
      const all = allRes.ok ? await allRes.json() : [];
      rateLimit(clientIP);
      return (all && all.length > 0)
        ? htmlRes(410, t.expiredTitle, t.expiredHeading, t.expiredBody, t, lang)
        : htmlRes(404, t.invalidTitle, t.invalidHeading, t.invalidBody, t, lang);
    }

    const share = shares[0];
    const viewerUnits = resolveUnits(url, request, null);
    const locations = (await fetchLocations(base, auth, share, viewerUnits, t)).map(function(l) {
      return {
        latitude: l.latitude,
        longitude: l.longitude,
        display_name: l.display_name,
        updated_at: l.updated_at,
        avatar_url: l.avatar_url,
        profile_emoji: l.profile_emoji || null,
        escaped_display_name: esc(l.display_name),
        speed: l.speed != null ? l.speed : null,
        speed_ms: l.speed_ms != null ? l.speed_ms : null,
        speed_display: l.speed_display || null,
        units: l.units || viewerUnits,
      };
    });

    if (isJson) {
      return new Response(JSON.stringify({
        locations: locations,
        mode: share.mode,
        units: viewerUnits,
        lang: lang,
      }), { headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      }});
    }

    var html = renderPage(locations, share.mode, mapsKey, t, lang, viewerUnits);
    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return htmlRes(502, t.unavailableTitle, t.unavailableHeading, t.unavailableBody, t, lang);
  }
}

async function fetchLocations(base, auth, share, viewerUnits, t) {
  var locs = [];

  if (share.mode === "single") {
    var locUrl = base + "/rest/v1/location_logs?crew_id=eq." + encodeURIComponent(share.crew_id) + "&user_id=eq." + encodeURIComponent(share.creator_id) + "&latitude=not.is.null&longitude=not.is.null&order=created_at.desc&limit=5&select=latitude,longitude,created_at,speed_ms,encrypted_payload";
    var r = await fetch(locUrl, { headers: auth });
    var data = r.ok ? await r.json() : [];

    if (!data || data.length === 0) {
      // Fallback: check location_logs by user_id alone
      var fallbackUrl = base + "/rest/v1/location_logs?user_id=eq." + encodeURIComponent(share.creator_id) + "&latitude=not.is.null&longitude=not.is.null&order=created_at.desc&limit=5&select=latitude,longitude,created_at,speed_ms,encrypted_payload";
      var fallbackR = await fetch(fallbackUrl, { headers: auth });
      if (fallbackR.ok) data = await fallbackR.json();
    }

    // Fallback: direct coordinates stored on the share itself
    if ((!data || data.length === 0) && share.latitude != null && share.longitude != null) {
      data = [{
        latitude: share.latitude,
        longitude: share.longitude,
        created_at: share.updated_at || share.created_at,
        speed_ms: share.speed_ms,
      }];
    }

    if (!data || data.length === 0) {
      var anyUrl = base + "/rest/v1/location_logs?user_id=eq." + encodeURIComponent(share.creator_id) + "&order=created_at.desc&limit=3&select=latitude,longitude,created_at,speed_ms,encrypted_payload";
      var anyR = await fetch(anyUrl, { headers: auth });
      if (anyR.ok) data = await anyR.json();
    }

    if (data && data[0]) {
      var d = data[0];
      // Fallback: try encrypted_payload if lat/lng are NULL (pre-backfill rows)
      if ((d.latitude == null || d.longitude == null) && d.encrypted_payload) {
        try {
          var p = JSON.parse(d.encrypted_payload);
          d.latitude = p.lat != null ? p.lat : (p.latitude != null ? p.latitude : null);
          d.longitude = p.lng != null ? p.lng : (p.longitude != null ? p.longitude : null);
          if (d.speed_ms == null && p.speed != null) d.speed_ms = p.speed;
        } catch (_) { /* encrypted — skip */ }
      }
      if (d.latitude != null && d.longitude != null) {
        var pr = await fetch(
          base + "/rest/v1/profiles?user_id=eq." + encodeURIComponent(share.creator_id) + "&select=display_name,avatar_url,measurement_system",
          { headers: auth }
        );
        var p = pr.ok ? await pr.json() : [];
        var prof = (p && p[0]) || null;
        var memberUnits = (prof && prof.measurement_system) ? prof.measurement_system : viewerUnits;
        var speedMs = d.speed_ms != null ? d.speed_ms : null;
        var speedDisplay = null;
        var speedNum = null;
        if (speedMs != null && speedMs >= 0) {
          var isImp = memberUnits === "imperial";
          speedNum = isImp ? (speedMs * 2.23694) : (speedMs * 3.6);
          var tpl = isImp ? t.speedMph : t.speedKmh;
          speedDisplay = tpl.replace("{s}", Math.round(speedNum));
        }
        locs.push({
          latitude: d.latitude,
          longitude: d.longitude,
          display_name: (prof && prof.display_name) || t.crewMember,
          updated_at: d.created_at,
          avatar_url: prof ? prof.avatar_url : null,
          speed: speedNum,
          speed_ms: speedMs,
          speed_display: speedDisplay,
          units: memberUnits,
        });
      }
    }
  } else if (share.mode === "crew" && share.crew_id) {
    var mr = await fetch(
      base + "/rest/v1/crew_members?crew_id=eq." + encodeURIComponent(share.crew_id) + "&select=user_id",
      { headers: auth }
    );
    var members = mr.ok ? await mr.json() : [];
    if (members && members.length > 0) {
      var ids = members.map(function(m) { return m.user_id; });
      var inClause = ids.map(function(id) { return encodeURIComponent(id); }).join(",");
      var lr = await fetch(
        base + "/rest/v1/location_logs?crew_id=eq." + encodeURIComponent(share.crew_id) + "&user_id=in.(" + inClause + ")&latitude=not.is.null&longitude=not.is.null&order=created_at.desc&limit=" + Math.max(ids.length * 5, 25) + "&select=latitude,longitude,created_at,speed_ms,user_id,encrypted_payload",
        { headers: auth }
      );
      var raw = lr.ok ? await lr.json() : [];
      var seen = new Set();
      var deduped = [];
      for (var i = 0; i < (raw || []).length; i++) {
        var loc = raw[i];
        // Fallback: try encrypted_payload if lat/lng are NULL
        if ((loc.latitude == null || loc.longitude == null) && loc.encrypted_payload) {
          try {
            var pl = JSON.parse(loc.encrypted_payload);
            loc.latitude = pl.lat != null ? pl.lat : (pl.latitude != null ? pl.latitude : null);
            loc.longitude = pl.lng != null ? pl.lng : (pl.longitude != null ? pl.longitude : null);
            if (loc.speed_ms == null && pl.speed != null) loc.speed_ms = pl.speed;
          } catch (_) { /* encrypted — skip */ }
        }
        if (!seen.has(loc.user_id) && loc.latitude != null && loc.longitude != null) {
          seen.add(loc.user_id);
          deduped.push(loc);
        }
      }
      if (deduped.length > 0) {
        var pr2 = await fetch(
          base + "/rest/v1/profiles?user_id=in.(" + inClause + ")&select=user_id,display_name,avatar_url,measurement_system",
          { headers: auth }
        );
        var profiles = pr2.ok ? await pr2.json() : [];
        var profileMap = new Map((profiles || []).map(function(p) { return [p.user_id, p]; }));
        for (var j = 0; j < deduped.length; j++) {
          var dloc = deduped[j];
          var profM = profileMap.get(dloc.user_id);
          var mUnits = (profM && profM.measurement_system) ? profM.measurement_system : viewerUnits;
          var sMs = dloc.speed_ms != null ? dloc.speed_ms : null;
          var sDisplay = null;
          var sNum = null;
          if (sMs != null && sMs >= 0) {
            var isImpM = mUnits === "imperial";
            sNum = isImpM ? (sMs * 2.23694) : (sMs * 3.6);
            var tplM = isImpM ? t.speedMph : t.speedKmh;
            sDisplay = tplM.replace("{s}", Math.round(sNum));
          }
          locs.push({
            latitude: dloc.latitude,
            longitude: dloc.longitude,
            display_name: (profM && profM.display_name) || t.crewMember,
            updated_at: dloc.created_at,
            avatar_url: profM ? profM.avatar_url : null,
            speed: sNum,
            speed_ms: sMs,
            speed_display: sDisplay,
            units: mUnits,
          });
        }
      }
    }
  }
  return locs;
}

function htmlRes(status, title, heading, body, t, lang) {
  var dir = lang === "ar" ? ' dir="rtl"' : ' dir="ltr"';
  var html = "<!DOCTYPE html><html lang=" + lang + dir + "><head><meta charset=UTF-8><meta name=viewport content='width=device-width,initial-scale=1,user-scalable=no'><meta name=robots content='noindex,nofollow'><title>" + esc(title) + "</title><style>body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:0;background:#1a1a2e;color:#eee;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:20px;box-sizing:border-box}h1{font-size:1.5rem;margin-bottom:.5rem}p{color:#aaa}</style></head><body><h1>" + heading + "</h1><p>" + body + "</p><div style=margin-top:24px><a href=https://crewradr.app style='display:inline-block;padding:12px 24px;background:#4f8cff;color:#fff;text-decoration:none;border-radius:8px;font-weight:600'>" + esc(t.getTheApp) + "</a></div></body></html>";
  return new Response(html, {
    status: status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function renderPage(locations, mode, mapsKey, t, lang, viewerUnits) {
  var locJson = JSON.stringify(locations).replace(/</g, '\\u003c');
  var tJson = JSON.stringify(t).replace(/</g, '\\u003c');
  var centerLat, centerLng, zoom;
  if (locations.length > 0) {
    centerLat = locations[0].latitude;
    centerLng = locations[0].longitude;
    zoom = 15;
  } else {
    centerLat = 40.7128;
    centerLng = -74.0060;
    zoom = 4;
  }
  var noLocationsMessage = "";
  if (locations.length === 0) {
    noLocationsMessage = "<div id=noloc style='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.75);color:#fff;padding:12px 20px;border-radius:8px;z-index:1000;font-size:.9rem;pointer-events:none'>" + esc(mode === "crew" ? t.noCrewLocations : t.waitingForLocation) + "</div>";
  }

  var modeLabel = (mode === "crew" ? t.viewingCrew : t.viewingLive);
  var dir = lang === "ar" ? ' dir="rtl"' : ' dir="ltr"';

  // Unfurl metadata — link previews are rendered by crawlers that never run
  // the map JS, so they have to carry the resolved locale in the markup.
  var unfurlTags = "<meta name=description content='" + esc(modeLabel) + "'>" +
    "<meta property=og:title content='" + esc(t.liveTitle) + "'>" +
    "<meta property=og:description content='" + esc(modeLabel) + "'>" +
    "<meta property=og:type content='website'>" +
    "<meta property=og:site_name content='CrewRadr'>" +
    "<meta property=og:locale content='" + (OG_LOCALES[lang] || "en_US") + "'>" +
    "<meta property=og:image content='https://crewradr.app/logo-512.png'>" +
    "<meta name=twitter:card content='summary'>";

  var head = "<!DOCTYPE html><html lang=" + lang + dir + "><head><meta charset=UTF-8><meta name=viewport content='width=device-width,initial-scale=1,user-scalable=no'><meta name=robots content='noindex,nofollow'><title>" + esc(t.liveTitle) + "</title>" + unfurlTags + "<style>body,html{height:100%;width:100%;margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif}#map{height:100%;width:100%}#cta{position:fixed;bottom:0;left:0;right:0;background:linear-gradient(180deg,transparent,rgba(26,26,46,.95) 30%);padding:12px 16px 16px;z-index:1001;display:flex;flex-direction:column;align-items:center;gap:4px;transition:transform .3s ease}#cta.collapsed{transform:translateY(100%)}#cta .badge{font-size:.75rem;color:#888}#cta .features{font-size:.7rem;color:#666;margin-bottom:4px}#cta .btn{display:inline-block;padding:10px 28px;background:#4f8cff;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:.9rem}#action-card{position:fixed;bottom:80px;left:12px;right:12px;background:rgba(26,26,46,.96);border-radius:16px;padding:16px;z-index:1000;display:none;box-shadow:0 -4px 24px rgba(0,0,0,.4);backdrop-filter:blur(10px)}#action-card.visible{display:block}#action-card .name{font-size:1.1rem;font-weight:700;color:#fff;margin-bottom:4px}#action-card .meta{font-size:.8rem;color:#aaa;margin-bottom:10px}#action-card .nav-btns{display:flex;gap:8px;margin-bottom:8px}#action-card .nav-btns a{flex:1;display:block;text-align:center;padding:8px;border-radius:8px;text-decoration:none;font-size:.8rem;font-weight:600}#action-card .nav-gmaps{background:#4285f4;color:#fff}#action-card .nav-amaps{background:#000;color:#fff;border:1px solid #333}#action-card .stale-warning{font-size:.75rem;color:#f0a030;margin-bottom:8px;display:none}#action-card .stale-warning.visible{display:block}#theme-btn{position:fixed;top:12px;right:12px;z-index:1002;display:flex;align-items:center;gap:6px;padding:8px 10px;border:none;border-radius:8px;background:rgba(26,26,46,.92);color:#fff;font-family:system-ui,-apple-system,sans-serif;font-size:.8rem;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25)}#theme-menu{position:fixed;top:48px;right:12px;z-index:1002;display:none;flex-direction:column;min-width:130px;background:rgba(26,26,46,.96);border-radius:10px;padding:6px;box-shadow:0 4px 16px rgba(0,0,0,.35)}#theme-menu.open{display:flex}#theme-menu button{border:none;background:transparent;color:#ddd;text-align:left;padding:8px 10px;border-radius:6px;font-family:system-ui,-apple-system,sans-serif;font-size:.85rem;cursor:pointer}#theme-menu button:hover{background:rgba(255,255,255,.08)}#theme-menu button.selected{color:#fff;font-weight:700}</style></head><body><div id=map></div><button id=theme-btn title='" + esc(t.mapThemeTitle) + "' aria-haspopup=true aria-expanded=false>&#127912; <span id=theme-label></span></button><div id=theme-menu role=menu></div>" + noLocationsMessage + "<div id=action-card><div class=name id=ac-name></div><div class=meta id=ac-meta></div><div class=stale-warning id=ac-stale></div><div class=nav-btns><a href=# class='nav-gmaps' target=_blank rel='noopener noreferrer' id=ac-gmaps>&#128652; " + esc(t.googleMaps) + "</a><a href=# class='nav-amaps' target=_blank rel='noopener noreferrer' id=ac-amaps>&#127822; " + esc(t.appleMaps) + "</a></div></div><div id=cta><div class=badge>&#128205; " + esc(modeLabel) + "</div><div class=features>&#128274; " + esc(t.encrypted) + " &nbsp;&#183;&nbsp; &#9200; " + esc(t.autoExpires) + "</div><a href=https://crewradr.app class=btn rel=noopener>" + esc(t.getTheApp) + "</a></div>";

  var mapsScript = "<script src='https://maps.googleapis.com/maps/api/js?key=" + mapsKey + "&callback=initMap' async defer><\/script>";

  var initScript = "<script>var _locations=" + locJson + ";var _t=" + tJson + ";var _units='" + viewerUnits + "';var _mode='" + mode + "';var map,markers=[],activeLocIdx=-1;var _darkMq=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)');var _mapTheme=(function(){try{var v=localStorage.getItem('crewradr-map-theme');return v==='light'||v==='dark'?v:'system'}catch(e){return 'system'}})(),_darkOn=_mapTheme==='dark'||(_mapTheme==='system'&&!!(_darkMq&&_darkMq.matches)),_darkStyle=[{elementType:'geometry',stylers:[{color:'#212121'}]},{elementType:'labels.icon',stylers:[{visibility:'off'}]},{elementType:'labels.text.fill',stylers:[{color:'#757575'}]},{elementType:'labels.text.stroke',stylers:[{color:'#212121'}]},{featureType:'administrative',elementType:'geometry',stylers:[{color:'#757575'}]},{featureType:'administrative.country',elementType:'labels.text.fill',stylers:[{color:'#9e9e9e'}]},{featureType:'administrative.land_parcel',stylers:[{visibility:'off'}]},{featureType:'administrative.locality',elementType:'labels.text.fill',stylers:[{color:'#bdbdbd'}]},{featureType:'poi',elementType:'labels.text.fill',stylers:[{color:'#757575'}]},{featureType:'poi.park',elementType:'geometry',stylers:[{color:'#181818'}]},{featureType:'poi.park',elementType:'labels.text.fill',stylers:[{color:'#616161'}]},{featureType:'poi.park',elementType:'labels.text.stroke',stylers:[{color:'#1b1b1b'}]},{featureType:'road',elementType:'geometry.fill',stylers:[{color:'#2c2c2c'}]},{featureType:'road',elementType:'labels.text.fill',stylers:[{color:'#8a8a8a'}]},{featureType:'road.arterial',elementType:'geometry',stylers:[{color:'#373737'}]},{featureType:'road.highway',elementType:'geometry',stylers:[{color:'#3c3c3c'}]},{featureType:'road.highway',elementType:'geometry.stroke',stylers:[{color:'#1f1f1f'}]},{featureType:'road.highway.controlled_access',elementType:'geometry',stylers:[{color:'#4e4e4e'}]},{featureType:'road.local',elementType:'labels',stylers:[{visibility:'off'}]},{featureType:'transit',elementType:'labels.text.fill',stylers:[{color:'#757575'}]},{featureType:'transit.station',elementType:'geometry',stylers:[{color:'#2e2e2e'}]},{featureType:'water',elementType:'geometry',stylers:[{color:'#000000'}]},{featureType:'water',elementType:'labels.text.fill',stylers:[{color:'#3d3d3d'}]}];function initMap(){map=new google.maps.Map(document.getElementById('map'),{center:{lat:" + centerLat + ",lng:" + centerLng + "},zoom:" + zoom + ",streetViewControl:false,mapTypeControl:true,fullscreenControl:false,styles:_darkOn?_darkStyle:null});drawMarkers(_locations);_applyMapTheme(_mapTheme)}function minAgo(ts){var s=(Date.now()-new Date(ts).getTime())/1000;if(s<60)return _t.justNow;if(s<3600)return _t.minAgo.replace('{m}',Math.floor(s/60));return _t.hoursAgo.replace('{h}',Math.floor(s/3600)).replace('{m}',Math.floor((s%3600)/60));}function formatSpeed(l){if(l.speed_display)return l.speed_display;if(l.speed_ms==null)return '';var isImp=_units==='imperial';var val=Math.round(l.speed_ms*(isImp?2.23694:3.6));var tpl=isImp?_t.speedMph:_t.speedKmh;return tpl.replace('{s}',val);}function showCard(idx){activeLocIdx=idx;var l=_locations[idx];if(!l)return;var card=document.getElementById('action-card');card.classList.add('visible');document.getElementById('ac-name').textContent=(l.profile_emoji?l.profile_emoji+' ':'')+l.display_name;var sp=formatSpeed(l);var meta=(sp?'&#128663; '+sp+' &middot; ':'')+_t.updated+' '+minAgo(l.updated_at);document.getElementById('ac-meta').innerHTML=meta;var stale=document.getElementById('ac-stale');var mins=(Date.now()-new Date(l.updated_at).getTime())/60000;if(mins>5){stale.classList.add('visible');var timeStr=mins<60?_t.minAgo.replace('{m}',Math.round(mins)):_t.hoursAgo.replace('{h}',Math.floor(mins/60)).replace('{m}',Math.round(mins%60));stale.textContent=_t.staleWarning.replace('{t}',timeStr);}else{stale.classList.remove('visible')}document.getElementById('ac-gmaps').href='https://www.google.com/maps/dir/?api=1&destination='+l.latitude+','+l.longitude;document.getElementById('ac-amaps').href='https://maps.apple.com/?daddr='+l.latitude+','+l.longitude;var cta=document.getElementById('cta');cta.classList.add('collapsed')}function hideCard(){activeLocIdx=-1;document.getElementById('action-card').classList.remove('visible');var cta=document.getElementById('cta');cta.classList.remove('collapsed')}function drawMarkers(locs){if(!map)return;markers.forEach(function(m){m.setMap(null)});markers=[];var bounds=new google.maps.LatLngBounds;locs.forEach(function(l,i){var pos={lat:l.latitude,lng:l.longitude};bounds.extend(pos);var m=new google.maps.Marker({position:pos,map:map,title:l.display_name,label:locs.length>1?String(i+1):'',animation:google.maps.Animation.DROP});m.addListener('click',function(){showCard(i)});markers.push(m)});if(locs.length>1)map.fitBounds(bounds,{top:60,bottom:200,left:30,right:30});var nel=document.getElementById('noloc');if(nel&&locs.length)nel.remove();google.maps.event.addListener(map,'click',function(){if(activeLocIdx>=0)hideCard()})}setInterval(function(){try{fetch('?json=1&units='+encodeURIComponent(_units)+'&lang='+encodeURIComponent('" + lang + "')).then(function(r){if(!r.ok)return;r.json().then(function(d){if(!d.locations||!d.locations.length)return;_locations=d.locations;drawMarkers(d.locations);if(activeLocIdx>=0)showCard(activeLocIdx);})})}catch(e){}},15000);" + "var _themeStrings={system:'" + jsStr(t.mapThemeSystem) + "',light:'" + jsStr(t.mapThemeLight) + "',dark:'" + jsStr(t.mapThemeDark) + "'};function _themeLabel(o){return _themeStrings[o]||o}function _applyMapTheme(o){_mapTheme=o;try{localStorage.setItem('crewradr-map-theme',o)}catch(e){}var d=o==='dark'||(o==='system'&&!!(_darkMq&&_darkMq.matches));if(map)map.setOptions({styles:d?_darkStyle:null});var l=document.getElementById('theme-label');if(l)l.textContent=_themeLabel(o);var m=document.getElementById('theme-menu');if(m){Array.prototype.forEach.call(m.children,function(b){b.classList.toggle('selected',b.getAttribute('data-theme')===o)})}}var _themeMenu=document.getElementById('theme-menu');if(_themeMenu){['system','light','dark'].forEach(function(o){var b=document.createElement('button');b.type='button';b.textContent=_themeLabel(o);b.setAttribute('data-theme',o);b.setAttribute('role','menuitem');b.addEventListener('click',function(){_applyMapTheme(o);_themeMenu.classList.remove('open');document.getElementById('theme-btn').setAttribute('aria-expanded','false')});_themeMenu.appendChild(b)})}var _themeBtn=document.getElementById('theme-btn');if(_themeBtn)_themeBtn.addEventListener('click',function(){var op=_themeMenu.classList.toggle('open');_themeBtn.setAttribute('aria-expanded',op?'true':'false')});document.addEventListener('click',function(e){if(!document.getElementById('theme-btn').contains(e.target)&&!document.getElementById('theme-menu').contains(e.target)){_themeMenu.classList.remove('open');document.getElementById('theme-btn').setAttribute('aria-expanded','false')}});_applyMapTheme(_mapTheme);if(_darkMq){var _sysDark=function(){if(_mapTheme==='system')_applyMapTheme('system')};if(_darkMq.addEventListener)_darkMq.addEventListener('change',_sysDark);else if(_darkMq.addListener)_darkMq.addListener(_sysDark)}" + "<\/script>";

  return head + mapsScript + initScript + "</body></html>";
}

function esc(t) {
  return String(t || "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

// esc() is for HTML contexts; labels interpolated into the inline
// single-quoted JS strings need JS-string escaping (apostrophes/backslashes).
function jsStr(t) {
  return String(t || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
