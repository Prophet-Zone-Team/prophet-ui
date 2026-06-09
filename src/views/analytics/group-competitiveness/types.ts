export type GroupCompetitivenessVariant = "death" | "easiest";

export type GroupCompetitivenessEntry = {
  groupId: string;
  score: number;
};

export type GroupCompetitivenessSectionData = {
  variant: GroupCompetitivenessVariant;
  label: string;
  description: string;
  entries: GroupCompetitivenessEntry[];
};

export type GroupCompetitivenessData = {
  deathSection: GroupCompetitivenessSectionData;
  easiestSection: GroupCompetitivenessSectionData;
};
