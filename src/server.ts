import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { z } from "zod";
import { beginOnboarding, confirmDomain, onboardingInput, type Onboarding } from "./domain_onboarding.ts";
import { InfraiClient, InfraiError } from "./infrai_http.ts";

const key = process.env.INFRAI_API_KEY;
const secret = process.env.WEBHOOK_SECRET;
const publicUrl = process.env.WEBHOOK_URL;
if (!key || !secret || !publicUrl) throw new Error("Set INFRAI_API_KEY, WEBHOOK_SECRET and WEBHOOK_URL");
const webhookSecret: string = secret;
const api = new InfraiClient(key);
const items = new Map<string, Onboarding>();
const notification = z.object({ domain: z.string(), verified: z.boolean() });

function signed(raw: Buffer, signature: string, signingSecret: string): boolean {
  const expected = createHmac("sha256", signingSecret).update(raw).digest("hex");
  const received = Buffer.from(signature.replace(/^sha256=/, ""), "hex");
  const digest = Buffer.from(expected, "hex");
  return received.length === digest.length && timingSafeEqual(received, digest);
}

async function main() {
  await api.request("POST", "/v1/account/webhooks/register", {
    url: publicUrl, events: ["*"], secret: webhookSecret,
    description: "Creator domain verification"
  });
  createServer(async (request, response) => {
    const send = (status: number, value: unknown) => {
      response.writeHead(status, { "Content-Type": "application/json" });
      response.end(JSON.stringify(value));
    };
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      const raw = Buffer.concat(chunks);
      if (request.method === "POST" && request.url === "/webhook") {
        const signature = request.headers["x-webhook-signature"];
        if (typeof signature !== "string" || !signed(raw, signature, webhookSecret)) return send(401, { error: "Invalid signature" });
        const event = notification.parse(JSON.parse(raw.toString("utf8")));
        const current = items.get(event.domain);
        if (current) items.set(event.domain, confirmDomain(current, event.verified));
        return send(200, { state: items.get(event.domain)?.state ?? "unknown" });
      }
      if (request.method === "POST" && request.url === "/domains") {
        const input = onboardingInput.parse(JSON.parse(raw.toString("utf8")));
        if (items.has(input.domain)) return send(200, items.get(input.domain));
        const item = await beginOnboarding(api, input);
        items.set(item.domain, item);
        return send(202, item);
      }
      if (request.method === "GET" && request.url?.startsWith("/domains/")) {
        const item = items.get(decodeURIComponent(request.url.slice(9)));
        return send(item ? 200 : 404, item ?? { error: "Domain not found" });
      }
      send(404, { error: "Not found" });
    } catch (error) {
      if (error instanceof z.ZodError || error instanceof SyntaxError) return send(400, { error: "Invalid request" });
      if (error instanceof InfraiError) return send(error.status >= 400 && error.status < 500 ? error.status : 502, { error: error.code });
      send(502, { error: "Upstream request failed" });
    }
  }).listen(Number(process.env.PORT ?? 3000));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
