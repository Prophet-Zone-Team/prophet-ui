import type {
  CopyProfile,
  CopyProfileUpdateRequest,
  CopyTarget,
  CopyTargetUpdateItem
} from "@/types/copy-trade-api";
import type {
  CopyTradeOrderType,
  WalletCopyFormValues
} from "@/views/copy-trade/wallet-copy-modal/types";

export const MIN_MONEY_LIMIT_USD = 5;
export const MAX_PRICE_EXCLUSIVE = 1;
export const MAX_SLIPPAGE_EXCLUSIVE = 0.5;

export const COPY_DEFAULTS = {
  ratio: 0.1,
  minPrice: 0.02,
  maxPrice: 0.97,
  maxSlippage: 0.03,
  maxUSDPerTrade: 50,
  maxUSDPerMarket: 200,
  maxUSDPerHour: 500,
  maxUSDTotal: 2000,
  buyTakerOnly: true,
  sellTakerOnly: false
} as const;

export const ORDER_TYPES = new Set(["FAK", "FOK"]);

export type CopyTargetSizeMode = "ratio" | "fixed";

export interface CopyTargetForm {
  wallet: string;
  enabled: boolean;
  dryRun: boolean;
  buyEnabled: boolean;
  sellEnabled: boolean;
  buyTakerOnly: boolean;
  sellTakerOnly: boolean;
  sizeMode: CopyTargetSizeMode;
  orderType: string;
  ratio: number;
  minPrice: number;
  maxPrice: number;
  maxSlippage: number;
  maxUSDPerTrade: number;
  maxUSDPerMarket: number;
  maxUSDPerHour: number;
  maxUSDTotal: number;
  allowedConditions: string[];
  blockedConditions: string[];
}

const CONDITION_ID_RE = /^0x[0-9a-fA-F]{64}$/;

interface CopyRiskParams {
  ratio: number;
  minPrice: number;
  maxPrice: number;
  maxSlippage: number;
  maxUSDPerTrade: number;
  maxUSDPerMarket: number;
  maxUSDPerHour: number;
  maxUSDTotal: number;
  orderType: string;
}

export interface ProfileDefaultsInput {
  ratio?: unknown;
  min_price?: unknown;
  max_price?: unknown;
  max_slippage?: unknown;
  max_usd_per_trade?: unknown;
  max_usd_per_market?: unknown;
  max_usd_per_hour?: unknown;
  max_usd_total?: unknown;
  order_type?: unknown;
}

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

function normalizeSizeMode(value: string | undefined): CopyTargetSizeMode {
  return value === "fixed" ? "fixed" : "ratio";
}

function validateRiskParams(params: CopyRiskParams): string[] {
  const errors: string[] = [];
  const fields: Array<[keyof CopyRiskParams, string]> = [
    ["ratio", "Copy ratio"],
    ["minPrice", "Min. price"],
    ["maxPrice", "Max. price"],
    ["maxSlippage", "Max slippage"],
    ["maxUSDPerTrade", "Single order cap"],
    ["maxUSDPerMarket", "Per-market cap"],
    ["maxUSDPerHour", "Hourly cap"],
    ["maxUSDTotal", "Total cap"]
  ];

  fields.forEach(([key, label]) => {
    if (!Number.isFinite(Number(params[key]))) {
      errors.push(`${label} must be a valid number.`);
    }
  });

  if (errors.length > 0) {
    return errors;
  }

  if (params.ratio <= 0 || params.ratio > 1) {
    errors.push("Copy ratio must be greater than 0 and at most 100%.");
  }

  [
    [params.maxUSDPerTrade, "Single order cap"],
    [params.maxUSDPerMarket, "Per-market cap"],
    [params.maxUSDPerHour, "Hourly cap"],
    [params.maxUSDTotal, "Total cap"]
  ].forEach(([value, label]) => {
    if (Number(value) < MIN_MONEY_LIMIT_USD) {
      errors.push(`${label} must be at least $${MIN_MONEY_LIMIT_USD}.`);
    }
  });

  if (params.minPrice < 0 || params.minPrice >= MAX_PRICE_EXCLUSIVE) {
    errors.push("Min. price must be between 0 and 1, and cannot equal 1.");
  }

  if (params.maxPrice <= 0 || params.maxPrice >= MAX_PRICE_EXCLUSIVE) {
    errors.push("Max. price must be greater than 0 and less than 1.");
  }

  if (params.minPrice > params.maxPrice) {
    errors.push("Min. price cannot be higher than max. price.");
  }

  if (params.maxSlippage < 0 || params.maxSlippage >= MAX_SLIPPAGE_EXCLUSIVE) {
    errors.push(
      "Max slippage must be between 0 and 0.5, and cannot equal 0.5."
    );
  }

  if (!ORDER_TYPES.has(String(params.orderType || "").toUpperCase())) {
    errors.push("Order type must be FAK or FOK.");
  }

  return errors;
}

