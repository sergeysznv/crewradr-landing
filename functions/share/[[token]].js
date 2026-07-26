// Serves HTML map pages for /share/TOKEN links.
// Queries Supabase PostgREST directly — zero dependencies.
//
// Supabase Edge Runtime overrides Content-Type to text/plain and injects
// restrictive CSP headers on unauthenticated functions, so we handle the
// full request lifecycle here in Cloudflare Pages instead of proxying.

const TOKEN_REGEX = /^[a-z2-9]{10,16}$/i;

export async function onRequest(context) {
  const { request, env, params } = context;

  // 1. Extract token from [[token]] catch-all route
  const rawToken = params.token ? params.token[0] : null;
  if (!rawToken || !TOKEN_REGEX.test(rawToken)) {
    return htmlResponse(400, "Invalid Share Link", "<h1>Invalid link format</h1>");
  }

  const token = rawToken.toLowerCase();
  const url = new URL(request.url);
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
      return htmlResponse(502, "Temporarily Unavailable", "<h1>502 — Temporarily Unavailable</h1><p>Please try again in a moment.</p>");
    }

    const shares = await shareRes.json();

    if (!shares || shares.length === 0) {
      // Distinguish 404 vs 410: check if token exists at all (ignoring expiry)
      const allTimeUrl = `${supabaseUrl}/rest/v1/location_shares?token=eq.${encodeURIComponent(token)}&select=id,expires_at`;
      const allTimeRes = await fetch(allTimeUrl, { headers: authHeaders });
      const allTimeShares = allTimeRes.ok ? await allTimeRes.json() : [];

      if (allTimeShares && allTimeShares.length > 0) {
        return htmlResponse(410, "Link Expired", renderExpiredPage());
      }
      return htmlResponse(404, "Link Not Found", "<h1>This link doesn't exist</h1><p>It may have been revoked or never existed.</p>");
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
            display_name: (profiles && profiles.length > 0) ? profiles[0].display_name : "Crew Member",
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
            display_name: (profileMap.get(loc.user_id) && profileMap.get(loc.user_id).display_name) || "Crew Member",
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

    return htmlResponse(200, "Live Location", renderPage(token, locations, share.mode));
  } catch (err) {
    console.error("share worker error:", err);
    return htmlResponse(502, "Temporarily Unavailable", "<h1>502 — Temporarily Unavailable</h1><p>Please try again in a moment.</p>");
  }
}

// --- Response helpers ---

function htmlResponse(status, title, body) {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no"><title>${title}</title><style>body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:0;background:#1a1a2e;color:#eee;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:20px;box-sizing:border-box}h1{font-size:1.5rem;margin-bottom:0.5rem}p{color:#aaa}</style></head><body>${body}</body></html>`;
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}

// --- Page templates ---

function renderExpiredPage() {
  return `
    <h1>⏰ This link has expired</h1>
    <p>Location sharing links are temporary for your privacy.</p>
    <div style="margin-top:24px">
      <a href="https://crewradr.app" style="display:inline-block;padding:12px 24px;background:#4f8cff;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Get CrewRadr</a>
    </div>
    <p style="margin-top:16px;font-size:0.85rem;color:#888">
      Available on <a href="https://apps.apple.com/app/crewradr/id6743987530" style="color:#4f8cff">App Store</a> and
      <a href="https://play.google.com/store/apps/details?id=com.CrewRadr.app" style="color:#4f8cff">Google Play</a>
    </p>
  `;
}

function renderPage(token, locations, mode) {
  const locJson = JSON.stringify(locations).replace(/</g, '\\u003c');
  const center = locations.length > 0
    ? `[${locations[0].latitude}, ${locations[0].longitude}]`
    : "[40.7128, -74.0060]";
  const zoom = locations.length > 0 ? "15" : "4";
  const noLocationsMessage = locations.length === 0
    ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.7);color:#fff;padding:12px 20px;border-radius:8px;z-index:1000;font-size:0.9rem">${mode === 'crew' ? 'No members have shared location yet' : 'Waiting for location...'}</div>`
    : "";

  const markersJs = locations.map((loc, i) => `
    L.marker([${loc.latitude}, ${loc.longitude}])
      .bindPopup('<b>${escapeHtml(loc.display_name)}</b><br><small>Updated ${new Date(loc.updated_at).toLocaleTimeString()}</small>')
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
      <div class="badge">📍 Viewing ${mode === 'crew' ? 'crew' : 'live'} location via CrewRadr</div>
      <div class="title">${mode === 'crew' ? 'See your whole crew on the map' : 'Track your loved ones'}</div>
      <a href="https://crewradr.app" class="btn">Get the App</a>
      <div class="stores">
        <a href="https://apps.apple.com/app/crewradr/id6743987530">App Store</a> ·
        <a href="https://play.google.com/store/apps/details?id=com.CrewRadr.app">Google Play</a>
      </div>
    </div>
    <script>
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
              .bindPopup('<b>' + loc.escaped_display_name + '</b><br><small>Updated ' + new Date(loc.updated_at).toLocaleTimeString() + '</small>')
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
