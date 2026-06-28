import { cn } from "@/lib/cn";

import { CONNECTOR_WIDTH } from "./full-bracket-layout";

const CHAMPION_STROKE = "#7BCA25";
const DEFAULT_STROKE = "#33375A";
const CORNER_RADIUS = 12;

type PairConnectorSpec = {
  sourceCenters: [number, number];
  targetCenter: number;
  pairIndex: number;
  sourceMatchIds?: [number, number];
  targetMatchId?: number;
};

function effectiveRadius(
  requested: number,
  forkX: number,
  svgWidth: number,
  verticalSpan: number
): number {
  const horizontalLeg = Math.abs(forkX);
  const tailLeg = Math.abs(svgWidth - forkX);

  return Math.min(
    requested,
    horizontalLeg * 0.9,
    tailLeg * 0.9,
    Math.max(verticalSpan / 2, 1)
  );
}

function buildRoundedBranchPath(
  startX: number,
  startY: number,
  forkX: number,
  mergeY: number,
  svgWidth: number,
  r: number
): string {
  const verticalSpan = Math.abs(mergeY - startY);
  const radius = effectiveRadius(r, forkX, svgWidth, verticalSpan);
  const horizontalDir = forkX >= startX ? 1 : -1;
  const verticalDir = mergeY >= startY ? 1 : -1;

  const xBeforeCorner = forkX - horizontalDir * radius;
  const yAfterFirstCorner = startY + verticalDir * radius;

  return [
    `M ${startX} ${startY}`,
    `H ${xBeforeCorner}`,
    `Q ${forkX} ${startY} ${forkX} ${yAfterFirstCorner}`,
    `V ${mergeY}`
  ].join(" ");
}

function buildRoundedTailPath(
  forkX: number,
  mergeY: number,
  endX: number,
  svgWidth: number,
  r: number
): string {
  const horizontalSpan = Math.abs(endX - forkX);
  const radius = Math.min(
    effectiveRadius(r, forkX, svgWidth, horizontalSpan),
    horizontalSpan * 0.9
  );
  const tailDir = endX >= forkX ? 1 : -1;
  const xAfterSecondCorner = forkX + tailDir * radius;

  return [
    `M ${forkX} ${mergeY}`,
    `Q ${forkX} ${mergeY} ${xAfterSecondCorner} ${mergeY}`,
    `H ${endX}`
  ].join(" ");
}

function PairBracketConnector({
  spec,
  width,
  highlightedUpper,
  highlightedLower,
  mirror
}: {
  spec: PairConnectorSpec;
  width: number;
  highlightedUpper: boolean;
  highlightedLower: boolean;
  mirror?: boolean;
}) {
  const [y1, y2] = spec.sourceCenters;
  const y3 = spec.targetCenter;
  const minY = Math.min(y1, y2, y3);
  const maxY = Math.max(y1, y2, y3);
  const height = maxY - minY + 2;
  const forkX = width * 0.48;
  const rel = (y: number) => y - minY + 1;
  const startX = mirror ? width : 0;
  const endX = mirror ? 0 : width;
  const fork = mirror ? width - forkX : forkX;
  const highlightTail = highlightedUpper || highlightedLower;
  const sameSource = y1 === y2;

  const upperPath = buildRoundedBranchPath(
    startX,
    rel(y1),
    fork,
    rel(y3),
    width,
    CORNER_RADIUS
  );
  const lowerPath = sameSource
    ? null
    : buildRoundedBranchPath(startX, rel(y2), fork, rel(y3), width, CORNER_RADIUS);
  const tailPath = buildRoundedTailPath(fork, rel(y3), endX, width, CORNER_RADIUS);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="block overflow-visible"
      aria-hidden
    >
      {lowerPath ? (
        <path
          d={lowerPath}
          stroke={highlightedLower ? CHAMPION_STROKE : DEFAULT_STROKE}
          strokeWidth="1"
          fill="none"
        />
      ) : null}
      <path
        d={upperPath}
        stroke={highlightedUpper ? CHAMPION_STROKE : DEFAULT_STROKE}
        strokeWidth="1"
        fill="none"
      />
      <path
        d={tailPath}
        stroke={highlightTail ? CHAMPION_STROKE : DEFAULT_STROKE}
        strokeWidth="1"
        fill="none"
      />
      {highlightedUpper ? (
        <circle cx={startX} cy={rel(y1)} r={2.5} fill={CHAMPION_STROKE} />
      ) : null}
      {highlightedLower && lowerPath ? (
        <circle cx={startX} cy={rel(y2)} r={2.5} fill={CHAMPION_STROKE} />
      ) : null}
      {highlightTail ? (
        <circle cx={endX} cy={rel(y3)} r={2.5} fill={CHAMPION_STROKE} />
      ) : null}
    </svg>
  );
}

function resolveBranchHighlights(
  kind: keyof typeof CONNECTOR_WIDTH,
  spec: PairConnectorSpec,
  highlightedKeys: Set<string>
): { upper: boolean; lower: boolean } {
  if (spec.sourceMatchIds && spec.targetMatchId !== undefined) {
    const [upperId, lowerId] = spec.sourceMatchIds;
    const targetId = spec.targetMatchId;
    return {
      upper: highlightedKeys.has(`${kind}:${upperId}->${targetId}`),
      lower: highlightedKeys.has(`${kind}:${lowerId}->${targetId}`)
    };
  }

  const fallbackKey = `${kind}:${spec.pairIndex}`;
  const highlighted = highlightedKeys.has(fallbackKey);

  return { upper: highlighted, lower: highlighted };
}

export function BracketConnectors({
  kind,
  specs,
  bodyHeight,
  highlightedKeys,
  mirror,
  className
}: {
  kind: keyof typeof CONNECTOR_WIDTH;
  specs: PairConnectorSpec[];
  bodyHeight: number;
  highlightedKeys: Set<string>;
  mirror?: boolean;
  className?: string;
}) {
  const width = CONNECTOR_WIDTH[kind];

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width, height: bodyHeight }}
      aria-hidden
    >
      {specs.map((spec) => {
        const minY = Math.min(
          spec.sourceCenters[0],
          spec.sourceCenters[1],
          spec.targetCenter
        );
        const maxY = Math.max(
          spec.sourceCenters[0],
          spec.sourceCenters[1],
          spec.targetCenter
        );
        const blockHeight = maxY - minY + 2;
        const connectorKey =
          spec.sourceMatchIds && spec.targetMatchId !== undefined
            ? `${kind}:${spec.sourceMatchIds.join("+")}->${spec.targetMatchId}`
            : `${kind}:${spec.pairIndex}`;
        const { upper, lower } = resolveBranchHighlights(
          kind,
          spec,
          highlightedKeys
        );

        return (
          <div
            key={connectorKey}
            className="absolute left-0 flex items-start justify-center"
            style={{ top: minY - 1, height: blockHeight, width }}
          >
            <PairBracketConnector
              spec={spec}
              width={width}
              highlightedUpper={upper}
              highlightedLower={lower}
              mirror={mirror}
            />
          </div>
        );
      })}
    </div>
  );
}
