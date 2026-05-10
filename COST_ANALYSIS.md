# NextDraft — Cost & Profitability Analysis

> Last updated: May 2026

## AI Cost per Resume Edit

| Component | Details | Cost per Edit |
|---|---|---|
| Gemini 2.5 Flash | ~800 input + ~400 output tokens | ~₹0.05 |
| MongoDB read/write | 2-3 queries per edit | negligible |
| Cloudinary | Resume PDF storage | negligible |
| **Total cost per AI edit** | | **~₹0.05** |

---

## Pricing Packs

| Pack | Points | Price (₹) | Edits Included | Cost per Edit to User | Your Profit |
|---|---|---|---|---|---|
| **Starter** | 50 | ₹50 | 1 | ₹50 | ₹49.95 (99.9%) |
| **Plus** | 150 | ₹150 | 3 | ₹50 | ₹149.85 (99.9%) |
| **Pro** | 500 | ₹500 | 10 | ₹50 | ₹499.50 (99.9%) |

- 1 AI resume edit = 50 points
- New users get 50 free starter points (1 free edit)

---

## Infrastructure Costs by Growth Phase

### Phase 1: Launch (0–500 users) — ₹0/month

All services on free tiers.

| Service | Free Tier Limit | Monthly Cost |
|---|---|---|
| Vercel (frontend) | 100GB bandwidth, serverless | ₹0 |
| Render (backend) | 750 hrs/month, sleeps after 15min idle | ₹0 |
| MongoDB Atlas (M0) | 512MB storage, shared cluster | ₹0 |
| Cloudinary | 25GB storage, 25GB bandwidth | ₹0 |
| Gemini 2.5 Flash | 1,500 requests/day free | ₹0 |
| Gmail SMTP | 500 emails/day | ₹0 |
| **Total** | | **₹0** |

> ⚠️ **Limitation:** Render free tier sleeps after 15 min idle — first request takes ~30s cold start. Consider upgrading to paid tier early for better UX.

---

### Phase 2: Growth (500–5,000 users) — ~₹4,500/month

| Service | Tier | Monthly Cost |
|---|---|---|
| Render (Starter) | Always-on, no cold start | ~₹600 ($7) |
| MongoDB Atlas (M10) | 10GB, dedicated cluster | ~₹1,200 ($15) |
| Vercel (Pro) | More bandwidth, analytics | ~₹1,700 ($20) |
| Gemini API | Pay-as-you-go beyond free | ~₹200–500 |
| Cloudinary (Plus) | More storage | ~₹750 ($9) |
| Domain (.com) | Custom domain | ~₹65/month (~₹800/year) |
| Email (Resend free tier) | Better deliverability | ₹0 |
| **Total** | | **~₹4,500/month** |

**Break-even:** 90 Starter pack sales/month (90 × ₹50 = ₹4,500)

---

### Phase 3: Scale (5,000–50,000 users) — ~₹15,000–20,000/month

| Service | Tier | Monthly Cost |
|---|---|---|
| Render (Standard) | 2GB RAM, faster CPU | ~₹2,100 ($25) |
| MongoDB Atlas (M20) | 50GB, auto-scaling | ~₹5,000 ($60) |
| Vercel (Pro) | Team features | ~₹1,700 ($20) |
| Gemini API / GPT-4o-mini | Higher quality AI | ~₹2,000–5,000 |
| Cloudinary (Advanced) | More storage/transforms | ~₹2,500 ($30) |
| Resend (Pro) | 50K emails/month | ~₹1,700 ($20) |
| Sentry (error monitoring) | Bug tracking | ₹0 (free tier) |
| **Total** | | **~₹15,000–20,000/month** |

**Break-even:** 300–400 Starter pack sales/month

---

## Additional Costs to Plan For

| Cost | When It Applies | Amount |
|---|---|---|
| Razorpay transaction fees | Every payment processed | 2% per transaction |
| GST registration | Annual revenue exceeds ₹20 lakh | 18% on services |
| SSL certificates | Always (included free by Vercel/Render) | ₹0 |
| Database backups | When user data becomes critical | ~₹500/month |
| Legal (Privacy Policy, T&C) | Before public launch | One-time ₹2,000–5,000 |
| Accounting/CA | GST filing, compliance | ~₹1,000–2,000/month |

---

## Revenue Projections

| Monthly Active Users | Paid Conversion (5%) | Avg. Pack | Monthly Revenue | Monthly Cost | **Net Profit** |
|---|---|---|---|---|---|
| 500 | 25 | ₹100 | ₹2,500 | ₹0 | **₹2,500** |
| 2,000 | 100 | ₹100 | ₹10,000 | ₹4,500 | **₹5,500** |
| 10,000 | 500 | ₹100 | ₹50,000 | ₹15,000 | **₹35,000** |
| 50,000 | 2,500 | ₹100 | ₹2,50,000 | ₹30,000 | **₹2,20,000** |

> Assumes 5% of active users purchase at least one pack per month, with an average spend of ₹100 (mix of Starter + Plus packs).

---

## Key Takeaways

1. **Profitable from Day 1** — zero infrastructure costs on free tiers
2. **99%+ margins** — AI cost per edit is < ₹0.10 vs ₹50 charged
3. **First meaningful cost** — Render paid tier at ₹600/month (eliminates cold starts)
4. **Break-even at scale** — only 90 sales/month needed to cover Phase 2 costs
5. **Competitive pricing** — professional resume services charge ₹500–₹2,000 per edit; NextDraft charges ₹50
