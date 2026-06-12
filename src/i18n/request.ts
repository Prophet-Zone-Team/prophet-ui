import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

import { defaultLocale, LOCALE_COOKIE, resolveLocale } from "@/i18n/config";
import { mergeLegalMessages } from "@/lib/i18n/load-legal-messages";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value ?? defaultLocale);
  const messages = (await import(`./messages/${locale}.json`)).default;

  return {
    locale,
    messages: await mergeLegalMessages(locale, messages)
  };
});