export function validateTargetForm(form: CopyTargetForm): string[] {
  const errors = validateRiskParams({
    ratio: asNumber(form.ratio),
    minPrice: asNumber(form.minPrice),
    maxPrice: asNumber(form.maxPrice),
    maxSlippage: asNumber(form.maxSlippage),
    maxUSDPerTrade: asNumber(form.maxUSDPerTrade),
    maxUSDPerMarket: asNumber(form.maxUSDPerMarket),
    maxUSDPerHour: asNumber(form.maxUSDPerHour),
    maxUSDTotal: asNumber(form.maxUSDTotal),
    orderType: form.orderType
  });

  [...(form.allowedConditions ?? []), ...(form.blockedConditions ?? [])]
    .map((value) => String(value).trim())
    .filter(Boolean)
    .forEach((condition) => {
      if (!CONDITION_ID_RE.test(condition)) {
        errors.push(`Invalid condition ID format: ${condition}`);
      }
    });

  return errors;
}

export function normalizeTargetForm(form: CopyTargetForm): CopyTargetForm {
  const normalized: CopyTargetForm = {
    ...form,
    wallet: String(form.wallet || "")
      .trim()
      .toLowerCase(),
    orderType: String(form.orderType || "FAK")
      .trim()
      .toUpperCase(),
    buyTakerOnly: Boolean(form.buyTakerOnly ?? COPY_DEFAULTS.buyTakerOnly),
    sellTakerOnly: Boolean(form.sellTakerOnly ?? COPY_DEFAULTS.sellTakerOnly),
    ratio: asNumber(form.ratio),
    minPrice: asNumber(form.minPrice),
    maxPrice: asNumber(form.maxPrice),
    maxSlippage: asNumber(form.maxSlippage),
    maxUSDPerTrade: asNumber(form.maxUSDPerTrade),
    maxUSDPerMarket: asNumber(form.maxUSDPerMarket),
    maxUSDPerHour: asNumber(form.maxUSDPerHour),
    maxUSDTotal: asNumber(form.maxUSDTotal),
    allowedConditions: (form.allowedConditions ?? [])
      .map((value) => String(value).trim().toLowerCase())
      .filter(Boolean),
    blockedConditions: (form.blockedConditions ?? [])
      .map((value) => String(value).trim().toLowerCase())
      .filter(Boolean)
  };

  const errors = validateTargetForm(normalized);
  if (errors.length > 0) {
    throw new Error(errors[0]);
  }

  return normalized;
}

export function validateProfileDefaults(input: ProfileDefaultsInput): string[] {
  return validateRiskParams({
    ratio: asNumber(input.ratio),
    minPrice: asNumber(input.min_price),
    maxPrice: asNumber(input.max_price),
    maxSlippage: asNumber(input.max_slippage),
    maxUSDPerTrade: asNumber(input.max_usd_per_trade),
    maxUSDPerMarket: asNumber(input.max_usd_per_market),
    maxUSDPerHour: asNumber(input.max_usd_per_hour),
    maxUSDTotal: asNumber(input.max_usd_total),
    orderType: String(input.order_type || "FAK")
  });
}

