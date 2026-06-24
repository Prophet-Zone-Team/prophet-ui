type CapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    getPlatform?: () => string;
  };
};

export function isNativeApp(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const capacitor = (window as CapacitorWindow).Capacitor;
  return Boolean(capacitor?.isNativePlatform?.());
}

export function getNativePlatform(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return (window as CapacitorWindow).Capacitor?.getPlatform?.();
}

export function isNativeIosApp(): boolean {
  return isNativeApp() && getNativePlatform() === "ios";
}
