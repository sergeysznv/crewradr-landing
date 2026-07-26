export async function onRequest(context) {
  const { env } = context;
  const supabaseUrl = env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  // Test Supabase connection
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
    hasUrl: !!supabaseUrl,
    urlPrefix: (supabaseUrl || '').substring(0, 30),
    hasKey: !!serviceKey,
    keyLength: (serviceKey || '').length,
    testResult,
  }), { headers: { "Content-Type": "application/json" } });
}
