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
