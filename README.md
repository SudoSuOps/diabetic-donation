# Diabetic Donation

*Give what they need, not what you have.* The donation front door for **diabeticdonation.com**.

Static site (Cloudflare Pages) + two Pages Functions. Three ways to give:
- **Cash** — Stripe Checkout (hosted), one-time or monthly, preset + custom amounts. `functions/api/checkout.js`.
- **Compute** & **Edge appliances** — in-kind pledges emailed via Resend to coordinate; we pay all shipping. `functions/api/pledge.js`.

## Env vars (set in the Cloudflare Pages project)
- `STRIPE_SECRET_KEY` — Stripe key (recommended: a **restricted key** with write access to Checkout Sessions).
- `RESEND_API_KEY` — for compute/device pledge emails to build@opendiabetic.com.

Best practice (Stripe 2026): hosted Checkout Sessions, dynamic payment methods (no `payment_method_types`),
secret stays server-side in the Pages Function. Every gift is recorded on diabeticledger.com.

*OpenDiabetic is the hive · LocalDiabetic is the healers · DiabeticLedger is the proof · DiabeticDonation is the ask.*
