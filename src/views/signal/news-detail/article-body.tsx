import { cn } from "@/lib/cn";

import type {
  SignalNewsDetailBodyBlock,
  SignalNewsDetailTextSegment
} from "./types";

export type SignalNewsDetailArticleBodyProps = {
  blocks: SignalNewsDetailBodyBlock[];
  className?: string;
};

function renderSegments(segments: SignalNewsDetailTextSegment[]) {
  return segments.map((segment, index) => {
    if (segment.kind === "link") {
      return (
        <a
          key={`${segment.value}-${index}`}
          href={segment.href}
          className="text-black underline decoration-black underline-offset-2"
        >
          {segment.value}
        </a>
      );
    }

    return <span key={`${segment.value}-${index}`} dangerouslySetInnerHTML={{ __html: segment.value }}></span>;
  });
}

export function SignalNewsDetailArticleBody({
  blocks,
  className
}: SignalNewsDetailArticleBodyProps) {
  return (
    <div className={cn("flex flex-col gap-[16px]", className)}>
      {blocks.map((block, index) => {
        if (block.kind === "subheading") {
          return (
            <h3
              key={`${block.text}-${index}`}
              className="m-0 text-[14px] font-[500] leading-[150%] text-black"
            >
              {block.text}
            </h3>
          );
        }

        return (
          <p
            key={`paragraph-${index}`}
            className="m-0 text-[14px] font-[400] leading-[150%] text-black"
          >
            {renderSegments(block.segments)}
          </p>
        );
      })}
    </div>
  );
}
