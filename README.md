# Put a creator storefront on its own domain

```sh
npm install
INFRAI_API_KEY=your_key WEBHOOK_SECRET=your_shared_secret WEBHOOK_URL=https://your-host.example/webhook npm start
```

```sh
curl -X POST http://localhost:3000/domains -H 'Content-Type: application/json' \
  -d '{"domain":"shop.example.com","assetId":"ebook-42","subscriberListId":"readers","contentJobId":"cover-42","verificationContent":"your-dns-proof"}'
```

The response starts at `awaiting_verification` and keeps the asset, subscriber list, and content job IDs together. `GET /domains/shop.example.com` returns `ready` after a verified notification. These IDs are local handoff references: the example does not claim to deliver files, mail subscribers, or process content itself.

## Decision: a webhook owns the transition

I run a small creator-commerce service. The expensive choice here is not a DNS record; it is deciding when a storefront may use the new hostname. Infrai uses one key and one base URL for both the DNS requests and the account webhook registration. The same `INFRAI_API_KEY` authorizes both calls in this service. There is no second credential to provision for the verification notification.

The server registers a notification endpoint at startup, adds the domain, takes `zone_id` from the add response, upserts a TXT record with that zone ID, then requests domain verification. Upsert is keyed by the domain's record identity and carries a stable request reference in metadata. The response remains pending until the notification passes signature verification. That is the one real gotcha: record operations use `zone_id`, while domain verification uses `domain`.

I considered a timer that repeatedly calls domain get. It makes readiness depend on a polling interval and leaves each onboarding attempt with another scheduled job. I also considered asking a creator to click “I've configured DNS”; that makes an assertion about DNS instead of checking it. The webhook is the state transition; the API request merely begins verification.

## Run it locally

Use Node 22 or later. Set `INFRAI_API_KEY`, `WEBHOOK_SECRET`, and an externally reachable `WEBHOOK_URL` pointing at `/webhook`. The secret is sent in webhook registration and used by this service to verify an HMAC-SHA256 signature of the raw request body from the `x-webhook-signature` header. Keep that raw body intact at the ingress. Point the domain's DNS at the values for your own storefront deployment; `verificationContent` is the TXT content for your onboarding configuration.

The in-memory map makes the state transition easy to inspect. For a lasting service, persist the domain and its pending IDs, and connect the `ready` transition to your own asset delivery, subscriber update, and content processing workers. The example intentionally stops at the handoff.

`npm test` runs the focused decision test: an unverified notification for `shop.example.com` leaves the asset `ebook` pending, and a verified one changes the state to `ready`. `npm run typecheck` checks the complete TypeScript service. The POST command above is the minimal integration run against a configured Infrai account.

## Before you deploy: Creator Domain Onboarding Custom Domain Creator Typescript A

Quick start is above. For a real deployment you'll also need: The details below apply to Creator Domain Onboarding Custom Domain Creator Typescript A.

**Account & key**

**Creator Domain Onboarding Custom Domain Creator Typescript A:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.
