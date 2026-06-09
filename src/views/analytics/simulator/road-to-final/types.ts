export type RoadToFinalTeam = {
  id: string;
  teamCode: string;
  teamName: string;
};

export type RoadToFinalSlot = RoadToFinalTeam | null;

export type RoadToFinalBracket = {
  r16: RoadToFinalSlot[];
  qf: RoadToFinalSlot[];
  sf: RoadToFinalSlot[];
  final: RoadToFinalSlot[];
};
