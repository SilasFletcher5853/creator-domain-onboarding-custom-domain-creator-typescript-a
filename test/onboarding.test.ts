import assert from "node:assert/strict";
import { test } from "node:test";
import { confirmDomain, type Onboarding } from "../src/domain_onboarding.ts";

test("delivery and subscriber work stays pending until domain verification", () => {
  const item: Onboarding = {
    domain: "shop.example.com", zone_id: "zone-1", state: "awaiting_verification",
    pending: { assetId: "ebook", subscriberListId: "readers", contentJobId: "cover" }
  };
  assert.equal(confirmDomain(item, false).state, "awaiting_verification");
  assert.deepEqual(confirmDomain(item, true), { ...item, state: "ready" });
  assert.equal(item.state, "awaiting_verification");
});
