const TOKEN_REGEX = /^[a-z2-9]{10,16}$/i;

// Simple in-memory rate limiter for invalid token attempts.
// Resets on worker cold start — backed by Cloudflare DDoS protection at scale.
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

  const match = url.pathname.match(/\/share\/([a-z2-9]+)$/i);
  if (!match) {
    rateLimit(clientIP);
    return htmlRes(404, "Invalid Link", INVALID_LINK);
  }

  const token = match[1].toLowerCase();
  const isJson = url.searchParams.get("json") === "1";

  if (!TOKEN_REGEX.test(token)) {
    rateLimit(clientIP);
    return htmlRes(400, "Invalid Link", INVALID_LINK);
  }

  if (rateLimit(clientIP)) {
    return new Response("Too many requests", { status: 429 });
  }

  const base = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const mapsKey = env.GOOGLE_MAPS_API_KEY || "";
  const auth = { "apikey": key, "Authorization": "Bearer " + key };

  try {
    const now = new Date().toISOString();
    const shareRes = await fetch(
      base + "/rest/v1/location_shares?token=eq." + encodeURIComponent(token) + "&expires_at=gt." + encodeURIComponent(now) + "&select=*",
      { headers: auth }
    );
    if (!shareRes.ok) return htmlRes(502, "Unavailable", "<h1>502 — Temporarily Unavailable</h1>");

    const shares = await shareRes.json();
    if (!shares || shares.length === 0) {
      const allRes = await fetch(
        base + "/rest/v1/location_shares?token=eq." + encodeURIComponent(token) + "&select=id",
        { headers: auth }
      );
      const all = allRes.ok ? await allRes.json() : [];
      rateLimit(clientIP);
      return (all && all.length > 0)
        ? htmlRes(410, "Link Expired", EXPIRED)
        : htmlRes(404, "Invalid Link", INVALID_LINK);
    }

    const share = shares[0];
    const locations = (await fetchLocations(base, auth, share)).map(function(l) {
      return {
        latitude: l.latitude,
        longitude: l.longitude,
        display_name: l.display_name,
        updated_at: l.updated_at,
        avatar_url: l.avatar_url,
        escaped_display_name: esc(l.display_name),
        speed: l.speed || null,
      };
    });

    if (isJson) {
      return new Response(JSON.stringify({
        locations: locations, mode: share.mode
      }), { headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      }});
    }

    var html = renderPage(locations, share.mode, mapsKey);
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
    return htmlRes(502, "Unavailable", "<h1>502 — Temporarily Unavailable</h1>");
  }
}

async function fetchLocations(base, auth, share) {
  var locs = [];

  if (share.mode === "single") {
    var r = await fetch(
      base + "/rest/v1/location_logs?crew_id=eq." + encodeURIComponent(share.crew_id) + "&user_id=eq." + encodeURIComponent(share.creator_id) + "&order=created_at.desc&limit=1&select=latitude,longitude,created_at,speed,encrypted_payload",
      { headers: auth }
    );
    var data = r.ok ? await r.json() : [];
    if (data && data[0]) {
      var d = data[0];
      // Fallback: try encrypted_payload if lat/lng are NULL (pre-backfill rows)
      if ((d.latitude == null || d.longitude == null) && d.encrypted_payload) {
        try {
          var p = JSON.parse(d.encrypted_payload);
          d.latitude = p.lat != null ? p.lat : (p.latitude != null ? p.latitude : null);
          d.longitude = p.lng != null ? p.lng : (p.longitude != null ? p.longitude : null);
        } catch (_) { /* encrypted — skip */ }
      }
      if (d.latitude != null && d.longitude != null) {
        var pr = await fetch(
          base + "/rest/v1/profiles?user_id=eq." + encodeURIComponent(share.creator_id) + "&select=display_name,avatar_url",
          { headers: auth }
        );
        var p = pr.ok ? await pr.json() : [];
        locs.push({
          latitude: d.latitude,
          longitude: d.longitude,
          display_name: (p && p[0] && p[0].display_name) || "Crew Member",
          updated_at: d.created_at,
          avatar_url: (p && p[0] && p[0].avatar_url) || null,
          speed: d.speed || null,
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
        base + "/rest/v1/location_logs?crew_id=eq." + encodeURIComponent(share.crew_id) + "&user_id=in.(" + inClause + ")&order=created_at.desc&limit=" + (ids.length * 5) + "&select=latitude,longitude,created_at,speed,user_id,encrypted_payload",
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
          } catch (_) { /* encrypted — skip */ }
        }
        if (!seen.has(loc.user_id) && loc.latitude != null && loc.longitude != null) {
          seen.add(loc.user_id);
          deduped.push(loc);
        }
      }
      if (deduped.length > 0) {
        var pr2 = await fetch(
          base + "/rest/v1/profiles?user_id=in.(" + inClause + ")&select=user_id,display_name,avatar_url",
          { headers: auth }
        );
        var profiles = pr2.ok ? await pr2.json() : [];
        var profileMap = new Map((profiles || []).map(function(p) { return [p.user_id, p]; }));
        for (var j = 0; j < deduped.length; j++) {
          var dloc = deduped[j];
          var prof = profileMap.get(dloc.user_id);
          locs.push({
            latitude: dloc.latitude,
            longitude: dloc.longitude,
            display_name: (prof && prof.display_name) || "Crew Member",
            updated_at: dloc.created_at,
            avatar_url: prof ? prof.avatar_url : null,
            speed: dloc.speed || null,
          });
        }
      }
    }
  }
  return locs;
}

