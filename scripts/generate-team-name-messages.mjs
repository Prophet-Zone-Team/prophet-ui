import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TEAMS_INDEX = path.join(ROOT, "src/data/teams/index.ts");
const MESSAGES_DIR = path.join(ROOT, "src/i18n/messages");

const TEAM_TRANSLATIONS = {
  "zh-TW": {
    ALG: "阿爾及利亞",
    ARG: "阿根廷",
    AUS: "澳大利亚",
    AUT: "奧地利",
    BEL: "比利時",
    BIH: "波士尼亞與赫塞哥維納",
    BRA: "巴西",
    CAN: "加拿大",
    CVI: "佛得角",
    COL: "哥倫比亞",
    CDR: "剛果民主共和國",
    HRV: "克罗地亚",
    CW: "库拉索",
    CZE: "捷克",
    ECU: "厄瓜多尔",
    EGY: "埃及",
    ENG: "英格蘭",
    FRA: "法國",
    GER: "德國",
    GHA: "加納",
    HAI: "海地",
    IRN: "伊朗",
    IRQ: "伊拉克",
    CIV: "科特迪瓦",
    JPN: "日本",
    JOR: "約旦",
    MEX: "墨西哥",
    MAR: "摩洛哥",
    NLD: "荷蘭",
    NZL: "新西兰",
    NOR: "挪威",
    PAN: "巴拿馬",
    PAR: "巴拉圭",
    PRT: "葡萄牙",
    QAT: "卡達",
    KSA: "沙烏地阿拉伯",
    SCO: "蘇格蘭",
    SEN: "塞內加爾",
    RSA: "南非",
    KOR: "南韓",
    ESP: "西班牙",
    SWE: "瑞典",
    CHE: "瑞士",
    TUN: "突尼斯",
    TUR: "土耳其",
    URY: "烏拉圭",
    USA: "美國",
    UZB: "烏茲別克"
  },
  ko: {
    ALG: "알제리",
    ARG: "아르헨티나",
    AUS: "호주",
    AUT: "오스트리아",
    BEL: "벨기에",
    BIH: "보스니아 헤르체고비나",
    BRA: "브라질",
    CAN: "캐나다",
    CVI: "보베르데",
    COL: "콜롬비아",
    CDR: "콩고 민주 공화국",
    HRV: "크로아티아",
    CW: "퀴라소",
    CZE: "체코",
    ECU: "에콰도르",
    EGY: "이집트",
    ENG: "잉글랜드",
    FRA: "프랑스",
    GER: "독일",
    GHA: "가나",
    HAI: "아이티",
    IRN: "이란",
    IRQ: "이라크",
    CIV: "코트디부아르",
    JPN: "일본",
    JOR: "요르단",
    MEX: "멕시코",
    MAR: "모로코",
    NLD: "네덜란드",
    NZL: "뉴질랜드",
    NOR: "노르웨이",
    PAN: "파나마",
    PAR: "파라과이",
    PRT: "포르투갈",
    QAT: "카타르",
    KSA: "사우디아라비아",
    SCO: "스코틀랜드",
    SEN: "세네갈",
    RSA: "남아프리카",
    KOR: "대한민국",
    ESP: "스페인",
    SWE: "스웨덴",
    CHE: "스위스",
    TUN: "튀니지",
    TUR: "튀르키예",
    URY: "우루과이",
    USA: "미국",
    UZB: "우즈베키스탄"
  },
  ja: {
    ALG: "アルジェリア",
    ARG: "アルゼンチン",
    AUS: "オーストラリア",
    AUT: "オーストリア",
    BEL: "ベルギー",
    BIH: "ボスニア・ヘルツェゴビナ",
    BRA: "ブラジル",
    CAN: "カナダ",
    CVI: "カーボベルデ",
    COL: "コロンビア",
    CDR: "コンゴ民主共和国",
    HRV: "クロアチア",
    CW: "キュラソー",
    CZE: "チェコ",
    ECU: "エクアドル",
    EGY: "エジプト",
    ENG: "イングランド",
    FRA: "フランス",
    GER: "ドイツ",
    GHA: "ガーナ",
    HAI: "ハイチ",
    IRN: "イラン",
    IRQ: "イラク",
    CIV: "コートジボワール",
    JPN: "日本",
    JOR: "ヨルダン",
    MEX: "メキシコ",
    MAR: "モロッコ",
    NLD: "オランダ",
    NZL: "ニュージーランド",
    NOR: "ノルウェー",
    PAN: "パナマ",
    PAR: "パラグアイ",
    PRT: "ポルトガル",
    QAT: "カタール",
    KSA: "サウジアラビア",
    SCO: "スコットランド",
    SEN: "セネガル",
    RSA: "南アフリカ",
    KOR: "韓国",
    ESP: "スペイン",
    SWE: "スウェーデン",
    CHE: "スイス",
    TUN: "チュニジア",
    TUR: "トルコ",
    URY: "ウルグアイ",
    USA: "アメリカ",
    UZB: "ウズベキスタン"
  },
  es: {
    ALG: "Argelia",
    ARG: "Argentina",
    AUS: "Australia",
    AUT: "Austria",
    BEL: "Bélgica",
    BIH: "Bosnia y Herzegovina",
    BRA: "Brasil",
    CAN: "Canadá",
    CVI: "Cabo Verde",
    COL: "Colombia",
    CDR: "RD del Congo",
    HRV: "Croacia",
    CW: "Curazao",
    CZE: "Chequia",
    ECU: "Ecuador",
    EGY: "Egipto",
    ENG: "Inglaterra",
    FRA: "Francia",
    GER: "Alemania",
    GHA: "Ghana",
    HAI: "Haití",
    IRN: "Irán",
    IRQ: "Irak",
    CIV: "Costa de Marfil",
    JPN: "Japón",
    JOR: "Jordania",
    MEX: "México",
    MAR: "Marruecos",
    NLD: "Países Bajos",
    NZL: "Nueva Zelanda",
    NOR: "Noruega",
    PAN: "Panamá",
    PAR: "Paraguay",
    PRT: "Portugal",
    QAT: "Catar",
    KSA: "Arabia Saudita",
    SCO: "Escocia",
    SEN: "Senegal",
    RSA: "Sudáfrica",
    KOR: "Corea del Sur",
    ESP: "España",
    SWE: "Suecia",
    CHE: "Suiza",
    TUN: "Túnez",
    TUR: "Turquía",
    URY: "Uruguay",
    USA: "Estados Unidos",
    UZB: "Uzbequistán"
  },
  pt: {
    ALG: "Argélia",
    ARG: "Argentina",
    AUS: "Austrália",
    AUT: "Áustria",
    BEL: "Bélgica",
    BIH: "Bósnia e Herzegovina",
    BRA: "Brasil",
    CAN: "Canadá",
    CVI: "Cabo Verde",
    COL: "Colômbia",
    CDR: "RD do Congo",
    HRV: "Croácia",
    CW: "Curaçao",
    CZE: "Tchéquia",
    ECU: "Equador",
    EGY: "Egito",
    ENG: "Inglaterra",
    FRA: "França",
    GER: "Alemanha",
    GHA: "Gana",
    HAI: "Haiti",
    IRN: "Irã",
    IRQ: "Iraque",
    CIV: "Costa do Marfim",
    JPN: "Japão",
    JOR: "Jordânia",
    MEX: "México",
    MAR: "Marrocos",
    NLD: "Países Baixos",
    NZL: "Nova Zelândia",
    NOR: "Noruega",
    PAN: "Panamá",
    PAR: "Paraguai",
    PRT: "Portugal",
    QAT: "Catar",
    KSA: "Arábia Saudita",
    SCO: "Escócia",
    SEN: "Senegal",
    RSA: "África do Sul",
    KOR: "Coreia do Sul",
    ESP: "Espanha",
    SWE: "Suécia",
    CHE: "Suíça",
    TUN: "Tunísia",
    TUR: "Turquia",
    URY: "Uruguai",
    USA: "Estados Unidos",
    UZB: "Uzbequistão"
  },
  ru: {
    ALG: "Алжир",
    ARG: "Аргентина",
    AUS: "Австралия",
    AUT: "Австрия",
    BEL: "Бельгия",
    BIH: "Босния и Герцеговина",
    BRA: "Бразилия",
    CAN: "Канада",
    CVI: "Кабо-Верде",
    COL: "Колумбия",
    CDR: "ДР Конго",
    HRV: "Хорватия",
    CW: "Кюрасао",
    CZE: "Чехия",
    ECU: "Эквадор",
    EGY: "Египет",
    ENG: "Англия",
    FRA: "Франция",
    GER: "Германия",
    GHA: "Гана",
    HAI: "Гаити",
    IRN: "Иран",
    IRQ: "Ирак",
    CIV: "Кот-д'Ивуар",
    JPN: "Япония",
    JOR: "Иордания",
    MEX: "Мексика",
    MAR: "Марокко",
    NLD: "Нидерланды",
    NZL: "Новая Зеландия",
    NOR: "Норвегия",
    PAN: "Панама",
    PAR: "Парагвай",
    PRT: "Португалия",
    QAT: "Катар",
    KSA: "Саудовская Аравия",
    SCO: "Шотландия",
    SEN: "Сенегал",
    RSA: "ЮАР",
    KOR: "Южная Корея",
    ESP: "Испания",
    SWE: "Швеция",
    CHE: "Швейцария",
    TUN: "Тунис",
    TUR: "Турция",
    URY: "Уругвай",
    USA: "США",
    UZB: "Узбекистан"
  }
};

