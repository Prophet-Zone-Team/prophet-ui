import {
  BRACKET_FINAL_FORK_WIDTH,
  BRACKET_TROPHY_LINE_WIDTH,
  BRACKET_TROPHY_VERTICAL_SPAN,
  buildFinalTrophyConnectorSpec
} from "./bracket-layout";

type FinalTrophyConnectorSpec = {
  sourceCenters: [number, number];
  targetCenter: number;
};

function FinalTrophyConnectorSvg({
  spec,
  forkWidth,
  hLineWidth,
  verticalSpan
}: {
  spec: FinalTrophyConnectorSpec;
  forkWidth: number;
  hLineWidth: number;
  verticalSpan: number;
}) {
  const [y1, y2] = spec.sourceCenters;
  const y3 = spec.targetCenter;
  const halfVertical = verticalSpan / 2;
  const minY = Math.min(y1, y2, y3 - halfVertical);
  const maxY = Math.max(y1, y2, y3 + halfVertical);
  const height = maxY - minY + 2;
  const forkX = forkWidth * 0.48;
  const hEnd = forkWidth + hLineWidth;
  const rel = (y: number) => y - minY + 1;

  return (
    <svg
      width={hEnd + 1}
      height={height}
      viewBox={`0 0 ${hEnd + 1} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="block overflow-visible"
      aria-hidden
    >
      <path
        d={`M 0 ${rel(y1)} H ${forkX} V ${rel(y3)} H ${hEnd}`}
        stroke="#909090"
        strokeWidth="1"
      />
      <path
        d={`M 0 ${rel(y2)} H ${forkX} V ${rel(y3)}`}
        stroke="#909090"
        strokeWidth="1"
      />
      <path
        d={`M ${hEnd} ${rel(y3 - halfVertical)} V ${rel(y3 + halfVertical)}`}
        stroke="#909090"
        strokeWidth="1"
      />
    </svg>
  );
}

export function FinalTrophyConnector() {
  const spec = buildFinalTrophyConnectorSpec();
  const [y1, y2] = spec.sourceCenters;
  const y3 = spec.targetCenter;
  const halfVertical = BRACKET_TROPHY_VERTICAL_SPAN / 2;
  const minY = Math.min(y1, y2, y3 - halfVertical);
  const maxY = Math.max(y1, y2, y3 + halfVertical);
  const blockHeight = maxY - minY + 2;

  return (
    <div
      className="absolute left-0 overflow-visible"
      style={{
        top: minY,
        width: BRACKET_FINAL_FORK_WIDTH + BRACKET_TROPHY_LINE_WIDTH + 1,
        height: blockHeight
      }}
      aria-hidden
    >
      <FinalTrophyConnectorSvg
        spec={spec}
        forkWidth={BRACKET_FINAL_FORK_WIDTH}
        hLineWidth={BRACKET_TROPHY_LINE_WIDTH}
        verticalSpan={BRACKET_TROPHY_VERTICAL_SPAN}
      />
    </div>
  );
}
