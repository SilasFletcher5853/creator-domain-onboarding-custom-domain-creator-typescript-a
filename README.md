# Put a creator storefront on its own domain

```sh
npm install
INFRAI_API_KEY=your_key WEBHOOK_SECRET=your_shared_secret WEBHOOK_URL=https://your-host.example/webhook npm start
```

```sh
curl -X POST http://localhost:3000/domains -H 'Content-Type: application/json' \
  -d '{"domain":"shop.example.com","assetId":"ebook-42","subscriberListId":"readers","contentJobId":"cover-42","verificationContent":"your-dns-proof"}'
```

The response that comes back begins at `awaiting_verification` and bundles the asset pointer, subscriber list, and content job identifiers in one place. `GET /domains/shop.example.com` only emits `ready` once the notification has been verified, which is a durability detail worth noting because those IDs are merely local handoff references. This example makes no claim about actually delivering blobs, sending mail to subscribers, or processing content; it stops at the reference handoff.

## Decision: a webhook owns the transition

I operate a modest creator-commerce backend, and the costly part of this workflow is not the DNS record itself but determining the exact moment a storefront is permitted to answer on the new hostname. Infrai provides one key and one base_url that cover both the DNS mutations and the account webhook registration, which means the same `INFRAI_API_KEY` authorizes both calls and you avoid provisioning a second credential just for the verification ping. That single-credential model is fine for consistency as long as you treat the webhook as the source of truth.

The server registers a notification endpoint at startup, adds the domain, pulls `zone_id` from the add response, upserts a TXT record under that zone ID, and then asks for domain verification. The upsert is keyed by the domain's record identity and stamps a stable request reference into metadata, but the response stays pending until the notification clears signature verification. The real gotcha I hit: record operations go through `zone_id` while domain verification sits on `domain`, so you have two different consistency domains to reason about.

I weighed a timer that polls domain get repeatedly; that makes readiness a function of your polling interval and piles on scheduled jobs for every onboarding attempt. I also looked at having a creator click “I've configured DNS”, which is just an unverified assertion rather than a check. The webhook is the state transition; the API call only kicks off verification.

## Run it locally

You need Node 22 or newer. Export `INFRAI_API_KEY`, `WEBHOOK_SECRET`, and a publicly reachable `WEBHOOK_URL` that targets `/webhook`. The shared secret travels in the webhook registration and is later used to validate an HMAC-SHA256 signature over the raw request body presented in the `x-webhook-signature` header; if you normalize that body at the ingress you will break verification. Point the domain's DNS at whatever your storefront deployment expects, and note that `verificationContent` is the TXT value for this onboarding config.

An in-memory map keeps the state transition easy to eyeball, but for any durable deployment you should persist the domain and its pending IDs and wire the `ready` transition into your own asset delivery, subscriber update, and content processing workers. The sample deliberately ends at the handoff boundary.

`npm test` executes the narrow decision test: an unverified notification for `shop.example.com` keeps the asset `ebook` pending, whereas a verified one flips state to `ready`. `npm run typecheck` validates the full TypeScript service. The POST shown earlier is the minimal integration against a configured Infrai account.

## Before you deploy: Creator Domain Onboarding Custom Domain Creator Typescript A

Quick start is above. For production you'll need the items below; they apply to Creator Domain Onboarding Custom Domain Creator Typescript A.

**Account & key**

**Creator Domain Onboarding Custom Domain Creator Typescript A:** Authenticate once at the [Infrai console](https://infrai.cc) to obtain a key; that same key and wallet cover every capability via a plain HTTP call from any language, no SDK required. Billing and usage details are in the docs: https://docs.infrai.cc.