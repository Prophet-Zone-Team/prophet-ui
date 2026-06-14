import React from "react";

import type { GameShareCardData, GameShareCardRow } from "./build-game-share-card-data";

export const GAME_SHARE_CARD_DIMENSIONS = {
  width: 800,
  height: 418,
};

export const GAME_SHARE_CARD_RENDER_SCALE = 2;

export function getGameShareCardRenderDimensions() {
  return {
    width: GAME_SHARE_CARD_DIMENSIONS.width * GAME_SHARE_CARD_RENDER_SCALE,
    height: GAME_SHARE_CARD_DIMENSIONS.height * GAME_SHARE_CARD_RENDER_SCALE,
  };
}

const LEFT_PANEL_WIDTH = 416;
const RIGHT_PANEL_LEFT = LEFT_PANEL_WIDTH;

// Source asset: public/referral/prophet-logo.png (562x186)
const PROPHET_LOGO_SOURCE_ASPECT = 186 / 562;
const PROPHET_LOGO_WIDTH = 300;
const PROPHET_LOGO_HEIGHT = Math.round(
  PROPHET_LOGO_WIDTH * PROPHET_LOGO_SOURCE_ASPECT,
);
const PROPHET_LOGO_LEFT = 31;
const PROPHET_LOGO_TOP = 28;

const LARGE_FLAG_SIZE = 270;
const LARGE_FLAG_GAP = 24;
const LARGE_FLAG_TOP = 107;
const LARGE_FLAGS_GROUP_WIDTH = LARGE_FLAG_SIZE * 2 + LARGE_FLAG_GAP;
const LARGE_FLAG_HOME_LEFT = (LEFT_PANEL_WIDTH - LARGE_FLAGS_GROUP_WIDTH) / 2;
const LARGE_FLAG_AWAY_LEFT =
  LARGE_FLAG_HOME_LEFT + LARGE_FLAG_SIZE + LARGE_FLAG_GAP;

const COLORS = {
  black: "#000000",
  white: "#FFFFFF",
  muted: "#909090",
  green: "#65AF14",
  red: "#FF674B",
  divider: "#E9E9E9",
  placeholder: "#2A2A2A",
};

function scaleValue(value: number, scale: number): number {
  return Math.round(value * scale);
}

function FlagImage({
  dataUrl,
  size,
  borderRadius,
  left,
  top,
}: {
  dataUrl?: string;
  size: number;
  borderRadius: number;
  left: number;
  top: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: size,
        height: size,
        borderRadius,
        overflow: "hidden",
        backgroundColor: dataUrl ? "transparent" : COLORS.placeholder,
        display: "flex",
      }}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt=""
          width={size}
          height={size}
          style={{
            width: size,
            height: size,
            objectFit: "cover",
          }}
        />
      ) : null}
    </div>
  );
}

