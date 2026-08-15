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
    trackLovedOnes: "Track your loved ones",
    getTheApp: "Get the App",
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
    trackLovedOnes: "Sigue a tus seres queridos",
    getTheApp: "Descarga la app",
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
    trackLovedOnes: "Suivez vos proches",
    getTheApp: "Télécharger l'app",
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
    trackLovedOnes: "تتبع أحباءك",
    getTheApp: "حمّل التطبيق",
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
    trackLovedOnes: "追踪您的家人",
    getTheApp: "下载应用",
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
    trackLovedOnes: "Следите за близкими",
    getTheApp: "Скачать приложение",
  },
};

const SUPPORTED = ["en", "es", "fr", "ar", "zh", "ru"];

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

export async function onRequest(context) {
  const { request, env, params } = context;

  // 1. Extract token from [[token]] catch-all route
  const rawToken = params.token ? params.token[0] : null;
  const url = new URL(request.url);
  const lang = resolveLang(url, request.headers.get("accept-language"));
  const t = STRINGS[lang];

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
    // 2. Look up share — filter expiry at database level
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

    // 3. Fetch location data
    let locations = [];

    if (share.mode === "single") {
      // Latest location for the creator
      const locUrl = `${supabaseUrl}/rest/v1/location_logs?crew_id=eq.${encodeURIComponent(share.crew_id)}&user_id=eq.${encodeURIComponent(share.creator_id)}&order=created_at.desc&limit=1&select=latitude,longitude,created_at,encrypted_payload`;
      const locRes = await fetch(locUrl, { headers: authHeaders });
      if (!locRes.ok) {
        const errText = await locRes.text();
        return new Response(JSON.stringify({ error: `Supabase query failed: ${locRes.status}`, detail: errText.substring(0, 200), url: locUrl }), {
          status: 500, headers: { "Content-Type": "application/json" },
        });
      }
      const locs = await locRes.json();

      if (locs && locs.length > 0) {
        // Fallback: if lat/lng are NULL (pre-backfill rows), try encrypted_payload
        let loc = locs[0];
        if ((loc.latitude == null || loc.longitude == null) && loc.encrypted_payload) {
          try {
            const payload = JSON.parse(loc.encrypted_payload);
            loc.latitude = payload.lat ?? payload.latitude ?? null;
            loc.longitude = payload.lng ?? payload.longitude ?? null;
          } catch (_) { /* encrypted ciphertext — skip */ }
        }
        if (loc.latitude != null && loc.longitude != null) {
          const profileUrl = `${supabaseUrl}/rest/v1/profiles?user_id=eq.${encodeURIComponent(share.creator_id)}&select=display_name,avatar_url`;
          const profileRes = await fetch(profileUrl, { headers: authHeaders });
          const profiles = profileRes.ok ? await profileRes.json() : [];

          locations.push({
            latitude: loc.latitude,
            longitude: loc.longitude,
            display_name: (profiles && profiles.length > 0) ? profiles[0].display_name : t.crewMember,
            updated_at: loc.created_at,
            avatar_url: (profiles && profiles.length > 0) ? profiles[0].avatar_url : null,
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
        const locsUrl = `${supabaseUrl}/rest/v1/location_logs?crew_id=eq.${encodeURIComponent(share.crew_id)}&user_id=in.(${userIn})&order=created_at.desc&limit=${members.length * 5}&select=latitude,longitude,created_at,user_id,encrypted_payload`;
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
            } catch (_) { /* encrypted — skip */ }
          }
          if (!seen.has(loc.user_id) && loc.latitude != null && loc.longitude != null) {
            seen.add(loc.user_id);
            latestPerUser.push(loc);
          }
        }

        if (latestPerUser.length > 0) {
          // Fetch profiles using PostgREST in operator
          const profileIn = userIds.map(id => encodeURIComponent(id)).join(",");
          const profilesUrl = `${supabaseUrl}/rest/v1/profiles?user_id=in.(${profileIn})&select=user_id,display_name,avatar_url`;
          const profilesRes = await fetch(profilesUrl, { headers: authHeaders });
          const profiles = profilesRes.ok ? await profilesRes.json() : [];

          const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

          locations = latestPerUser.map(loc => ({
            latitude: loc.latitude,
            longitude: loc.longitude,
            display_name: (profileMap.get(loc.user_id) && profileMap.get(loc.user_id).display_name) || t.crewMember,
            updated_at: loc.created_at,
            avatar_url: profileMap.get(loc.user_id) ? profileMap.get(loc.user_id).avatar_url : null,
          }));
        }
      }
    }

    // JSON mode for client-side polling
    if (isJson) {
      const escapedLocations = locations.map(loc => ({
        ...loc,
        escaped_display_name: escapeHtml(loc.display_name),
      }));
      return new Response(JSON.stringify({ locations: escapedLocations, mode: share.mode, debug: { supabaseUrl, hasServiceKey: !!serviceKey, token } }), {
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      });
    }

    return htmlResponse(200, t.liveTitle, renderPage(token, locations, share.mode, t, lang), lang);
  } catch (err) {
    console.error("share worker error:", err);
    return htmlResponse(502, t.unavailableTitle, t.unavailableBody, lang);
  }
}

