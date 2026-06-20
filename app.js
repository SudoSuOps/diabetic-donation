const $ = s => document.querySelector(s);

// thank-you / canceled banners from Stripe redirect
const q = new URLSearchParams(location.search);
if (q.get("thanks")) { $("#thanksBanner").classList.remove("hide"); history.replaceState({}, "", "/"); }

// ---- cash lane: frequency + amount selection ----
let freq = "once", amount = 50;
function syncLabel() {
  $("#cashLabel").textContent = "$" + amount + (freq === "monthly" ? "/mo" : "");
}
document.querySelectorAll(".fbtn").forEach(b => b.onclick = () => {
  freq = b.dataset.freq;
  document.querySelectorAll(".fbtn").forEach(x => x.classList.toggle("on", x === b));
  syncLabel();
});
document.querySelectorAll(".abtn").forEach(b => b.onclick = () => {
  amount = Number(b.dataset.amt);
  document.querySelectorAll(".abtn").forEach(x => x.classList.toggle("on", x === b));
  $("#customAmt").value = "";
  syncLabel();
});
$("#customAmt").addEventListener("input", e => {
  const v = Math.max(0, Math.round(Number(e.target.value) || 0));
  if (v > 0) { amount = v; document.querySelectorAll(".abtn").forEach(x => x.classList.remove("on")); syncLabel(); }
});

$("#giveCash").onclick = async () => {
  const r = $("#cashResult"), btn = $("#giveCash");
  if (!amount || amount < 1) { r.className = "result bad"; r.textContent = "Please choose an amount."; return; }
  r.className = "result"; r.textContent = "Opening secure checkout…"; btn.disabled = true;
  try {
    const res = await fetch("/api/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, frequency: freq }),
    });
    const out = await res.json();
    if (res.ok && out.url) location.href = out.url;
    else { r.className = "result bad"; r.textContent = out.error || "Couldn't start checkout."; btn.disabled = false; }
  } catch { r.className = "result bad"; r.textContent = "Couldn't reach checkout — try again."; btn.disabled = false; }
};

// ---- pledge lanes (compute / device) -> email ----
document.querySelectorAll(".pledge").forEach(form => {
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const r = form.querySelector(".result"), btn = form.querySelector("button");
    r.className = "result"; r.textContent = "Sending…"; btn.disabled = true;
    const body = {
      kind: form.dataset.kind,
      item: form.item.value, name: form.name.value, email: form.email.value,
      location: form.location.value, note: form.note.value, company: form.company.value,
    };
    try {
      const res = await fetch("/api/pledge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const out = await res.json();
      if (res.ok && out.ok) { r.className = "result ok"; r.textContent = "Thank you 🐝 we'll reach out to arrange it — we cover shipping."; form.reset(); }
      else { r.className = "result bad"; r.textContent = out.error || "Couldn't send — email build@opendiabetic.com."; }
    } catch { r.className = "result bad"; r.textContent = "Couldn't reach us — email build@opendiabetic.com."; }
    btn.disabled = false;
  });
});

syncLabel();
