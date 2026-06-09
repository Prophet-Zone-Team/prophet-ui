import type { SignalNewsDetail } from "./types";

export const signalNewsDetailsById: Record<string, SignalNewsDetail> = {
  "mbappe-training": {
    id: "mbappe-training",
    title:
      "Kylian Mbappé Matches Cristiano Ronaldo And Lionel Messi Goalscoring Feat",
    updatedAtLabel: "Updated May. 25, 2026 1:24 p.m. GMT-4",
    imageUrl: "/signal/news-detail-hero.png",
    imageAlt: "Kylian Mbappé celebrating in a Real Madrid kit",
    sentiment: "positive",
    impactScore: 7.2,
    relatedLabel: "France, Mbappé",
    categoryLabel: "Morale",
    body: [
      {
        kind: "paragraph",
        segments: [
          {
            kind: "text",
            value:
              "Kylian Mbappé has won the Pichichi Trophy as La Liga's top scorer for the 2025-26 season, capping a prolific campaign that has drawn comparisons with the league's all-time greats."
          }
        ]
      },
      {
        kind: "subheading",
        text: "Mbappé seals another Pichichi crown"
      },
      {
        kind: "paragraph",
        segments: [
          {
            kind: "text",
            value:
              "The France forward finished the regular season with 31 league goals, helping "
          },
          {
            kind: "link",
            value: "Real Madrid's 4-2 victory over Athletic Club",
            href: "#"
          },
          {
            kind: "text",
            value:
              " secure the title race momentum Madrid needed in the closing weeks."
          }
        ]
      },
      {
        kind: "subheading",
        text: "Mbappé joins elite company in Spain"
      },
      {
        kind: "paragraph",
        segments: [
          {
            kind: "text",
            value:
              "With his latest scoring run, Mbappé has matched a feat previously reached by "
          },
          {
            kind: "link",
            value: "Ronaldo",
            href: "#"
          },
          {
            kind: "text",
            value: " and Lionel Messi in combining sustained La Liga output with Champions League impact."
          }
        ]
      },
      {
        kind: "paragraph",
        segments: [
          {
            kind: "text",
            value:
              "Market context around France and Madrid-linked outcomes has moved in tandem with the headline, with sentiment framed as correlation rather than causality."
          }
        ]
      }
    ]
  }
};
