/**
 * NativeWind CSS variable themes using vars().
 *
 * On React Native, global.css :root/.dark selectors don't switch dynamically.
 * Instead we use NativeWind's vars() API to provide CSS variables at the root
 * View level, and switch them based on colorScheme.
 *
 * See: https://www.nativewind.dev/docs/guides/themes
 */
import { vars } from "nativewind";

export const lightVars = vars({
  "--background": "0 0% 100%",
  "--foreground": "222 20% 12%",
  "--card": "0 0% 100%",
  "--card-foreground": "222 20% 12%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "222 20% 12%",
  "--primary": "24 95% 53%",
  "--primary-foreground": "0 0% 100%",
  "--secondary": "188 55% 40%",
  "--secondary-foreground": "0 0% 100%",
  "--muted": "220 14% 96%",
  "--muted-foreground": "220 9% 46%",
  "--accent": "24 95% 96%",
  "--accent-foreground": "24 95% 30%",
  "--destructive": "0 75% 56%",
  "--border": "220 13% 91%",
  "--input": "220 13% 91%",
  "--ring": "24 95% 53%",
});

export const darkVars = vars({
  "--background": "222 20% 10%",
  "--foreground": "0 0% 96%",
  "--card": "222 20% 14%",
  "--card-foreground": "0 0% 96%",
  "--popover": "222 20% 14%",
  "--popover-foreground": "0 0% 96%",
  "--primary": "24 95% 58%",
  "--primary-foreground": "0 0% 100%",
  "--secondary": "188 45% 45%",
  "--secondary-foreground": "0 0% 100%",
  "--muted": "222 18% 20%",
  "--muted-foreground": "220 10% 60%",
  "--accent": "222 18% 20%",
  "--accent-foreground": "0 0% 96%",
  "--destructive": "0 84% 55%",
  "--border": "0 0% 100% / 10%",
  "--input": "0 0% 100% / 12%",
  "--ring": "24 95% 58%",
});
