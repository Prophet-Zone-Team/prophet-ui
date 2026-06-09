import type { LegalBlock, LegalListItem, LegalTextSegment } from "@/types/legal";

export function t(value: string): LegalTextSegment {
  return { kind: "text", value };
}

export function l(label: string, href: string): LegalTextSegment {
  return { kind: "link", label, href };
}

export function p(...segments: LegalTextSegment[]): LegalBlock {
  return { kind: "paragraph", segments };
}

export function ol(items: LegalListItem[]): LegalBlock {
  return { kind: "orderedList", items };
}

export function ul(items: LegalListItem[]): LegalBlock {
  return { kind: "unorderedList", items };
}