function PricePill({
  label,
  backgroundColor,
  left,
  top,
  width,
  height,
  fontSize,
  borderRadius,
}: {
  label: string;
  backgroundColor: string;
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
  borderRadius: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        borderRadius,
        backgroundColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          color: COLORS.white,
          fontSize,
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function OutcomeRow({
  row,
  top,
  scale,
}: {
  row: GameShareCardRow;
  top: number;
  scale: number;
}) {
  const s = (value: number) => scaleValue(value, scale);

  return (
    <div style={{ display: "contents" }}>
      <span
        style={{
          position: "absolute",
          left: s(445),
          top: s(top + 4),
          fontSize: s(16),
          fontWeight: 500,
          color: COLORS.black,
        }}
      >
        {row.outcomeLabel}
      </span>
      <span
        style={{
          position: "absolute",
          left: s(550),
          top: s(top + 4),
          fontSize: s(16),
          fontWeight: 500,
          color: COLORS.black,
        }}
      >
        {row.chanceLabel}
      </span>
      <PricePill
        label={row.yesPriceLabel}
        backgroundColor={COLORS.green}
        left={s(627)}
        top={s(top)}
        width={s(75)}
        height={s(32)}
        fontSize={s(14)}
        borderRadius={s(6)}
      />
      <PricePill
        label={row.noPriceLabel}
        backgroundColor={COLORS.red}
        left={s(708)}
        top={s(top)}
        width={s(75)}
        height={s(32)}
        fontSize={s(14)}
        borderRadius={s(6)}
      />
    </div>
  );
}

export function GameShareCard({
  data,
  scale = 1,
}: {
  data: GameShareCardData;
  scale?: number;
}) {
  const [homeRow, drawRow, awayRow] = data.rows;
  const s = (value: number) => scaleValue(value, scale);
  const cardWidth = s(GAME_SHARE_CARD_DIMENSIONS.width);
  const cardHeight = s(GAME_SHARE_CARD_DIMENSIONS.height);

  return (
    <div
      style={{
        width: cardWidth,
        height: cardHeight,
        position: "relative",
        display: "flex",
        backgroundColor: COLORS.white,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: s(LEFT_PANEL_WIDTH),
          height: cardHeight,
          overflow: "hidden",
          backgroundColor: COLORS.black,
          display: "flex",
        }}
      >
        <img
          src={data.prophetLogoDataUrl}
          alt=""
          width={s(PROPHET_LOGO_WIDTH)}
          height={s(PROPHET_LOGO_HEIGHT)}
          style={{
            position: "absolute",
            left: s(PROPHET_LOGO_LEFT),
            top: s(PROPHET_LOGO_TOP),
            width: s(PROPHET_LOGO_WIDTH),
            height: s(PROPHET_LOGO_HEIGHT),
            objectFit: "contain",
            objectPosition: "left top",
          }}
        />

        <FlagImage
          dataUrl={data.home.logoDataUrl}
          size={s(LARGE_FLAG_SIZE)}
          borderRadius={s(30)}
          left={s(LARGE_FLAG_HOME_LEFT)}
          top={s(LARGE_FLAG_TOP)}
        />
        <FlagImage
          dataUrl={data.away.logoDataUrl}
          size={s(LARGE_FLAG_SIZE)}
          borderRadius={s(30)}
          left={s(LARGE_FLAG_AWAY_LEFT)}
          top={s(LARGE_FLAG_TOP)}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: s(RIGHT_PANEL_LEFT),
          top: 0,
          width: cardWidth - s(RIGHT_PANEL_LEFT),
          height: cardHeight,
          backgroundColor: COLORS.white,
        }}
      />

      <FlagImage
        dataUrl={data.home.logoDataUrl}
        size={s(36)}
        borderRadius={s(6)}
        left={s(RIGHT_PANEL_LEFT + 23)}
        top={s(30)}
      />
      <FlagImage
        dataUrl={data.away.logoDataUrl}
        size={s(36)}
        borderRadius={s(6)}
        left={s(RIGHT_PANEL_LEFT + 67)}
        top={s(30)}
      />

      <div
        style={{
          position: "absolute",
          left: s(439),
          top: s(27),
          width: s(340),
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <span
          style={{
            fontSize: s(12),
            fontWeight: 400,
            color: COLORS.muted,
          }}
        >
          {data.timestamp}
        </span>
      </div>

      <span
        style={{
          position: "absolute",
          left: s(RIGHT_PANEL_LEFT + 23),
          top: s(81),
          width: s(338),
          fontSize: s(30),
          fontWeight: 600,
          color: COLORS.black,
          lineHeight: 1.5,
        }}
      >
        {data.title}
      </span>

      <span
        style={{
          position: "absolute",
          left: s(439),
          top: s(214),
          fontSize: s(14),
          fontWeight: 500,
          color: COLORS.muted,
        }}
      >
        Outcome
      </span>
      <span
        style={{
          position: "absolute",
          left: s(544),
          top: s(214),
          fontSize: s(14),
          fontWeight: 500,
          color: COLORS.muted,
        }}
      >
        Chance
      </span>

      <div
        style={{
          position: "absolute",
          left: s(439),
          top: s(244),
          width: s(340),
          height: Math.max(s(1), 1),
          backgroundColor: COLORS.divider,
        }}
      />

      {homeRow ? <OutcomeRow row={homeRow} top={260} scale={scale} /> : null}
      {drawRow ? <OutcomeRow row={drawRow} top={308} scale={scale} /> : null}
      {awayRow ? <OutcomeRow row={awayRow} top={352} scale={scale} /> : null}
    </div>
  );
}
