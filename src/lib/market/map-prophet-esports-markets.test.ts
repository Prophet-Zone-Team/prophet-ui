import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildEsportsMarketSections,
  collectEsportsFixtureOutcomes,
  esportsMatchWinnerToMoneylineOutcomes,
  mapProphetEsportsMarkets,
  resolveDefaultEsportsOutcome,
  resolveEsportsOutcomePair,
} from "@/lib/market/map-prophet-esports-markets";
import type { ProphetPolyMarketMarket } from "@/types/prophet-api";

const FIXTURE_SLUG = "lol-blg-hle1-2026-07-09";
const HOME_NAME = "Bilibili Gaming";
const AWAY_NAME = "Hanwha Life Esports";

const sampleMarkets: ProphetPolyMarketMarket[] = [
  {
    slug: "lol-blg-hle1-2026-07-09-game1",
    groupItemTitle: "Game 1 Winner",
    outcomePrices: '["0.425", "0.575"]',
    clobTokenIds:
      '["34899681629975596680823272511407820643214154601485383259115476523364469117569", "92155896711226508531656306422645708487529460510087463062559535463800385306518"]',
    conditionId:
      "0x86d9c29b6bd497d00ea0bfd1341caf040bbf7e04bc603a55f0353f2594f0f17c",
    volume: "56387.941254",
    acceptingOrders: true,
  },
  {
    slug: "lol-blg-hle1-2026-07-09-game2",
    groupItemTitle: "Game 2 Winner",
    outcomePrices: '["0.445", "0.555"]',
    clobTokenIds:
      '["79431908131356508084433457755458324207648598535865918981254999649478291541970", "9976606108943452206320557993220219533385445389795366122925156864356407411888"]',
    conditionId:
      "0x6869e94f6f21fbe1d35af01120f5e2274389f1ff3e01eabf33a695064cc7b96f",
    volume: "6214.189879",
    acceptingOrders: true,
  },
  {
    slug: FIXTURE_SLUG,
    groupItemTitle: "Match Winner",
    outcomePrices: '["0.385", "0.615"]',
    clobTokenIds:
      '["54865409545970127818483222224309761077922946344974606824700577010363479992269", "39577055225479084916752164627874450289163320947168445560952025705247541157415"]',
    conditionId:
      "0x487187034dadebc71441bd70c34351eb189c12a05c99220eb43be41b919e9261",
    volume: "625487.7947210008",
    acceptingOrders: true,
  },
  {
    slug: "lol-blg-hle1-2026-07-09-total-games-3pt5",
    groupItemTitle: "O/U 3.5 Games",
    outcomePrices: '["0.755", "0.245"]',
    clobTokenIds:
      '["105772344551417825380474009106003614459055668559938606391064417585503503570195", "65630453555225874059225136799815622242901263095742334391293868164641147452333"]',
    conditionId:
      "0x0e4f746ad792519475a6ff2156664b12c4b778db393ce97b754d545f1902e28d",
    volume: "59301.881561",
    acceptingOrders: true,
  },
  {
    slug: "lol-blg-hle1-2026-07-09-total-games-4pt5",
    groupItemTitle: "O/U 4.5 Games",
    outcomePrices: '["0.365", "0.635"]',
    clobTokenIds:
      '["97135882337974045409447242055630544690302673387002162261630431620826481609879", "84543638176246634795694479949292415967201587168795440953509216832820801442832"]',
    conditionId:
      "0x8464a0e2c13507d198ea116a79a9b94f38350b89e8deed6227b7e290a2a6715c",
    volume: "1293.514747",
    acceptingOrders: true,
  },
  {
    slug: "lol-blg-hle1-2026-07-09-game-handicap-home-1pt5",
    groupItemTitle: "Game Handicap: HLE (-1.5) vs Bilibili Gaming (+1.5)",
    outcomePrices: '["0.42", "0.58"]',
    clobTokenIds:
      '["16430081001828036646536785019396476573248754800164959069877107429820214865604", "60423005640815856248983198871051381223856763388341348430379638676082765494912"]',
    conditionId:
      "0x93050e4b3e2e3db11f41a014d37eeec6ee25217f831ac3e4b62f43201e23829c",
    volume: "56673.092478999984",
    acceptingOrders: true,
  },
  {
    slug: "lol-blg-hle1-2026-07-09-game-handicap-home-2pt5",
    groupItemTitle: "Game Handicap: HLE (-2.5) vs Bilibili Gaming (+2.5)",
    outcomePrices: '["0.195", "0.805"]',
    clobTokenIds:
      '["20714589785379964597102511757290896464062201429020842032379228555905788623787", "3904317408008138208270395636767238819364318475482701004285125605645610773114"]',
    conditionId:
      "0x9f08c119fe659ec4f66ec13d020f6409897702aa916b7d29096e47917c29a63f",
    volume: "21567.181637",
    acceptingOrders: true,
  },
  {
    slug: "lol-blg-hle1-2026-07-09-game-handicap-away-1pt5",
    groupItemTitle: "Game Handicap: BLG (-1.5) vs Hanwha Life Esports (+1.5)",
    outcomePrices: '["0.66", "0.34"]',
    clobTokenIds:
      '["11111111111111111111111111111111111111111111111111111111111111111111", "22222222222222222222222222222222222222222222222222222222222222222222"]',
    conditionId:
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    volume: "1200.5",
    acceptingOrders: true,
  },
  {
    slug: "lol-blg-hle1-2026-07-09-game-handicap-away-2pt5",
    groupItemTitle: "Game Handicap: BLG (-2.5) vs Hanwha Life Esports (+2.5)",
    outcomePrices: '["0.41", "0.59"]',
    clobTokenIds:
      '["33333333333333333333333333333333333333333333333333333333333333333333", "44444444444444444444444444444444444444444444444444444444444444444444"]',
    conditionId:
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    volume: "980.25",
    acceptingOrders: true,
  },
  {
    slug: "lol-blg-hle1-2026-07-09-game1-first-blood",
    groupItemTitle: "First Blood in Game 1?",
    outcomePrices: '["0.49", "0.51"]',
    clobTokenIds:
      '["49250446875965926200753489066779511805366536233347009723720472382082016975235", "14956232814756756601949969530984664189545750463842295278035047745298237242916"]',
    conditionId:
      "0xabcb1ef16ac83313ce15fe474e3393995207b2985756198f0bbd0bc31543f7c1",
    volume: "43.261687",
    acceptingOrders: true,
  },
  {
    slug: "lol-blg-hle1-2026-07-09-game1-kill-over-30pt5",
    groupItemTitle: "Total Kills Over/Under 30.5 in Game 1?",
    outcomePrices: '["0.505", "0.495"]',
    clobTokenIds:
      '["31324347433421788764466334047964040983771886515351581522056672263612683750971", "93978503896723617863065637488765132362367918482178105822350161845488780819210"]',
    conditionId:
      "0xab9d1f1549ab3ac350e4a43e0ecc9639b19045960bc7f2b068be5085348835d3",
    volume: "59653.869494",
    acceptingOrders: true,
  },
  {
    slug: "lol-blg-hle1-2026-07-09-game1-kill-over-33pt5",
    groupItemTitle: "Total Kills Over/Under 33.5 in Game 1?",
    outcomePrices: '["0.385", "0.615"]',
    clobTokenIds:
      '["90868713806985294385377472550166482823375969271527980025702271677294458222385", "82939800368144039584342396225320147589413574752456521647721967879495962069108"]',
    conditionId:
      "0x473c95e3096c3afb7bb1e6b1cac459f7715c900a40db50623aa854cca3650b44",
    volume: "976.014543",
    acceptingOrders: true,
  },
  {
    slug: "lol-blg-hle1-2026-07-09-game1-odd-even-total-kills",
    groupItemTitle: "Odd/Even Total Kills?",
    outcomePrices: '["0.505", "0.495"]',
    clobTokenIds:
      '["5160484233756751506779735584777865332478178685520139961069512078495241009110", "105696915610897984879501120469092034193624379217828791478725457401210359577772"]',
    conditionId:
      "0x54f80098abcb8dd52a13b494aed6371831751ecf73090819b86e47cddb6032d1",
    volume: "11.764702",
    acceptingOrders: true,
  },
  {
    slug: "lol-blg-hle1-2026-07-09-game1-both-teams-slay-baron",
    groupItemTitle: "Both Teams Slay Baron Nashor",
    outcomePrices: '["0.485", "0.515"]',
    clobTokenIds:
      '["62207740541464655235182797356850360115168351794489964526273001639440921285326", "3910670180433296702512885727650124975315553127063859894753825944809747232376"]',
    conditionId:
      "0xa8c989b1a713b70497ffa94658559d9688db51aad93cad8425f5484cbcec7a34",
    acceptingOrders: true,
  },
];

