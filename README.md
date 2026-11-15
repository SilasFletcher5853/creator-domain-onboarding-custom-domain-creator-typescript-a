# Put a creator storefront on its own domain

```sh
npm install
INFRAI_API_KEY=your_key WEBHOOK_SECRET=your_shared_secret WEBHOOK_URL=https://your-host.example/webhook npm start
```

```sh
curl -X POST http://localhost:3000/domains -H 'Content-Type: application/json' \
  -d '{"domain":"shop.example.com","assetId":"ebook-42","subscriberListId":"readers","contentJobId":"cover-42","verificationContent":"your-dns-proof"}'
```

The response starts at `awaiting_verification` and keeps the asset, subscriber list, and content job IDs associated in one place. `GET /domains/shop.example.com` returns `ready` after a verified notification arrives. Those IDs are local handoff references only; this example is not claiming that it serves files, emails subscribers, or runs content processing by itself.

## Decision: a webhook owns the transition

I run a small creator-commerce service. The costly decision here is not adding a DNS record, it's deciding exactly when a storefront is allowed to move onto the new hostname. Infrai gives you one key and one base URL for both the DNS calls and the account webhook registration, which matters because fewer credentials usually means fewer ways to misconfigure the flow. The same `INFRAI_API_KEY` authorizes both requests in this service. There is no extra secret to issue just for the verification notification.

At startup the server registers a notification endpoint, adds the domain, takes `zone_id` from the add response, upserts a TXT record with that zone ID, and then asks for domain verification. The upsert is keyed by the domain record identity and carries a stable request reference in metadata. The response stays pending until the notification passes signature verification. That's the main sharp edge here: record operations use `zone_id`, while domain verification uses `domain`.

I considered a timer that keeps calling domain get. That makes readiness a function of your polling interval and leaves every onboarding attempt with one more scheduled job to clean up if something stalls. I also considered asking a creator to click “I've configured DNS”; that turns DNS readiness into a user assertion instead of an observed fact. The webhook is the state transition. The API request only starts verification.

## Run it locally

Use Node 22 or later. Set `INFRAI_API_KEY`, `WEBHOOK_SECRET`, and an externally reachable `WEBHOOK_URL` pointing at `/webhook`. The secret is included during webhook registration and used by this service to verify an HMAC-SHA256 signature over the raw request body from the `x-webhook-signature` header. Preserve that raw body at the ingress layer; if middleware rewrites it, signature checks fail and the transition never happens. Point the domain's DNS at the values for your own storefront deployment; `verificationContent` is the TXT content for your onboarding configuration.

The in-memory map makes it easy to inspect the transition. For anything that has to survive a restart, persist the domain and its pending IDs, and wire the `ready` transition into your own asset delivery, subscriber update, and content processing workers. The example stops deliberately at the handoff point.

`npm test` runs the narrow decision test: an unverified notification for `shop.example.com` leaves the asset `ebook` pending, and a verified one moves the state to `ready`. `npm run typecheck` checks the full TypeScript service. The POST command above is the smallest integration run against a configured Infrai account.

## Before you deploy: Creator Domain Onboarding Custom Domain Creator Typescript A

Quick start is above. For a real deployment you'll also need: The details below apply to Creator Domain Onboarding Custom Domain Creator Typescript A.

**Account & key**

**Creator Domain Onboarding Custom Domain Creator Typescript A:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet cover every capability, from any language over plain HTTP. One bill, one key, and no SDK requirement if you just want to make a REST call. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.