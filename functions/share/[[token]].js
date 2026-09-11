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
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const authHeaders = {
    "apikey": serviceKey,
    "Authorization": `Bearer ${serviceKey}`,
    "Accept": "application/json",
  };

  try {
    // 2a. Primary: Try get_shared_location RPC (SECURITY DEFINER — works with publishable/anon or service key)
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
      console.warn("get_shared_location RPC attempt failed, falling back to PostgREST:", rpcErr);
    }

    if (!rpcSucceeded) {
      // 2b. Fallback: Look up share via PostgREST — filter expiry at database level
      const now = new Date().toISOString();
      const shareUrl = `${supabaseUrl}/rest/v1/location_shares?token=eq.${encodeURIComponent(token)}&expires_at=gt.${encodeURIComponent(now)}&select=*`;

      const shareRes = await fetch(shareUrl, { headers: authHeaders });
      if (!shareRes.ok) {
        console.error(`location_shares query failed: ${shareRes.status}`);
        return htmlResponse(502, t.unavailableTitle, t.unavailableBody, lang);
      }

      const shares = await shareRes.json();

      if (!shares || shares.length === 0) {
        // Distinguish 404 vs 410: check if token exists at all (ignoring expiry)
        const allTimeUrl = `${supabaseUrl}/rest/v1/location_shares?token=eq.${encodeURIComponent(token)}&select=id,expires_at`;
        const allTimeRes = await fetch(allTimeUrl, { headers: authHeaders });
        const allTimeShares = allTimeRes.ok ? await allTimeRes.json() : [];

        if (allTimeShares && allTimeShares.length > 0) {
          return htmlResponse(410, t.expiredH1, renderExpiredPage(t), lang);
        }
        return htmlResponse(404, t.notFoundTitle, t.notFoundBody, lang);
      }

      const share = shares[0];
      shareMode = share.mode || "single";

      // 3. Fetch location data
      if (share.mode === "single") {
        // Latest location for the creator with non-null coordinates
        let locUrl = `${supabaseUrl}/rest/v1/location_logs?crew_id=eq.${encodeURIComponent(share.crew_id)}&user_id=eq.${encodeURIComponent(share.creator_id)}&latitude=not.is.null&longitude=not.is.null&order=created_at.desc&limit=5&select=latitude,longitude,created_at,speed_ms,encrypted_payload`;
        let locRes = await fetch(locUrl, { headers: authHeaders });
        let locs = locRes.ok ? await locRes.json() : [];

        if (!locs || locs.length === 0) {
          // Fallback: check location_logs by user_id alone
          const fallbackUrl = `${supabaseUrl}/rest/v1/location_logs?user_id=eq.${encodeURIComponent(share.creator_id)}&latitude=not.is.null&longitude=not.is.null&order=created_at.desc&limit=5&select=latitude,longitude,created_at,speed_ms,encrypted_payload`;
          const fallbackRes = await fetch(fallbackUrl, { headers: authHeaders });
          if (fallbackRes.ok) locs = await fallbackRes.json();
        }

        // Fallback: direct coordinates stored on the share itself
        if ((!locs || locs.length === 0) && share.latitude != null && share.longitude != null) {
          locs = [{
            latitude: share.latitude,
            longitude: share.longitude,
            created_at: share.updated_at || share.created_at,
            speed_ms: share.speed_ms,
          }];
        }

        // If still no locs, try without null filter in case pre-backfill rows need encrypted_payload parsing
        if (!locs || locs.length === 0) {
          const anyUrl = `${supabaseUrl}/rest/v1/location_logs?user_id=eq.${encodeURIComponent(share.creator_id)}&order=created_at.desc&limit=3&select=latitude,longitude,created_at,speed_ms,encrypted_payload`;
          const anyRes = await fetch(anyUrl, { headers: authHeaders });
          if (anyRes.ok) locs = await anyRes.json();
        }

        if (locs && locs.length > 0) {
          // Fallback: if lat/lng are NULL (pre-backfill rows), try encrypted_payload
          let loc = locs[0];
          if ((loc.latitude == null || loc.longitude == null) && loc.encrypted_payload) {
            try {
              const payload = JSON.parse(loc.encrypted_payload);
              loc.latitude = payload.lat ?? payload.latitude ?? null;
              loc.longitude = payload.lng ?? payload.longitude ?? null;
              if (loc.speed_ms == null && payload.speed != null) loc.speed_ms = payload.speed;
            } catch (_) { /* encrypted ciphertext — skip */ }
          }
          if (loc.latitude != null && loc.longitude != null) {
            const profileUrl = `${supabaseUrl}/rest/v1/profiles?user_id=eq.${encodeURIComponent(share.creator_id)}&select=display_name,profile_emoji,measurement_system`;
            const profileRes = await fetch(profileUrl, { headers: authHeaders });
            const profiles = profileRes.ok ? await profileRes.json() : [];
            const prof = (profiles && profiles.length > 0) ? profiles[0] : null;
            // Profile photo lives on crew_members, not profiles.
            const memberAvUrl = `${supabaseUrl}/rest/v1/crew_members?crew_id=eq.${encodeURIComponent(share.crew_id)}&user_id=eq.${encodeURIComponent(share.creator_id)}&select=avatar_url`;
            const memberAvRes = await fetch(memberAvUrl, { headers: authHeaders });
            const memberAvas = memberAvRes.ok ? await memberAvRes.json() : [];
            const avatarUrl = (memberAvas && memberAvas.length > 0) ? memberAvas[0].avatar_url : null;
            const memberUnits = (prof && prof.measurement_system) ? prof.measurement_system : viewerUnits;
            const speedMs = loc.speed_ms != null ? loc.speed_ms : null;
            let speedDisplay = null;
            if (speedMs != null && speedMs >= 0) {
              const isImp = memberUnits === "imperial";
              const sNum = isImp ? (speedMs * 2.23694) : (speedMs * 3.6);
              const tpl = isImp ? t.speedMph : t.speedKmh;
              speedDisplay = tpl.replace("{s}", Math.round(sNum));
            }

            locations.push({
              user_id: share.creator_id,
              latitude: loc.latitude,
              longitude: loc.longitude,
              display_name: (prof && prof.display_name) || t.crewMember,
              updated_at: loc.created_at,
              avatar_url: avatarUrl,
              profile_emoji: prof ? prof.profile_emoji : null,
              speed_ms: speedMs,
              speed_display: speedDisplay,
              units: memberUnits,
            });
          }
        }
      } else if (share.mode === "crew" && share.crew_id) {
        // Get crew members
        const membersUrl = `${supabaseUrl}/rest/v1/crew_members?crew_id=eq.${encodeURIComponent(share.crew_id)}&select=user_id`;
        const membersRes = await fetch(membersUrl, { headers: authHeaders });
        const members = membersRes.ok ? await membersRes.json() : [];

        if (members && members.length > 0) {
          const userIds = members.map(m => m.user_id);

          // Get latest location for each crew member (fetch enough rows to cover all users)
          const userIn = userIds.map(id => encodeURIComponent(id)).join(",");
          const locsUrl = `${supabaseUrl}/rest/v1/location_logs?crew_id=eq.${encodeURIComponent(share.crew_id)}&user_id=in.(${userIn})&latitude=not.is.null&longitude=not.is.null&order=created_at.desc&limit=${Math.max(members.length * 5, 25)}&select=latitude,longitude,created_at,speed_ms,user_id,encrypted_payload`;
          const locsRes = await fetch(locsUrl, { headers: authHeaders });
          const locs = locsRes.ok ? await locsRes.json() : [];

          // Deduplicate — keep only latest per user, skip null coordinates
          const seen = new Set();
          const latestPerUser = [];
          for (const loc of (locs || [])) {
            // Fallback: if lat/lng are NULL, try encrypted_payload
            if ((loc.latitude == null || loc.longitude == null) && loc.encrypted_payload) {
              try {
                const payload = JSON.parse(loc.encrypted_payload);
                loc.latitude = payload.lat ?? payload.latitude ?? null;
                loc.longitude = payload.lng ?? payload.longitude ?? null;
                if (loc.speed_ms == null && payload.speed != null) loc.speed_ms = payload.speed;
              } catch (_) { /* encrypted — skip */ }
            }
            if (!seen.has(loc.user_id) && loc.latitude != null && loc.longitude != null) {
              seen.add(loc.user_id);
              latestPerUser.push(loc);
            }
          }

          // Also check if creator had direct coordinates on share and isn't yet in latestPerUser
          if (!seen.has(share.creator_id) && share.latitude != null && share.longitude != null) {
            seen.add(share.creator_id);
            latestPerUser.push({
              user_id: share.creator_id,
              latitude: share.latitude,
              longitude: share.longitude,
              created_at: share.updated_at || share.created_at,
              speed_ms: share.speed_ms,
            });
          }

          if (latestPerUser.length > 0) {
            // Fetch profiles using PostgREST in operator
            const profileIn = userIds.map(id => encodeURIComponent(id)).join(",");
            const profilesUrl = `${supabaseUrl}/rest/v1/profiles?user_id=in.(${profileIn})&select=user_id,display_name,profile_emoji,measurement_system`;
            const profilesRes = await fetch(profilesUrl, { headers: authHeaders });
            const profiles = profilesRes.ok ? await profilesRes.json() : [];

            // Profile photos live on crew_members, not profiles.
            const membersAvUrl = `${supabaseUrl}/rest/v1/crew_members?crew_id=eq.${encodeURIComponent(share.crew_id)}&select=user_id,avatar_url`;
            const membersAvRes = await fetch(membersAvUrl, { headers: authHeaders });
            const membersAvas = membersAvRes.ok ? await membersAvRes.json() : [];
            const avMap = new Map((membersAvas || []).map(m => [m.user_id, m.avatar_url]));

            const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

            locations = latestPerUser.map(loc => {
              const prof = profileMap.get(loc.user_id);
              const memberUnits = (prof && prof.measurement_system) ? prof.measurement_system : viewerUnits;
              const speedMs = loc.speed_ms != null ? loc.speed_ms : null;
              let speedDisplay = null;
              if (speedMs != null && speedMs >= 0) {
                const isImp = memberUnits === "imperial";
                const sNum = isImp ? (speedMs * 2.23694) : (speedMs * 3.6);
                const tpl = isImp ? t.speedMph : t.speedKmh;
                speedDisplay = tpl.replace("{s}", Math.round(sNum));
              }

              return {
                user_id: loc.user_id,
                latitude: loc.latitude,
                longitude: loc.longitude,
                display_name: (prof && prof.display_name) || t.crewMember,
                updated_at: loc.created_at,
                avatar_url: avMap.get(loc.user_id) || null,
                profile_emoji: prof ? prof.profile_emoji : null,
                speed_ms: speedMs,
                speed_display: speedDisplay,
                units: memberUnits,
              };
            });
          }
        }
      }
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
