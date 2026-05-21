import type { Team } from "../../types/market";

export interface WorldCup2026GroupTeam {
  id: Team["id"];
  code: string;
  name: string;
  zhName: string;
}

export type WorldCup2026Group = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L";

export const WORLD_CUP_2026_GROUPS: Record<WorldCup2026Group, WorldCup2026GroupTeam[]> = {
  A: [
    { id: "mexico", code: "MEX", name: "Mexico", zhName: "墨西哥" },
    { id: "south-africa", code: "RSA", name: "South Africa", zhName: "南非" },
    { id: "south-korea", code: "KOR", name: "Korea Republic", zhName: "韩国" },
    { id: "czechia", code: "CZE", name: "Czechia", zhName: "捷克" },
  ],
  B: [
    { id: "canada", code: "CAN", name: "Canada", zhName: "加拿大" },
    { id: "bosnia-herzegovina", code: "BIH", name: "Bosnia & Herzegovina", zhName: "波黑" },
    { id: "qatar", code: "QAT", name: "Qatar", zhName: "卡塔尔" },
    { id: "switzerland", code: "SUI", name: "Switzerland", zhName: "瑞士" },
  ],
  C: [
    { id: "brazil", code: "BRA", name: "Brazil", zhName: "巴西" },
    { id: "morocco", code: "MAR", name: "Morocco", zhName: "摩洛哥" },
    { id: "haiti", code: "HAI", name: "Haiti", zhName: "海地" },
    { id: "scotland", code: "SCO", name: "Scotland", zhName: "苏格兰" },
  ],
  D: [
    { id: "usa", code: "USA", name: "USA", zhName: "美国" },
    { id: "paraguay", code: "PAR", name: "Paraguay", zhName: "巴拉圭" },
    { id: "australia", code: "AUS", name: "Australia", zhName: "澳大利亚" },
    { id: "turkiye", code: "TUR", name: "Türkiye", zhName: "土耳其" },
  ],
  E: [
    { id: "germany", code: "GER", name: "Germany", zhName: "德国" },
    { id: "curacao", code: "CUW", name: "Curaçao", zhName: "库拉索" },
    { id: "ivory-coast", code: "CIV", name: "Côte d'Ivoire", zhName: "科特迪瓦" },
    { id: "ecuador", code: "ECU", name: "Ecuador", zhName: "厄瓜多尔" },
  ],
  F: [
    { id: "netherlands", code: "NED", name: "Netherlands", zhName: "荷兰" },
    { id: "japan", code: "JPN", name: "Japan", zhName: "日本" },
    { id: "sweden", code: "SWE", name: "Sweden", zhName: "瑞典" },
    { id: "tunisia", code: "TUN", name: "Tunisia", zhName: "突尼斯" },
  ],
  G: [
    { id: "belgium", code: "BEL", name: "Belgium", zhName: "比利时" },
    { id: "egypt", code: "EGY", name: "Egypt", zhName: "埃及" },
    { id: "iran", code: "IRN", name: "IR Iran", zhName: "伊朗" },
    { id: "new-zealand", code: "NZL", name: "New Zealand", zhName: "新西兰" },
  ],
  H: [
    { id: "spain", code: "ESP", name: "Spain", zhName: "西班牙" },
    { id: "cape-verde", code: "CPV", name: "Cabo Verde", zhName: "佛得角" },
    { id: "saudi-arabia", code: "KSA", name: "Saudi Arabia", zhName: "沙特阿拉伯" },
    { id: "uruguay", code: "URU", name: "Uruguay", zhName: "乌拉圭" },
  ],
  I: [
    { id: "france", code: "FRA", name: "France", zhName: "法国" },
    { id: "senegal", code: "SEN", name: "Senegal", zhName: "塞内加尔" },
    { id: "iraq", code: "IRQ", name: "Iraq", zhName: "伊拉克" },
    { id: "norway", code: "NOR", name: "Norway", zhName: "挪威" },
  ],
  J: [
    { id: "argentina", code: "ARG", name: "Argentina", zhName: "阿根廷" },
    { id: "algeria", code: "ALG", name: "Algeria", zhName: "阿尔及利亚" },
    { id: "austria", code: "AUT", name: "Austria", zhName: "奥地利" },
    { id: "jordan", code: "JOR", name: "Jordan", zhName: "约旦" },
  ],
  K: [
    { id: "portugal", code: "POR", name: "Portugal", zhName: "葡萄牙" },
    { id: "congo-dr", code: "COD", name: "Congo DR", zhName: "刚果（金）" },
    { id: "uzbekistan", code: "UZB", name: "Uzbekistan", zhName: "乌兹别克斯坦" },
    { id: "colombia", code: "COL", name: "Colombia", zhName: "哥伦比亚" },
  ],
  L: [
    { id: "england", code: "ENG", name: "England", zhName: "英格兰" },
    { id: "croatia", code: "CRO", name: "Croatia", zhName: "克罗地亚" },
    { id: "ghana", code: "GHA", name: "Ghana", zhName: "加纳" },
    { id: "panama", code: "PAN", name: "Panama", zhName: "巴拿马" },
  ],
};

export const WORLD_CUP_2026_GROUP_ORDER = Object.keys(WORLD_CUP_2026_GROUPS) as WorldCup2026Group[];

export function getWorldCupGroupForTeam(teamIdOrCode: string): WorldCup2026Group | undefined {
  const normalized = teamIdOrCode.toLowerCase();

  return WORLD_CUP_2026_GROUP_ORDER.find((group) =>
    WORLD_CUP_2026_GROUPS[group].some((team) => team.id === normalized || team.code.toLowerCase() === normalized),
  );
}

export function getWorldCupTeamByIdOrCode(teamIdOrCode: string): WorldCup2026GroupTeam | undefined {
  const normalized = teamIdOrCode.toLowerCase();

  return WORLD_CUP_2026_GROUP_ORDER
    .flatMap((group) => WORLD_CUP_2026_GROUPS[group])
    .find((team) => team.id === normalized || team.code.toLowerCase() === normalized);
}

export function getAllWorldCup2026Teams(): WorldCup2026GroupTeam[] {
  return WORLD_CUP_2026_GROUP_ORDER.flatMap((group) => WORLD_CUP_2026_GROUPS[group]);
}
