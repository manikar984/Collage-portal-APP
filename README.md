# Helios Institute of Technology — Smart Campus

A fictional autonomous college portal. Students, faculty, the warden, exam cell, and the registrar sign in with a roll number or staff ID. A student session cannot read another student's fees, grades, or hall ticket.

This is a demonstration campus, not a live college and not a payment processor. Gateway keys are placeholders.

## Run

```bash
npm install
npm run dev
```

Open the site and sign in.

| Who | ID | Password |
| --- | --- | --- |
| Ananya Rao, CSE student | `21CSE0142` | `campus-demo` |
| Rohan Iyer, ECE student | `21ECE0088` | `campus-demo` |
| Dr. Meera Krishnan | `FAC1024` | `campus-demo` |
| Block C warden | `WAR2001` | `campus-demo` |
| Exam cell | `EXM3001` | `campus-demo` |
| Registrar | `ADM0001` | `campus-demo` |

The demo OTP for fee payment is `482913`. A production build must send that code by SMS and must not return it from the API. Set `DEMO_MODE=false` to hide it.

## What is enforced

- Access tokens last 15 minutes. Refresh tokens last 7 days, rotate, and a reused refresh token revokes the family.
- Fee checkout requires an `Idempotency-Key` and a recent OTP grant. The webhook is signature-checked and settles through a queue whose job id is the gateway reference.
- Results are cached for 5 minutes. Result, hall-ticket, and question-paper reads are limited to 60 requests a minute.
- Settled payments download a demonstration GST-style receipt. It is not a tax invoice filed with any authority. The GSTIN on it is fictional.
- Approved hostel passes get a gate code. Only the warden or registrar can mark that code used.
- Question papers open in the vault reader. The PDF is a cover sheet for the object key. It does not invent the scanned questions. Save offline uses the browser cache.
- `db/001_schema.sql` and `db/002_rls.sql` are the production database. The API must `SET LOCAL app.user_id` and `app.role` inside a transaction and must connect as a role without `BYPASSRLS`. The running preview uses the same ownership checks in process so it can be opened without a database.

## Production wiring

- `CAMPUS_TOKEN_SECRET` signs access tokens and the rotating student QR.
- `PAYMENT_WEBHOOK_SECRET` verifies Razorpay or Stripe webhooks. Do not commit either secret.
- `REDIS_URL` is the shared cache and the BullMQ backend. The preview falls back to process memory and keeps the same key and job-id contract.
- Question papers store an object key. Production issues a short-lived presigned URL from R2 or S3. The file itself is not public.

Legacy ERP login is a signed redirect from the registrar role, not a copied password.

Apply the database, as a migration role, with:

```bash
psql "$DATABASE_URL" -f db/001_schema.sql
psql "$DATABASE_URL" -f db/002_rls.sql
psql "$DATABASE_URL" -f db/003_seed.sql
```

The preview does not need Postgres. It uses the same ownership rules in process.

## Checks

```bash
npx tsx scripts/domain.test.ts
```
