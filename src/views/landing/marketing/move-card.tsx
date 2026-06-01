import type { LandingMovementCard } from "@/types/landing";
import { TrendChartIcon } from "@/views/landing/landing-icons";
import { LandingFlag } from "@/views/landing/primitives/landing-flag";

interface MoveCardProps {
  movement: LandingMovementCard;
}

function ConfidenceBars({ confidence }: { confidence: LandingMovementCard["confidence"] }) {
  const barsClass = confidence === "high" ? "bars" : "bars yellow";
  const label = confidence === "high" ? "High confidence" : "Medium confidence";

  return (
    <span>
      {label}{" "}
      <span className={barsClass}>
        <i />
        <i />
        <i />
        <i />
      </span>
    </span>
  );
}

export function MoveCard({ movement }: MoveCardProps) {
  const titleClass = movement.titleDown ? "move-title down" : "move-title";

  return (
    <article className="move-card">
      <LandingFlag flag={movement.flag} flagKind={movement.flagKind} />
      <div>
        <h3 className={titleClass}>{movement.title}</h3>
        <p className="move-copy">
          {movement.copyHtml ? (
            <>
              {movement.copy} <span className="text-red">{movement.copyHtml}</span>
            </>
          ) : (
            movement.copy
          )}
        </p>
        <div className="move-meta">
          <span>
            Vol: <strong>{movement.volume}</strong>
          </span>
          <ConfidenceBars confidence={movement.confidence} />
        </div>
      </div>
      <div className="move-score">
        {movement.trending ? (
          <>
            <TrendChartIcon />
            <span className="delta">{movement.delta}</span>
          </>
        ) : (
          <>
            <strong>{movement.score}</strong>
            <span className={movement.deltaDown ? "delta down" : "delta"}>{movement.delta}</span>
          </>
        )}
      </div>
    </article>
  );
}