function htmlRes(status, title, body) {
  var html = "<!DOCTYPE html><html lang=en><head><meta charset=UTF-8><meta name=viewport content='width=device-width,initial-scale=1,user-scalable=no'><meta name=robots content='noindex,nofollow'><title>" + title + "</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:0;background:#1a1a2e;color:#eee;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:20px;box-sizing:border-box}h1{font-size:1.5rem;margin-bottom:.5rem}p{color:#aaa}</style></head><body>" + body + "</body></html>";
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

var EXPIRED = "<h1>⏰ This link has expired</h1><p>Location sharing links are temporary for your privacy.</p><div style=margin-top:24px><a href=https://crewradr.app style='display:inline-block;padding:12px 24px;background:#4f8cff;color:#fff;text-decoration:none;border-radius:8px;font-weight:600'>Get CrewRadr</a></div>";

var INVALID_LINK = "<h1>🔗 Invalid Link</h1><p>This share link doesn't exist or has been revoked.</p><div style=margin-top:24px><a href=https://crewradr.app style='display:inline-block;padding:12px 24px;background:#4f8cff;color:#fff;text-decoration:none;border-radius:8px;font-weight:600'>Get CrewRadr</a></div>";

function renderPage(locations, mode, mapsKey) {
  var locJson = JSON.stringify(locations).replace(/</g, '\\u003c');
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
    noLocationsMessage = "<div id=noloc style='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.7);color:#fff;padding:12px 20px;border-radius:8px;z-index:1000;font-size:.9rem;pointer-events:none'>" + (mode === "crew" ? "No members have shared location yet" : "Waiting for location...") + "</div>";
  }

  var modeLabel = (mode === "crew" ? "crew" : "live");

  var head = "<!DOCTYPE html><html lang=en><head><meta charset=UTF-8><meta name=viewport content='width=device-width,initial-scale=1,user-scalable=no'><meta name=robots content='noindex,nofollow'><title>Live Location — CrewRadr</title><style>body,html{height:100%;width:100%;margin:0;padding:0;font-family:system-ui,sans-serif}#map{height:100%;width:100%}#cta{position:fixed;bottom:0;left:0;right:0;background:linear-gradient(180deg,transparent,rgba(26,26,46,.95) 30%);padding:12px 16px 16px;z-index:1001;display:flex;flex-direction:column;align-items:center;gap:4px;transition:transform .3s ease}#cta.collapsed{transform:translateY(100%)}#cta .badge{font-size:.75rem;color:#888}#cta .features{font-size:.7rem;color:#666;margin-bottom:4px}#cta .btn{display:inline-block;padding:10px 28px;background:#4f8cff;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:.9rem}#action-card{position:fixed;bottom:80px;left:12px;right:12px;background:rgba(26,26,46,.96);border-radius:16px;padding:16px;z-index:1000;display:none;box-shadow:0 -4px 24px rgba(0,0,0,.4);backdrop-filter:blur(10px)}#action-card.visible{display:block}#action-card .name{font-size:1.1rem;font-weight:700;color:#fff;margin-bottom:4px}#action-card .meta{font-size:.8rem;color:#aaa;margin-bottom:10px}#action-card .nav-btns{display:flex;gap:8px;margin-bottom:8px}#action-card .nav-btns a{flex:1;display:block;text-align:center;padding:8px;border-radius:8px;text-decoration:none;font-size:.8rem;font-weight:600}#action-card .nav-gmaps{background:#4285f4;color:#fff}#action-card .nav-amaps{background:#000;color:#fff;border:1px solid #333}#action-card .stale-warning{font-size:.75rem;color:#f0a030;margin-bottom:8px;display:none}#action-card .stale-warning.visible{display:block}</style></head><body><div id=map></div>" + noLocationsMessage + "<div id=action-card><div class=name id=ac-name></div><div class=meta id=ac-meta></div><div class=stale-warning id=ac-stale>&#9888;&#65039; Location may have changed. Last updated <span id=ac-stale-time></span> ago.</div><div class=nav-btns><a href=# class='nav-gmaps' target=_blank rel='noopener noreferrer' id=ac-gmaps>&#128652; Google Maps</a><a href=# class='nav-amaps' target=_blank rel='noopener noreferrer' id=ac-amaps>&#127822; Apple Maps</a></div></div><div id=cta><div class=badge>&#128205; Viewing " + modeLabel + " location via CrewRadr</div><div class=features>&#128274; Encrypted &nbsp;&#183;&nbsp; &#9200; Auto-expires</div><a href=https://crewradr.app class=btn rel=noopener>Get CrewRadr Free</a></div>";

  var mapsScript = "<script src='https://maps.googleapis.com/maps/api/js?key=" + mapsKey + "&callback=initMap' async defer><\/script>";

  var initScript = "<script>var _locations=" + locJson + ";var _mode='" + mode + "';var map,markers=[],activeLocIdx=-1;function initMap(){map=new google.maps.Map(document.getElementById('map'),{center:{lat:" + centerLat + ",lng:" + centerLng + "},zoom:" + zoom + ",streetViewControl:false,mapTypeControl:true,fullscreenControl:false});drawMarkers(_locations)}function minAgo(ts){var s=(Date.now()-new Date(ts).getTime())/1000;if(s<60)return 'Just now';if(s<3600)return Math.floor(s/60)+'m';return Math.floor(s/3600)+'h '+Math.floor((s%3600)/60)+'m';}function showCard(idx){activeLocIdx=idx;var l=_locations[idx];if(!l)return;var card=document.getElementById('action-card');card.classList.add('visible');document.getElementById('ac-name').textContent=l.display_name;var meta=(l.speed!=null?'&#128663; '+Math.round(l.speed)+' mph':'')+' &middot; Updated '+minAgo(l.updated_at);document.getElementById('ac-meta').innerHTML=meta;var stale=document.getElementById('ac-stale');var mins=(Date.now()-new Date(l.updated_at).getTime())/60000;if(mins>5){stale.classList.add('visible');document.getElementById('ac-stale-time').textContent=Math.round(mins)+' min';}else{stale.classList.remove('visible')}document.getElementById('ac-gmaps').href='https://www.google.com/maps/dir/?api=1&destination='+l.latitude+','+l.longitude;document.getElementById('ac-amaps').href='https://maps.apple.com/?daddr='+l.latitude+','+l.longitude;var cta=document.getElementById('cta');cta.classList.add('collapsed')}function hideCard(){activeLocIdx=-1;document.getElementById('action-card').classList.remove('visible');var cta=document.getElementById('cta');cta.classList.remove('collapsed')}function drawMarkers(locs){if(!map)return;markers.forEach(function(m){m.setMap(null)});markers=[];var bounds=new google.maps.LatLngBounds;locs.forEach(function(l,i){var pos={lat:l.latitude,lng:l.longitude};bounds.extend(pos);var m=new google.maps.Marker({position:pos,map:map,title:l.display_name,label:locs.length>1?String(i+1):'',animation:google.maps.Animation.DROP});m.addListener('click',function(){showCard(i)});markers.push(m)});if(locs.length>1)map.fitBounds(bounds,{top:60,bottom:200,left:30,right:30});var nel=document.getElementById('noloc');if(nel&&locs.length)nel.remove();google.maps.event.addListener(map,'click',function(){if(activeLocIdx>=0)hideCard()})}setInterval(function(){try{fetch('?json=1').then(function(r){if(!r.ok)return;r.json().then(function(d){if(!d.locations||!d.locations.length)return;drawMarkers(d.locations)})})}catch(e){}},15000);<\/script>";

  return head + mapsScript + initScript + "</body></html>";
}

function esc(t) {
  return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
