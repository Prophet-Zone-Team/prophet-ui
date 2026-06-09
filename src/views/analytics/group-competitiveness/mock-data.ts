import type { GroupCompetitivenessData } from "./types";

export const groupCompetitivenessData: GroupCompetitivenessData = {
  deathSection: {
    variant: "death",
    label: "Group of Death",
    description: "Teams are closely matched, creating maximum uncertainty.",
    entries: [
      { groupId: "H", score: 96 },
      { groupId: "B", score: 72 },
      { groupId: "F", score: 68 },
      { groupId: "D", score: 64 }
    ]
  },
  easiestSection: {
    variant: "easiest",
    label: "Easiest Group",
    description: "The strength gap is more obvious.",
    entries: [
      { groupId: "C", score: 38 },
      { groupId: "A", score: 42 },
      { groupId: "E", score: 45 },
      { groupId: "G", score: 50 }
    ]
  }
};
