import Link from "next/link";

import { legalMeta } from "@/config/legal";
import {
  formatLegalListItem,
  formatLegalSegments,
  formatLegalString,
} from "@/lib/legal/format-legal-text";
import { cn } from "@/lib/cn";
import type {
  LegalBlock,
  LegalDocument,
  LegalListItem,
  LegalTextSegment,
} from "@/types/legal";

function renderSegments(segments: LegalTextSegment[]) {
  const formatted = formatLegalSegments(segments);

  return formatted.map((segment, index) => {
    if (segment.kind === "link") {
      return (
        <Link
          key={`${segment.href}-${index}`}
          href={segment.href}
          className="text-black underline decoration-black underline-offset-2 hover:opacity-70"
        >
          {segment.label}
        </Link>
      );
    }

    return <span key={`text-${index}`}>{segment.value}</span>;
  });
}

function renderListItem(item: LegalListItem, index: number) {
  const formatted = formatLegalListItem(item);

  if (typeof formatted === "string") {
    return <li key={`item-${index}`}>{formatted}</li>;
  }

  return (
    <li key={`item-${index}`}>{renderSegments(formatted)}</li>
  );
}

function LegalBlockView({ block }: { block: LegalBlock }) {
  if (block.kind === "paragraph") {
    return (
      <p className="m-0 text-[14px] font-[400] leading-[150%] text-black">
        {renderSegments(block.segments)}
      </p>
    );
  }

  const ListTag = block.kind === "orderedList" ? "ol" : "ul";
  const listClass =
    block.kind === "orderedList"
      ? "m-0 list-decimal pl-5"
      : "m-0 list-disc pl-5";

  return (
    <ListTag
      className={cn(
        listClass,
        "flex flex-col gap-2 text-[14px] font-[400] leading-[150%] text-black"
      )}
    >
      {block.items.map((item, index) => renderListItem(item, index))}
    </ListTag>
  );
}

function LegalBlocksView({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, index) => (
        <LegalBlockView key={`block-${index}`} block={block} />
      ))}
    </div>
  );
}

export type LegalDocumentPageProps = {
  document: LegalDocument;
  className?: string;
};

export function LegalDocumentPage({
  document,
  className,
}: LegalDocumentPageProps) {
  return (
    <section
      className={cn(
        "mx-auto w-full max-w-[800px] px-3 pb-12 pt-6 md:px-4",
        className
      )}
    >
      <article className="flex flex-col gap-8">
        <header className="flex flex-col gap-2 border-b border-[#EBEBEB] pb-6">
          <h1 className="m-0 text-[24px] font-[600] leading-[120%] text-black md:text-[28px]">
            {formatLegalString(document.title)}
          </h1>
          <p className="m-0 text-[12px] font-[400] leading-[150%] text-[#909090]">
            Last Updated: {formatLegalString(legalMeta.lastUpdated)}
          </p>
        </header>

        <div className="flex flex-col gap-4">
          <LegalBlocksView blocks={document.preamble} />
        </div>

        {document.sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="flex flex-col gap-4 scroll-mt-24"
          >
            <h2 className="m-0 text-[18px] font-[600] leading-[130%] text-black">
              {formatLegalString(section.title)}
            </h2>

            {section.blocks ? (
              <LegalBlocksView blocks={section.blocks} />
            ) : null}

            {section.subsections?.map((subsection) => (
              <div key={subsection.title} className="flex flex-col gap-4">
                <h3 className="m-0 text-[15px] font-[500] leading-[130%] text-black">
                  {formatLegalString(subsection.title)}
                </h3>
                <LegalBlocksView blocks={subsection.blocks} />
              </div>
            ))}
          </section>
        ))}
      </article>
    </section>
  );
}
