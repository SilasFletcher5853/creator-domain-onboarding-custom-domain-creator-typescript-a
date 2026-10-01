import { z } from "zod";
import { InfraiClient } from "./infrai_http.ts";

export const onboardingInput = z.object({
  domain: z.string().min(3),
  assetId: z.string().min(1),
  subscriberListId: z.string().min(1),
  contentJobId: z.string().min(1),
  verificationContent: z.string().min(1)
}).strict();
export type OnboardingInput = z.infer<typeof onboardingInput>;

export type Onboarding = {
  domain: string;
  zone_id: string;
  state: "awaiting_verification" | "ready";
  pending: { assetId: string; subscriberListId: string; contentJobId: string };
};

export function confirmDomain(item: Onboarding, verified: boolean): Onboarding {
  return verified && item.state === "awaiting_verification" ? { ...item, state: "ready" } : item;
}

export async function beginOnboarding(api: InfraiClient, input: OnboardingInput): Promise<Onboarding> {
  const added = await api.request<{ zone_id: string }>("POST", "/v1/dns/domain/add", { domain: input.domain });
  if (!added?.zone_id) throw new Error("Domain response needs zone_id");
  await api.request("PUT", "/v1/dns/record/upsert", {
    zone_id: added.zone_id, record_type: "TXT", name: input.domain,
    content: input.verificationContent,
    metadata: { request_id: `domain:${input.domain}:verification` }
  });
  await api.request("POST", "/v1/dns/domain/verify", { domain: input.domain });
  return {
    domain: input.domain, zone_id: added.zone_id, state: "awaiting_verification",
    pending: { assetId: input.assetId, subscriberListId: input.subscriberListId, contentJobId: input.contentJobId }
  };
}
