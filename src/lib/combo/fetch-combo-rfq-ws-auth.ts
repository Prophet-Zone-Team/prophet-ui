import { fetchJson } from "@/lib/team/client-fetch";
import type { ComboRfqWsAuthPayload } from "@/types/combo-rfq-ws";

export async function fetchComboRfqWsAuth(
  signal?: AbortSignal,
): Promise<ComboRfqWsAuthPayload> {
  const payload = await fetchJson<{ auth?: ComboRfqWsAuthPayload }>(
    "/api/combo/rfq/ws-auth",
    { signal },
  );

  if (!payload.auth?.auth.apiKey || !payload.auth.identity.signer_address) {
    throw new Error("Combo RFQ WebSocket auth payload was incomplete.");
  }

  return payload.auth;
}
