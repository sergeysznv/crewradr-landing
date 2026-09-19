export async function onRequest(context) {
  const auth = context.request.headers.get("Authorization");
  const expectedSecret = context.env.API_TEST_SECRET;

  // Protect diagnostic endpoint behind secret in production
  if (!expectedSecret || auth !== `Bearer ${expectedSecret}`) {
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { env } = context;
  const supabaseUrl = env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  let testResult = "not tested";
  if (supabaseUrl && serviceKey) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/location_shares?limit=1&select=id`, {
        headers: { "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}` }
      });
      testResult = `status=${res.status} ok=${res.ok}`;
    } catch (e) {
      testResult = `error: ${e.message}`;
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    testResult,
  }), { headers: { "Content-Type": "application/json" } });
}