export function targetToForm(target: CopyTarget): CopyTargetForm {
  return {
    wallet: (target.Wallet || "").toLowerCase(),
    enabled: target.Enabled,
    dryRun: target.DryRun,
    buyEnabled: target.BuyEnabled,
    sellEnabled: target.SellEnabled,
    buyTakerOnly:
      target.BuyTakerOnly ?? target.TakerOnly ?? COPY_DEFAULTS.buyTakerOnly,
    sellTakerOnly:
      target.SellTakerOnly ?? target.TakerOnly ?? COPY_DEFAULTS.sellTakerOnly,
    sizeMode: normalizeSizeMode(target.SizeMode),
    orderType: target.OrderType || "FAK",
    ratio: target.Ratio ?? 0,
    minPrice: target.MinPrice ?? 0,
    maxPrice: target.MaxPrice ?? 0,
    maxSlippage: target.MaxSlippage ?? 0,
    maxUSDPerTrade: target.MaxUSDPerTrade ?? 0,
    maxUSDPerMarket: target.MaxUSDPerMarket ?? 0,
    maxUSDPerHour: target.MaxUSDPerHour ?? 0,
    maxUSDTotal: target.MaxUSDTotal ?? 0,
    allowedConditions: target.AllowedConditions ?? [],
    blockedConditions: target.BlockedConditions ?? []
  };
}

export function newTargetForm(
  wallet: string,
  profile: CopyProfile | null,
  live = false
): CopyTargetForm {
  const pick = (value: number | undefined, fallback: number) =>
    value && value > 0 ? value : fallback;

  return {
    wallet: wallet.toLowerCase(),
    enabled: true,
    dryRun: !live,
    buyEnabled: true,
    sellEnabled: true,
    buyTakerOnly:
      profile?.BuyTakerOnly ?? profile?.TakerOnly ?? COPY_DEFAULTS.buyTakerOnly,
    sellTakerOnly:
      profile?.SellTakerOnly ??
      profile?.TakerOnly ??
      COPY_DEFAULTS.sellTakerOnly,
    sizeMode: "ratio",
    orderType: profile?.OrderType || "FAK",
    ratio: pick(profile?.Ratio, COPY_DEFAULTS.ratio),
    minPrice: pick(profile?.MinPrice, COPY_DEFAULTS.minPrice),
    maxPrice: pick(profile?.MaxPrice, COPY_DEFAULTS.maxPrice),
    maxSlippage: pick(profile?.MaxSlippage, COPY_DEFAULTS.maxSlippage),
    maxUSDPerTrade: pick(profile?.MaxUSDPerTrade, COPY_DEFAULTS.maxUSDPerTrade),
    maxUSDPerMarket: pick(
      profile?.MaxUSDPerMarket,
      COPY_DEFAULTS.maxUSDPerMarket
    ),
    maxUSDPerHour: pick(profile?.MaxUSDPerHour, COPY_DEFAULTS.maxUSDPerHour),
    maxUSDTotal: pick(profile?.MaxUSDTotal, COPY_DEFAULTS.maxUSDTotal),
    allowedConditions: [],
    blockedConditions: []
  };
}

export function formToApiTarget(form: CopyTargetForm): CopyTargetUpdateItem {
  const normalized = normalizeTargetForm(form);

  return {
    wallet: normalized.wallet,
    enabled: normalized.enabled,
    dry_run: normalized.dryRun,
    buy_enabled: normalized.buyEnabled,
    sell_enabled: normalized.sellEnabled,
    taker_only: normalized.buyTakerOnly && normalized.sellTakerOnly,
    buy_taker_only: normalized.buyTakerOnly,
    sell_taker_only: normalized.sellTakerOnly,
    size_mode: "ratio",
    order_type: normalized.orderType,
    ratio: normalized.ratio,
    min_price: normalized.minPrice,
    max_price: normalized.maxPrice,
    max_slippage: normalized.maxSlippage,
    max_usd_per_trade: normalized.maxUSDPerTrade,
    max_usd_per_market: normalized.maxUSDPerMarket,
    max_usd_per_hour: normalized.maxUSDPerHour,
    max_usd_total: normalized.maxUSDTotal,
    allowed_conditions: normalized.allowedConditions,
    blocked_conditions: normalized.blockedConditions
  };
}

