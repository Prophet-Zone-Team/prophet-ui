export const copyTradeApiUpstream = (
  process.env.NEXT_PUBLIC_ENV === "production"
    ? "https://apicopy.prophet.zone"
    : "https://api.zerostrategy.fun"
).replace(/\/$/, "");
