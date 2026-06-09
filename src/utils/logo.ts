export const LogoHost = "https://assets.dapdap.net";
export const DefaultIcon = `${LogoHost}/tokens/default_icon.png`;
export const formatPath = (path: string) => {
  return /^\//.test(path) ? path : `/${path}`;
};
export const getLogo = (path: string) => {
  const host = "https://assets.dapdap.net";
  path = formatPath(path);
  return `${host}${path}`;
};
export const getTokenLogo = (name: string, suffix: string = "png") => {
  name = name.toLowerCase();

  const defaultSuffix = SpecialTokenIconSuffixes[name] ?? suffix;
  const defaultName = SpecialTokenIconNames[name] ?? name;

  const namePath = formatPath(defaultName);
  return getLogo(`/tokens${namePath}.${defaultSuffix}`);
};
export const getStableflowChainLogo = (name: string, suffix: string = "png") => {
  name = name.toLowerCase();
  name = formatPath(name);
  return getLogo(`/stableflow/networks${name}.${suffix}`);
};
export const getStableflowTokenLogo = (name: string, suffix: string = "png") => {
  name = name.toLowerCase();
  name = formatPath(name);
  return getLogo(`/stableflow/tokens${name}.${suffix}`);
};
export const getStableflowRouteLogo = (name: string) => {
  name = name.toLowerCase();
  name = formatPath(name);
  return getLogo(`/stableflow/routes${name}`);
};
export const getStableflowLogo = (name: string) => {
  name = name.toLowerCase();
  name = formatPath(name);
  return getLogo(`/stableflow/logos${name}`);
};
export const getStableflowIcon = (name: string) => {
  name = name.toLowerCase();
  name = formatPath(name);
  return getLogo(`/stableflow/icons${name}`);
};
export const getStableflowTrustAvatar = (name: string) => {
  name = name.toLowerCase();
  name = formatPath(name);
  return getLogo(`/stableflow/trusts${name}`);
};

export const SpecialTokenIconSuffixes: Record<string, string> = {
  aave: "svg",
  ada: "svg",
  ageur: "webp",
  aero: "svg",
  ausd: "webp",
  brett: "webp",
  btcb: "webp",
  busd: "webp",
  cake: "svg",
  dog: "webp",
  eurc: "svg",
  gno: "webp",
  hype: "webp",
  inj: "jpg",
  ltc: "svg",
  matic: "webp",
  op: "svg",
  sand: "webp",
  snx: "svg",
  sol: "svg",
  steth: "svg",
  susde: "svg",
  tusd: "svg",
  usdbc: "svg",
  usds: "svg",
  wbeth: "svg",
  xrp: "svg",
};
export const SpecialTokenIconNames: Record<string, string> = {
  "aurora": "aura",
  "susdc": "usdc",
  "steakusdc": "usdc",
  "gtusdcp": "usdc",
  "sparkusdc": "usdc",
  "mwusdc": "usdc",
  "hemibtc": "btc",
  "nrusdt": "usdt",
};