export function enableProfilePatch(
  profile: CopyProfile | null
): CopyProfileUpdateRequest {
  return {
    enabled: true,
    dry_run: profile?.DryRun ?? true,
    buy_enabled: profile?.BuyEnabled ?? true,
    sell_enabled: profile?.SellEnabled ?? true,
    taker_only:
      (profile?.BuyTakerOnly ??
        profile?.TakerOnly ??
        COPY_DEFAULTS.buyTakerOnly) &&
      (profile?.SellTakerOnly ??
        profile?.TakerOnly ??
        COPY_DEFAULTS.sellTakerOnly),
    buy_taker_only:
      profile?.BuyTakerOnly ?? profile?.TakerOnly ?? COPY_DEFAULTS.buyTakerOnly,
    sell_taker_only:
      profile?.SellTakerOnly ??
      profile?.TakerOnly ??
      COPY_DEFAULTS.sellTakerOnly,
    size_mode: "ratio",
    ratio:
      profile?.Ratio && profile.Ratio > 0 ? profile.Ratio : COPY_DEFAULTS.ratio,
    order_type: profile?.OrderType || "FAK",
    min_price: profile?.MinPrice ?? COPY_DEFAULTS.minPrice,
    max_price: profile?.MaxPrice ?? COPY_DEFAULTS.maxPrice,
    max_slippage: profile?.MaxSlippage ?? COPY_DEFAULTS.maxSlippage,
    max_usd_per_trade: profile?.MaxUSDPerTrade ?? COPY_DEFAULTS.maxUSDPerTrade,
    max_usd_per_market:
      profile?.MaxUSDPerMarket ?? COPY_DEFAULTS.maxUSDPerMarket,
    max_usd_per_hour: profile?.MaxUSDPerHour ?? COPY_DEFAULTS.maxUSDPerHour,
    max_usd_total: profile?.MaxUSDTotal ?? COPY_DEFAULTS.maxUSDTotal
  };
}

function toOrderType(value: string): CopyTradeOrderType {
  const normalized = String(value || "FAK").toUpperCase();
  return normalized === "FOK" ? "FOK" : "FAK";
}

export function targetFormToWalletCopyForm(
  form: CopyTargetForm
): WalletCopyFormValues {
  return {
    ratio:
      Math.round(form.ratio * 100) || Math.round(COPY_DEFAULTS.ratio * 100),
    buyEnabled: form.buyEnabled,
    sellEnabled: form.sellEnabled,
    buyTakerOnly: form.buyTakerOnly,
    sellTakerOnly: form.sellTakerOnly,
    maxUsdPerTrade: String(form.maxUSDPerTrade),
    maxUsdPerMarket: String(form.maxUSDPerMarket),
    maxUsdPerHour: String(form.maxUSDPerHour),
    maxUsdTotal: String(form.maxUSDTotal),
    minPrice: String(form.minPrice),
    maxPrice: String(form.maxPrice),
    maxSlippage: String(form.maxSlippage),
    orderType: toOrderType(form.orderType)
  };
}

export function targetToWalletCopyForm(
  target: CopyTarget
): WalletCopyFormValues {
  return targetFormToWalletCopyForm(targetToForm(target));
}

export function walletCopyFormToTargetForm(
  wallet: string,
  form: WalletCopyFormValues,
  overrides?: Partial<CopyTargetForm>
): CopyTargetForm {
  return {
    wallet: wallet.toLowerCase(),
    enabled: overrides?.enabled ?? true,
    dryRun: overrides?.dryRun ?? false,
    buyEnabled: form.buyEnabled,
    sellEnabled: form.sellEnabled,
    buyTakerOnly: form.buyTakerOnly,
    sellTakerOnly: form.sellTakerOnly,
    sizeMode: overrides?.sizeMode ?? "ratio",
    orderType: form.orderType,
    ratio: form.ratio / 100,
    minPrice: asNumber(form.minPrice),
    maxPrice: asNumber(form.maxPrice),
    maxSlippage: asNumber(form.maxSlippage),
    maxUSDPerTrade: asNumber(form.maxUsdPerTrade),
    maxUSDPerMarket: asNumber(form.maxUsdPerMarket),
    maxUSDPerHour: asNumber(form.maxUsdPerHour),
    maxUSDTotal: asNumber(form.maxUsdTotal),
    allowedConditions: overrides?.allowedConditions ?? [],
    blockedConditions: overrides?.blockedConditions ?? [],
    ...overrides
  };
}