describe("map-prophet-esports-markets", () => {
  it("filters unsupported props and classifies supported LOL markets", () => {
    const cards = mapProphetEsportsMarkets(
      sampleMarkets,
      HOME_NAME,
      AWAY_NAME,
      FIXTURE_SLUG,
    );

    assert.equal(cards.length, 13);
    assert.ok(!cards.some((card) => card.title.includes("Baron")));
    assert.ok(cards.some((card) => card.marketKind === "first_blood"));
    assert.ok(cards.some((card) => card.marketKind === "kill_total"));
    assert.ok(cards.some((card) => card.marketKind === "odd_even_kills"));
  });

  it("builds grouped sections with totals-style line selectors", () => {
    const cards = mapProphetEsportsMarkets(
      sampleMarkets,
      HOME_NAME,
      AWAY_NAME,
      FIXTURE_SLUG,
    );
    const sections = buildEsportsMarketSections(cards);

    const series = sections.find((section) => section.id === "series_lines");
    assert.ok(series);
    assert.deepEqual(
      series?.groups.map((group) => group.kind),
      ["moneyline", "game_winner", "game_handicap", "total_games"],
    );

    const moneyline = series?.groups.find((group) => group.kind === "moneyline");
    assert.equal(moneyline?.titleKey, "esportsMoneyline");

    const gameWinner = series?.groups.find((group) => group.kind === "game_winner");
    assert.equal(gameWinner?.lineOptions.length, 2);
    assert.deepEqual(
      gameWinner?.lineOptions.map((option) => option.key),
      ["1", "2"],
    );

    const handicap = series?.groups.find((group) => group.kind === "game_handicap");
    assert.equal(handicap?.lineOptions.length, 4);
    assert.deepEqual(
      handicap?.lineOptions.map((option) => option.key),
      ["home:1.5", "home:2.5", "away:1.5", "away:2.5"],
    );
    assert.deepEqual(
      handicap?.lineOptions.map((option) => option.label),
      ["1.5", "2.5", "1.5", "2.5"],
    );

    const homeHandicapAwayLine = handicap?.outcomesByLine["home:1.5"];
    assert.deepEqual(
      homeHandicapAwayLine?.map((outcome) => outcome.side),
      ["away", "home"],
    );

    const awayHandicapHomeLine = handicap?.outcomesByLine["away:1.5"];
    assert.deepEqual(
      awayHandicapHomeLine?.map((outcome) => outcome.side),
      ["home", "away"],
    );

    const totalGames = series?.groups.find((group) => group.kind === "total_games");
    assert.equal(totalGames?.lineOptions.length, 2);
    assert.deepEqual(
      totalGames?.lineOptions.map((option) => Number(option.key)),
      [3.5, 4.5],
    );

    const game1 = sections.find((section) => section.id === "game_1");
    assert.ok(game1);
    assert.deepEqual(
      game1?.groups.map((group) => group.kind),
      ["first_blood", "kill_totals", "odd_even_kills"],
    );

    const killTotals = game1?.groups.find((group) => group.kind === "kill_totals");
    assert.equal(killTotals?.lineOptions.length, 2);
    assert.deepEqual(
      killTotals?.lineOptions.map((option) => Number(option.key)),
      [30.5, 33.5],
    );
  });

  it("converts match winner to moneyline outcomes", () => {
    const cards = mapProphetEsportsMarkets(
      sampleMarkets,
      HOME_NAME,
      AWAY_NAME,
      FIXTURE_SLUG,
    );
    const moneyline = esportsMatchWinnerToMoneylineOutcomes(cards);

    assert.equal(moneyline.length, 2);
    assert.deepEqual(
      moneyline.map((outcome) => outcome.side),
      ["home", "away"],
    );
  });

  it("resolves default and paired esports outcomes from sections", () => {
    const cards = mapProphetEsportsMarkets(
      sampleMarkets,
      HOME_NAME,
      AWAY_NAME,
      FIXTURE_SLUG,
    );
    const sections = buildEsportsMarketSections(cards);
    const defaultOutcome = resolveDefaultEsportsOutcome(sections, cards);
    const allOutcomes = collectEsportsFixtureOutcomes(sections, cards);

    assert.equal(defaultOutcome?.side, "home");
    assert.ok(allOutcomes.length >= 20);

    const moneylineGroup = sections[0]?.groups[0];
    const homeOutcome = moneylineGroup?.outcomesByLine._default?.[0];
    assert.ok(homeOutcome);

    const pair = resolveEsportsOutcomePair(homeOutcome, sections, cards);
    assert.ok(pair);
    assert.equal(pair.yesOutcome.side, "home");
    assert.equal(pair.noOutcome.side, "away");
  });
});
