import type {
  LegalBlock,
  LegalBlockKey,
  LegalDocument,
  LegalDocumentKeys,
  LegalListItem,
  LegalListItemKey,
  LegalTextSegment,
  LegalTextSegmentKey,
} from "@/types/legal";

type LegalTranslator = (key: string) => string;

function resolveSegments(
  segments: LegalTextSegmentKey[],
  translate: LegalTranslator
): LegalTextSegment[] {
  return segments.map((segment) => {
    if (segment.kind === "text") {
      return {
        kind: "text",
        value: translate(segment.key),
      };
    }

    return {
      kind: "link",
      label: translate(segment.key),
      href: segment.href,
    };
  });
}

function resolveListItem(
  item: LegalListItemKey,
  translate: LegalTranslator
): LegalListItem {
  if (typeof item === "string") {
    return translate(item);
  }

  return resolveSegments(item, translate);
}

function resolveBlock(block: LegalBlockKey, translate: LegalTranslator): LegalBlock {
  if (block.kind === "paragraph") {
    return {
      kind: "paragraph",
      segments: resolveSegments(block.segments, translate),
    };
  }

  return {
    kind: block.kind,
    items: block.items.map((item) => resolveListItem(item, translate)),
  };
}

export function resolveLegalDocument(
  keys: LegalDocumentKeys,
  translate: LegalTranslator
): LegalDocument {
  return {
    title: "",
    preamble: keys.preamble.map((block) => resolveBlock(block, translate)),
    sections: keys.sections.map((section) => ({
      id: section.id,
      title: translate(section.titleKey),
      blocks: section.blocks?.map((block) => resolveBlock(block, translate)),
      subsections: section.subsections?.map((subsection) => ({
        title: translate(subsection.titleKey),
        blocks: subsection.blocks.map((block) => resolveBlock(block, translate)),
      })),
    })),
  };
}