// --- Response helpers ---

function htmlResponse(status, title, body, lang) {
  const dir = lang === "ar" ? ' dir="rtl"' : "";
  const html = `<!DOCTYPE html><html lang="${lang}"${dir}><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no"><title>${title}</title><style>body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:0;background:#1a1a2e;color:#eee;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:20px;box-sizing:border-box}h1{font-size:1.5rem;margin-bottom:0.5rem}p{color:#aaa}</style></head><body>${body}</body></html>`;
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
    <p style="margin-top:16px;font-size:0.85rem;color:#888">
      ${t.availableOn} <a href="https://apps.apple.com/app/crewradr/id6743987530" style="color:#4f8cff">App Store</a> ·
      <a href="https://play.google.com/store/apps/details?id=com.CrewRadr.app" style="color:#4f8cff">Google Play</a>
    </p>
  `;
}

function renderPage(token, locations, mode, t, lang) {
  const locJson = JSON.stringify(locations).replace(/</g, '\\u003c');
  const center = locations.length > 0
    ? `[${locations[0].latitude}, ${locations[0].longitude}]`
    : "[40.7128, -74.0060]";
  const zoom = locations.length > 0 ? "15" : "4";
  const noLocationsMessage = locations.length === 0
    ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.7);color:#fff;padding:12px 20px;border-radius:8px;z-index:1000;font-size:0.9rem">${mode === 'crew' ? t.noCrewLocations : t.waitingForLocation}</div>`
    : "";

  const updatedLabel = t.updated;
  const markersJs = locations.map((loc, i) => `
    L.marker([${loc.latitude}, ${loc.longitude}])
      .bindPopup('<b>${escapeHtml(loc.display_name)}</b><br><small>${updatedLabel} ${new Date(loc.updated_at).toLocaleTimeString(lang)}</small>')
      .addTo(map);
  `).join("\n");

  return `
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
      #cta .stores { font-size: 0.8rem; color: #888; margin-top: 4px; }
      #cta .stores a { color: #4f8cff; text-decoration: none; }
      .leaflet-popup-content { font-family: system-ui, -apple-system, sans-serif; font-size: 0.9rem; }
    </style>
    <div id="map"></div>
    ${noLocationsMessage}
    <div id="cta">
      <div class="badge">📍 ${mode === 'crew' ? t.viewingCrew : t.viewingLive}</div>
      <div class="title">${mode === 'crew' ? t.seeCrew : t.trackLovedOnes}</div>
      <a href="https://crewradr.app" class="btn">${t.getTheApp}</a>
      <div class="stores">
        <a href="https://apps.apple.com/app/crewradr/id6743987530">App Store</a> ·
        <a href="https://play.google.com/store/apps/details?id=com.CrewRadr.app">Google Play</a>
      </div>
    </div>
    <script>
      const UPDATED_LABEL = ${JSON.stringify(updatedLabel)};
      const LANG = ${JSON.stringify(lang)};
      const locations = ${locJson};
      const map = L.map('map').setView(${center}, ${zoom});
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      ${markersJs}

      if (locations.length > 1) {
        const bounds = L.latLngBounds(locations.map(l => [l.latitude, l.longitude]));
        map.fitBounds(bounds.pad(0.1));
      }

      // Auto-refresh every 15 seconds
      setInterval(async () => {
        try {
          const resp = await fetch('?json=1');
          if (!resp.ok) return;
          const data = await resp.json();
          if (!data.locations || data.locations.length === 0) return;
          map.eachLayer(layer => {
            if (layer instanceof L.Marker) map.removeLayer(layer);
          });
          data.locations.forEach(loc => {
            L.marker([loc.latitude, loc.longitude])
              .bindPopup('<b>' + loc.escaped_display_name + '</b><br><small>' + UPDATED_LABEL + ' ' + new Date(loc.updated_at).toLocaleTimeString(LANG) + '</small>')
              .addTo(map);
          });
        } catch(e) { /* silent — polling is best-effort */ }
      }, 15000);
    <\/script>
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
