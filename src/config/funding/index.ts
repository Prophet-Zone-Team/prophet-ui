export * from "@/config/funding/networks";
export * from "@/config/funding/prices";
export * from "@/config/funding/tokens";

export const PRIVATE_MODE_HOSTNAME = process.env.PRIVATE_MODE_HOSTNAME ?? "";
export const MAIN_HOSTNAME = process.env.MAIN_HOSTNAME ?? "";
export function isPrivateModeHost(hostname: string): boolean {
  return PRIVATE_MODE_HOSTNAME === hostname;
}