function extractWorldCupTeams() {
  const src = fs.readFileSync(TEAMS_INDEX, "utf8");
  const entries = [];
  const blockRe = /^\s+([^:{]+):\s*\{([\s\S]*?)^\s+\},/gm;
  let match;

  while ((match = blockRe.exec(src))) {
    const body = match[2];
    const name = body.match(/name:\s*"([^"]+)"/)?.[1];
    const abbr = body.match(/abbreviation:\s*"([^"]+)"/)?.[1];
    const visible = !body.match(/visible:\s*false/);
    const isWorldCupTeam = body.includes("isWorldCupTeam: true");

    if (!name || !abbr || !isWorldCupTeam || !visible) {
      continue;
    }

    const code = abbr.toLowerCase() === "kr" ? "KOR" : abbr.toUpperCase();

    if (entries.some((entry) => entry.code === code)) {
      continue;
    }

    entries.push({ code, name });
  }

  return entries.sort((left, right) => left.name.localeCompare(right.name));
}

const TEAM_REGIONS = {
  en: {
    africa: "Africa",
    asia: "Asia",
    europe: "Europe",
    northAmerica: "North America",
    southAmerica: "South America"
  },
  es: {
    africa: "África",
    asia: "Asia",
    europe: "Europa",
    northAmerica: "América del Norte",
    southAmerica: "América del Sur"
  },
  pt: {
    africa: "África",
    asia: "Ásia",
    europe: "Europa",
    northAmerica: "América do Norte",
    southAmerica: "América do Sul"
  },
  ko: {
    africa: "아프리카",
    asia: "아시아",
    europe: "유럽",
    northAmerica: "북미",
    southAmerica: "남미"
  },
  ja: {
    africa: "アフリカ",
    asia: "アジア",
    europe: "ヨーロッパ",
    northAmerica: "北アメリカ",
    southAmerica: "南アメリカ"
  },
  "zh-TW": {
    africa: "非洲",
    asia: "亞洲",
    europe: "歐洲",
    northAmerica: "北美洲",
    southAmerica: "南美洲"
  },
  ru: {
    africa: "Африка",
    asia: "Азия",
    europe: "Европа",
    northAmerica: "Северная Америка",
    southAmerica: "Южная Америка"
  }
};

function buildTeamNames(locale, teams) {
  const map = locale === "en" ? null : TEAM_TRANSLATIONS[locale];
  const teamNames = {};

  for (const team of teams) {
    teamNames[team.code] = map?.[team.code] ?? team.name;
  }

  return teamNames;
}

const teams = extractWorldCupTeams();
const locales = ["en", "es", "pt", "ko", "ja", "zh-TW", "ru"];

for (const locale of locales) {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const messages = JSON.parse(fs.readFileSync(filePath, "utf8"));
  messages.teamNames = buildTeamNames(locale, teams);
  messages.teamRegions = TEAM_REGIONS[locale];
  fs.writeFileSync(filePath, `${JSON.stringify(messages, null, 2)}\n`);
  console.log(
    `Updated teamNames/teamRegions in ${filePath} (${Object.keys(messages.teamNames).length} teams)`
  );
}
