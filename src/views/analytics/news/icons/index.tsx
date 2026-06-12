import { NewsSentiment } from "../types";
import { HighImpactSentimentIcon } from "./high-impact-sentiment-icon";
import { NegativeSentimentIcon } from "./negative-sentiment-icon";
import { PositiveSentimentIcon } from "./positive-sentiment-icon";

export { PositiveSentimentIcon };
export { NegativeSentimentIcon };
export { HighImpactSentimentIcon };

export function SentimentIcon({ sentiment }: { sentiment: NewsSentiment }) {
  if (sentiment === "negative") {
    return <NegativeSentimentIcon />;
  }

  if (sentiment === "positive") {
    return <PositiveSentimentIcon />;
  }

  return <HighImpactSentimentIcon />;
}

export function SentimentColor({ sentiment }: { sentiment: NewsSentiment }) {
  if (sentiment === "negative") {
    return "text-[#FF674B]";
  }

  if (sentiment === "positive") {
    return "text-[#7BCA25]";
  }

  return "text-[#F4B600]";
}
