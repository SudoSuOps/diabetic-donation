// Cloudflare Pages Function — POST /api/pledge
// In-kind donations (compute / edge appliances): emails the pledge to build@opendiabetic.com
// via Resend so we can coordinate pickup/shipping (we pay all shipping). Requires RESEND_API_KEY.

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
const clean = (v, n) => String(v ?? "").trim().slice(0, n);
const looksEmail = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

export async function onRequestPost({ request, env }) {
  let d;
  try { d = await request.json(); } catch { return json({ error: "bad request" }, 400); }

  const name = clean(d.name, 120);
  const email = clean(d.email, 160);
  const kind = clean(d.kind, 40) || "in-kind";
  const item = clean(d.item, 200);
  const location = clean(d.location, 160);
  const note = clean(d.note, 2000);
  if (d.company) return json({ ok: true });                 // honeypot
  if (!looksEmail(email) || !item) return json({ error: "Add a valid email and what you'd like to give." }, 400);
  if (!env.RESEND_API_KEY) return json({ error: "We can't take pledges just yet — email build@opendiabetic.com." }, 500);

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "User-Agent": "DiabeticDonation/1.0" },
    body: JSON.stringify({
      from: "DiabeticDonation <give@opendiabetic.com>",
      to: ["build@opendiabetic.com"],
      reply_to: email,
      subject: `[Donation pledge · ${kind}] ${item} — ${name || email}`,
      text: `New ${kind} pledge from diabeticdonation.com\n\nName: ${name}\nEmail: ${email}\nGiving: ${item}\nLocation: ${location}\n\nNotes:\n${note}\n\n(We pay all shipping — coordinate pickup/label with the donor.)`,
    }),
  });
  if (!r.ok) return json({ error: "Couldn't send — please email build@opendiabetic.com and we'll set it up.", detail: (await r.text()).slice(0, 200) }, 502);
  return json({ ok: true });
}
