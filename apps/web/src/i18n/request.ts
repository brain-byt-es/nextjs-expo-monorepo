import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  // Primaer Deutsch — spaeter dynamisch per User-Einstellung
  const locale = "de";

  const messages = (await import(`./messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
