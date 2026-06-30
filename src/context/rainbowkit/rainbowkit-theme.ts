import { darkTheme, lightTheme, type Theme } from "@rainbow-me/rainbowkit";

const PROPHET_FONT_BODY =
  '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const sharedThemeOptions = {
  borderRadius: "medium" as const,
  fontStack: "system" as const,
  overlayBlur: "small" as const,
};

function withProphetFont(theme: Theme): Theme {
  return {
    ...theme,
    fonts: {
      body: PROPHET_FONT_BODY,
    },
  };
}

export function getProphetRainbowLightTheme(): Theme {
  const base = lightTheme({
    ...sharedThemeOptions,
    accentColor: "#000000",
    accentColorForeground: "#FFFFFF",
  });

  return withProphetFont({
    ...base,
    colors: {
      ...base.colors,
      connectButtonBackground: "#FFFFFF",
      connectButtonText: "#000000",
      generalBorder: "#EBEBEB",
      generalBorderDim: "#F4F4F4",
      modalBackground: "#FFFFFF",
      modalBorder: "#EBEBEB",
      modalText: "#000000",
      modalTextSecondary: "#909090",
      modalTextDim: "#909090",
      menuItemBackground: "#F4F4F4",
      profileAction: "#FFFFFF",
      profileActionHover: "#EBEBEB",
    },
  });
}

export function getProphetRainbowDarkTheme(): Theme {
  const base = darkTheme({
    ...sharedThemeOptions,
    accentColor: "#3168FF",
    accentColorForeground: "#FFFFFF",
  });

  return withProphetFont({
    ...base,
    colors: {
      ...base.colors,
      connectButtonBackground: "#242427",
      connectButtonText: "#FFFFFF",
      generalBorder: "#353535",
      generalBorderDim: "#2E2E31",
      modalBackground: "#242427",
      modalBorder: "#353535",
      modalText: "#FFFFFF",
      modalTextSecondary: "#666668",
      modalTextDim: "#666668",
      menuItemBackground: "#2E2E31",
      profileAction: "#2E2E31",
      profileActionHover: "#353535",
      profileForeground: "#17171A",
      actionButtonSecondaryBackground: "#2E2E31",
      closeButtonBackground: "#2E2E31",
    },
  });
}

export function getProphetRainbowTheme(darkModeEnabled: boolean): Theme {
  return darkModeEnabled
    ? getProphetRainbowDarkTheme()
    : getProphetRainbowLightTheme();
}
