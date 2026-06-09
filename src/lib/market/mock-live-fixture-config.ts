export const MOCK_LIVE_FIXTURE_ELAPSED_SECONDS = 65 * 60;

export function isMockLiveFixtureEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_LIVE_FIXTURE === "true";
}
