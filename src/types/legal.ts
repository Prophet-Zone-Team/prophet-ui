export type LegalTextSegment =
  | { kind: "text"; value: string }
  | { kind: "link"; label: string; href: string };

export type LegalListItem = string | LegalTextSegment[];

export type LegalBlock =
  | { kind: "paragraph"; segments: LegalTextSegment[] }
  | { kind: "orderedList"; items: LegalListItem[] }
  | { kind: "unorderedList"; items: LegalListItem[] };

export type LegalSubsection = {
  title: string;
  blocks: LegalBlock[];
};

export type LegalSection = {
  id: string;
  title: string;
  blocks?: LegalBlock[];
  subsections?: LegalSubsection[];
};

export type LegalDocument = {
  title: string;
  preamble: LegalBlock[];
  sections: LegalSection[];
};

export type LegalTextSegmentKey =
  | { kind: "text"; key: string }
  | { kind: "link"; key: string; href: string };

export type LegalListItemKey = string | LegalTextSegmentKey[];

export type LegalBlockKey =
  | { kind: "paragraph"; segments: LegalTextSegmentKey[] }
  | { kind: "orderedList"; items: LegalListItemKey[] }
  | { kind: "unorderedList"; items: LegalListItemKey[] };

export type LegalSubsectionKey = {
  titleKey: string;
  blocks: LegalBlockKey[];
};

export type LegalSectionKey = {
  id: string;
  titleKey: string;
  blocks?: LegalBlockKey[];
  subsections?: LegalSubsectionKey[];
};

export type LegalDocumentKeys = {
  preamble: LegalBlockKey[];
  sections: LegalSectionKey[];
};
