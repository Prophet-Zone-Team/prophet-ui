import { cn } from "@/lib/cn";

import { buildPairConnectorSpecs } from "./bracket-layout";

const CONNECTOR_WIDTH = {
  "r16-qf": 25,
  "qf-sf": 20,
  "sf-final": 28
} as const;

export type BracketConnectorKind = keyof typeof CONNECTOR_WIDTH;

export type BracketConnectorsProps = {
  kind: BracketConnectorKind;
  bodyHeight: number;
  className?: string;
};

type PairConnectorSpec = {
  sourceCenters: [number, number];
  targetCenter: number;
};

function PairBracketConnector({
  spec,
  width
}: {
  spec: PairConnectorSpec;
  width: number;
}) {
  const [y1, y2] = spec.sourceCenters;
  const y3 = spec.targetCenter;
  const minY = Math.min(y1, y2, y3);
  const maxY = Math.max(y1, y2, y3);
  const height = maxY - minY + 2;
  const forkX = width * 0.48;
  const rel = (y: number) => y - minY + 1;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="block"
      aria-hidden
    >
      <path
        d={`M 0 ${rel(y1)} H ${forkX} V ${rel(y3)} H ${width}`}
        stroke="var(--prophet-text-muted)"
        strokeWidth="1"
      />
      <path
        d={`M 0 ${rel(y2)} H ${forkX} V ${rel(y3)}`}
        stroke="var(--prophet-text-muted)"
        strokeWidth="1"
      />
    </svg>
  );
}

function getConnectorSpecs(kind: BracketConnectorKind): PairConnectorSpec[] {
  switch (kind) {
    case "r16-qf":
      return buildPairConnectorSpecs("r16", "qf");
    case "qf-sf":
      return buildPairConnectorSpecs("qf", "sf");
    case "sf-final":
      return buildPairConnectorSpecs("sf", "final");
  }
}

export function BracketConnectors({
  kind,
  bodyHeight,
  className
}: BracketConnectorsProps) {
  const width = CONNECTOR_WIDTH[kind];
  const specs = getConnectorSpecs(kind);

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width, height: bodyHeight }}
      aria-hidden
    >
      {specs.map((spec, index) => {
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

        return (
          <div
            key={`${kind}-${index}`}
            className="absolute left-0 flex items-start justify-center"
            style={{ top: minY - 1, height: blockHeight, width }}
          >
            <PairBracketConnector spec={spec} width={width} />
          </div>
        );
      })}
    </div>
  );
}
