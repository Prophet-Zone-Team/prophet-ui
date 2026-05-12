import type { Team } from "../types/market";

export interface TeamNewsQueryConfig {
  teamId: Team["id"];
  aliases: string[];
  countryAliases: string[];
  keyPlayers: string[];
  excludeTerms: string[];
}

export const WORLD_CUP_CONTEXT_KEYWORDS = [
  "World Cup",
  "FIFA",
  "national team",
  "squad",
  "qualifier",
] as const;

export const teamNewsQueryConfig: TeamNewsQueryConfig[] = [
  {
    teamId: "argentina",
    aliases: ["Argentina", "Argentina national team", "La Albiceleste"],
    countryAliases: ["Argentine"],
    keyPlayers: ["Lionel Messi", "Lautaro Martinez", "Julian Alvarez", "Emiliano Martinez"],
    excludeTerms: ["club world cup"],
  },
  {
    teamId: "france",
    aliases: ["France", "France national team", "Les Bleus"],
    countryAliases: ["French"],
    keyPlayers: ["Kylian Mbappe", "Antoine Griezmann", "Aurelien Tchouameni", "Mike Maignan"],
    excludeTerms: ["club world cup"],
  },
  {
    teamId: "brazil",
    aliases: ["Brazil", "Brazil national team", "Selecao"],
    countryAliases: ["Brazilian"],
    keyPlayers: ["Vinicius Junior", "Rodrygo", "Neymar", "Endrick", "Alisson"],
    excludeTerms: ["club world cup"],
  },
  {
    teamId: "england",
    aliases: ["England", "England national team", "Three Lions"],
    countryAliases: ["English"],
    keyPlayers: ["Harry Kane", "Jude Bellingham", "Bukayo Saka", "Phil Foden"],
    excludeTerms: ["premier league", "club world cup"],
  },
  {
    teamId: "spain",
    aliases: ["Spain", "Spain national team", "La Roja"],
    countryAliases: ["Spanish"],
    keyPlayers: ["Lamine Yamal", "Pedri", "Nico Williams", "Rodri"],
    excludeTerms: ["la liga", "club world cup"],
  },
  {
    teamId: "germany",
    aliases: ["Germany", "Germany national team", "Die Mannschaft"],
    countryAliases: ["German"],
    keyPlayers: ["Jamal Musiala", "Florian Wirtz", "Kai Havertz", "Antonio Rudiger"],
    excludeTerms: ["bundesliga", "club world cup"],
  },
  {
    teamId: "portugal",
    aliases: ["Portugal", "Portugal national team"],
    countryAliases: ["Portuguese"],
    keyPlayers: ["Cristiano Ronaldo", "Bruno Fernandes", "Bernardo Silva", "Ruben Dias"],
    excludeTerms: ["club world cup"],
  },
  {
    teamId: "netherlands",
    aliases: ["Netherlands", "Netherlands national team", "Dutch national team", "Oranje"],
    countryAliases: ["Dutch"],
    keyPlayers: ["Virgil van Dijk", "Cody Gakpo", "Frenkie de Jong", "Xavi Simons"],
    excludeTerms: ["eredivisie", "club world cup"],
  },
  {
    teamId: "italy",
    aliases: ["Italy", "Italy national team", "Azzurri"],
    countryAliases: ["Italian"],
    keyPlayers: ["Gianluigi Donnarumma", "Federico Chiesa", "Nicolo Barella", "Alessandro Bastoni"],
    excludeTerms: ["serie a", "club world cup"],
  },
  {
    teamId: "belgium",
    aliases: ["Belgium", "Belgium national team", "Red Devils"],
    countryAliases: ["Belgian"],
    keyPlayers: ["Kevin De Bruyne", "Romelu Lukaku", "Jeremy Doku", "Thibaut Courtois"],
    excludeTerms: ["club world cup"],
  },
  {
    teamId: "uruguay",
    aliases: ["Uruguay", "Uruguay national team", "La Celeste"],
    countryAliases: ["Uruguayan"],
    keyPlayers: ["Federico Valverde", "Darwin Nunez", "Ronald Araujo", "Luis Suarez"],
    excludeTerms: ["club world cup"],
  },
  {
    teamId: "croatia",
    aliases: ["Croatia", "Croatia national team"],
    countryAliases: ["Croatian"],
    keyPlayers: ["Luka Modric", "Mateo Kovacic", "Josko Gvardiol", "Andrej Kramaric"],
    excludeTerms: ["club world cup"],
  },
  {
    teamId: "usa",
    aliases: ["United States", "USA", "USMNT", "United States men's national team"],
    countryAliases: ["American"],
    keyPlayers: ["Christian Pulisic", "Weston McKennie", "Tyler Adams", "Gio Reyna"],
    excludeTerms: ["mls", "club world cup"],
  },
  {
    teamId: "mexico",
    aliases: ["Mexico", "Mexico national team", "El Tri"],
    countryAliases: ["Mexican"],
    keyPlayers: ["Santiago Gimenez", "Hirving Lozano", "Edson Alvarez", "Guillermo Ochoa"],
    excludeTerms: ["liga mx", "club world cup"],
  },
  {
    teamId: "japan",
    aliases: ["Japan", "Japan national team", "Samurai Blue"],
    countryAliases: ["Japanese"],
    keyPlayers: ["Takefusa Kubo", "Kaoru Mitoma", "Wataru Endo", "Takumi Minamino"],
    excludeTerms: ["j league", "club world cup"],
  },
  {
    teamId: "morocco",
    aliases: ["Morocco", "Morocco national team", "Atlas Lions"],
    countryAliases: ["Moroccan"],
    keyPlayers: ["Achraf Hakimi", "Hakim Ziyech", "Yassine Bounou", "Sofyan Amrabat"],
    excludeTerms: ["club world cup"],
  },
  {
    teamId: "colombia",
    aliases: ["Colombia", "Colombia national team", "Los Cafeteros"],
    countryAliases: ["Colombian"],
    keyPlayers: ["Luis Diaz", "James Rodriguez", "Jhon Duran", "Davinson Sanchez"],
    excludeTerms: ["club world cup"],
  },
  {
    teamId: "denmark",
    aliases: ["Denmark", "Denmark national team", "Danish national team"],
    countryAliases: ["Danish"],
    keyPlayers: ["Christian Eriksen", "Rasmus Hojlund", "Pierre-Emile Hojbjerg", "Joachim Andersen"],
    excludeTerms: ["club world cup"],
  },
  {
    teamId: "switzerland",
    aliases: ["Switzerland", "Switzerland national team", "Swiss national team"],
    countryAliases: ["Swiss"],
    keyPlayers: ["Granit Xhaka", "Manuel Akanji", "Xherdan Shaqiri", "Breel Embolo"],
    excludeTerms: ["swiss league", "club world cup"],
  },
  {
    teamId: "senegal",
    aliases: ["Senegal", "Senegal national team", "Lions of Teranga"],
    countryAliases: ["Senegalese"],
    keyPlayers: ["Sadio Mane", "Kalidou Koulibaly", "Nicolas Jackson", "Edouard Mendy"],
    excludeTerms: ["club world cup"],
  },
  {
    teamId: "south-korea",
    aliases: ["South Korea", "Korea Republic", "South Korea national team"],
    countryAliases: ["Korean"],
    keyPlayers: ["Son Heung-min", "Kim Min-jae", "Lee Kang-in", "Hwang Hee-chan"],
    excludeTerms: ["k league", "club world cup"],
  },
  {
    teamId: "australia",
    aliases: ["Australia", "Australia national team", "Socceroos"],
    countryAliases: ["Australian"],
    keyPlayers: ["Mathew Ryan", "Jackson Irvine", "Craig Goodwin", "Harry Souttar"],
    excludeTerms: ["a league", "club world cup"],
  },
  {
    teamId: "canada",
    aliases: ["Canada", "Canada national team", "Canadian men's national team"],
    countryAliases: ["Canadian"],
    keyPlayers: ["Alphonso Davies", "Jonathan David", "Tajon Buchanan", "Stephen Eustaquio"],
    excludeTerms: ["mls", "club world cup"],
  },
  {
    teamId: "ghana",
    aliases: ["Ghana", "Ghana national team", "Black Stars"],
    countryAliases: ["Ghanaian"],
    keyPlayers: ["Mohammed Kudus", "Thomas Partey", "Inaki Williams", "Jordan Ayew"],
    excludeTerms: ["club world cup"],
  },
];

export function getTeamNewsQueryConfig(teamId: Team["id"]): TeamNewsQueryConfig | undefined {
  return teamNewsQueryConfig.find((config) => config.teamId === teamId);
}
