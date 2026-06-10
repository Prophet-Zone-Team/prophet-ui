export function isMockProphetNotificationsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_PROPHET_NOTIFICATIONS === "true";
}
