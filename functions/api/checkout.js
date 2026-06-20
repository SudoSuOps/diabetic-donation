// Cloudflare Pages Function — POST /api/checkout
// Creates a Stripe Checkout Session (hosted) for a cash donation and returns its URL.
// One-time (mode=payment) or monthly (mode=subscription), custom or preset amount.
//
// Best practice (Stripe 2026): hosted Checkout, NEVER pass payment_method_types
// (dynamic payment methods maximize conversion). Secret stays server-side.
// Requires env var STRIPE_SECRET_KEY (use a restricted key with Checkout write access).

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

// form-encode nested params the way Stripe's API expects
function encode(obj, prefix, out = []) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) encode(v, key, out);
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
  }
  return out;
}

export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_SECRET_KEY) return json({ error: "Donations aren't switched on yet — email build@opendiabetic.com." }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: "bad request" }, 400); }

  const dollars = Math.max(1, Math.min(100000, Math.round(Number(body.amount) || 0)));
  if (!dollars) return json({ error: "Please choose an amount." }, 400);
  const monthly = body.frequency === "monthly";
  const origin = new URL(request.url).origin;

  const params = {
    mode: monthly ? "subscription" : "payment",
    success_url: `${origin}/?thanks=1`,
    cancel_url: `${origin}/?canceled=1`,
    submit_type: monthly ? "auto" : "donate",
    "line_items[0][quantity]": 1,
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": dollars * 100,
    "line_items[0][price_data][product_data][name]": monthly ? "Monthly gift to OpenDiabetic" : "Gift to OpenDiabetic",
    "metadata[source]": "diabeticdonation.com",
    "metadata[kind]": monthly ? "cash-monthly" : "cash-onetime",
  };
  if (monthly) params["line_items[0][price_data][recurring][interval]"] = "month";

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2026-04-22.dahlia",
    },
    body: encode(params).join("&"),
  });
  const data = await res.json();
  if (!res.ok) return json({ error: data?.error?.message || "Stripe error — please try again." }, 502);
  return json({ url: data.url });
}
