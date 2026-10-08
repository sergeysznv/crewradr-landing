// Cloudflare Pages Function: /api/contact
// Handles contact inquiries and fleet consultation form submissions.
// Saves record to Supabase (contact_inquiries or user_feedback) and optionally
// sends an email alert via Resend (if RESEND_API_KEY is configured).

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    let body;
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await request.json();
    } else if (contentType.includes("form")) {
      const formData = await request.formData();
      body = Object.fromEntries(formData);
    } else {
      body = await request.json().catch(() => ({}));
    }

    const str = (v) => (typeof v === "string" ? v.trim() : "");
    const name = str(body.name);
    const email = str(body.email);
    const phone = str(body.phone);
    const smsConsent = body.smsConsent === true || body.smsConsent === "true" || body.smsConsent === "on" ||
      body.sms_consent === true || body.sms_consent === "true" || body.sms_consent === "on";
    const message = str(body.message);
    const source = str(body.source) || "landing_page";

    const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
    const reject = (error) =>
      new Response(JSON.stringify({ ok: false, error }), { status: 400, headers: jsonHeaders });

    // Honeypot: real visitors never fill this hidden field; pretend success to bots.
    if (str(body.website)) {
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: jsonHeaders });
    }

    if (!name || !email) return reject("Name and email are required.");
    if (name.length > 120) return reject("Name is too long.");
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reject("Please enter a valid email address.");
    if (phone.length > 40) return reject("Phone number is too long.");
    if (message.length > 4000) return reject("Message is too long (4000 characters max).");
    if (source.length > 50) return reject("Invalid source.");

    const timestamp = new Date().toISOString();
    const clientIp = request.headers.get("cf-connecting-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    let savedToDb = false;
    let emailSent = false;

    // 1. Supabase insert (Audit log & persistence)
    const supabaseUrl = env.SUPABASE_URL;
    // Anon key only: the table's INSERT-only policy is all this endpoint needs. Never bind the
    // service-role key to a public function.
    const supabaseKey = env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        // Try contact_inquiries table
        const dbRes = await fetch(`${supabaseUrl}/rest/v1/contact_inquiries`, {
          method: "POST",
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({
            name,
            email,
            phone: phone || null,
            sms_consent: smsConsent,
            message: message || null,
            source,
            created_at: timestamp,
            metadata: { ip: clientIp, user_agent: userAgent },
          }),
        });

        if (dbRes.ok) {
          savedToDb = true;
        } else {
          // Fallback to user_feedback table if contact_inquiries isn't migrated yet
          const fbRes = await fetch(`${supabaseUrl}/rest/v1/user_feedback`, {
            method: "POST",
            headers: {
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
              "Prefer": "return=minimal",
            },
            body: JSON.stringify({
              kind: "contact_inquiry",
              email,
              message: `[From: ${name}] [Phone: ${phone || "N/A"}] [SMS Consent: ${smsConsent ? "YES" : "NO"}] [Source: ${source}]\n\n${message || "No message provided"}`.slice(0, 500),
              is_anonymous: false,
            }),
          });
          if (fbRes.ok) savedToDb = true;
        }
      } catch (dbErr) {
        console.error("Supabase write error:", dbErr);
      }
    }

    // 2. Email dispatch via Resend API (if RESEND_API_KEY is configured)
    const resendApiKey = env.RESEND_API_KEY;
    const recipientEmail = env.CONTACT_NOTIFICATION_EMAIL || "support@crewradr.app";
    const fromAddress = env.RESEND_FROM_EMAIL || "CrewRadr Inquiries <notifications@crewradr.app>";

    const emailStatus = {
      attempted: false,
      hasKey: Boolean(resendApiKey),
      recipient: recipientEmail,
      error: null,
    };

    if (resendApiKey) {
      emailStatus.attempted = true;
      try {
        const emailPayload = {
          from: fromAddress,
          to: [recipientEmail],
          reply_to: email,
          subject: `New Inquiry from ${name} (${email})`,
          html: `
            <h2>New Contact / Consultation Inquiry</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
            <p><strong>Phone:</strong> ${escapeHtml(phone || "Not provided")}</p>
            <p><strong>SMS Opt-In Consent:</strong> ${smsConsent ? "✓ Consented (Voluntary)" : "No"}</p>
            <p><strong>Source Page:</strong> ${escapeHtml(source)}</p>
            <p><strong>Message:</strong></p>
            <blockquote style="background:#f4f4f4;padding:12px;border-left:4px solid #6E8679;white-space:pre-wrap;">${escapeHtml(message || "(No message provided)")}</blockquote>
            <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;">
            <p style="font-size:11px;color:#888;">Submitted at ${timestamp} &middot; IP: ${clientIp}</p>
          `,
        };

        let emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailPayload),
        });

        if (emailRes.ok) {
          emailSent = true;
        } else {
          const errData = await emailRes.json().catch(() => ({}));
          emailStatus.error = errData;

          // If custom domain is not yet verified in Resend, retry with onboarding@resend.dev
          if (fromAddress.includes("crewradr.app")) {
            const fallbackRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...emailPayload,
                from: "CrewRadr <onboarding@resend.dev>",
              }),
            });

            if (fallbackRes.ok) {
              emailSent = true;
              emailStatus.fallbackUsed = true;
              emailStatus.error = null;
            } else {
              const fbErrData = await fallbackRes.json().catch(() => ({}));
              emailStatus.fallbackError = fbErrData;
            }
          }
        }
      } catch (emailErr) {
        emailStatus.error = String(emailErr?.message || emailErr);
      }
    } else {
      emailStatus.error = "RESEND_API_KEY not detected in runtime environment.";
    }

    if (!savedToDb || !emailSent) {
      console.error("contact: delivery incomplete", { savedToDb, emailSent, emailStatus });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Thank you! Your message has been received. Our team will reach out as soon as possible.",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: "Failed to process request." }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
