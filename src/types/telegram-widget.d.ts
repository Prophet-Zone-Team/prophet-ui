/**
 * Telegram Login Widget (`telegram-widget.js`)
 * @see https://core.telegram.org/widgets/login
 */

export interface TelegramLoginAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface TelegramLoginAuthOptions {
  /** Numeric bot id from @BotFather (not @username). */
  bot_id: string;
  request_access?: boolean;
  lang?: string;
}

export type TelegramLoginAuthCallback = (
  data: TelegramLoginAuthData | false
) => void;

export interface TelegramLogin {
  auth(
    options: TelegramLoginAuthOptions,
    callback: TelegramLoginAuthCallback
  ): void;
  init?(
    options: TelegramLoginAuthOptions,
    callback: TelegramLoginAuthCallback
  ): void;
  open?(callback?: TelegramLoginAuthCallback): void;
}

export interface TelegramWidgetGlobal {
  Login: TelegramLogin;
}

declare global {
  interface Window {
    Telegram?: TelegramWidgetGlobal;
  }
}

export {};
