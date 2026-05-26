export type SignalCategoryId =
  | "injuries"
  | "fitness"
  | "suspensions"
  | "travel"
  | "morale";

export type SignalCategorySegment = {
  id: SignalCategoryId;
  label: string;
  count: number;
};

export type TopCategoriesData = {
  categories: SignalCategorySegment[];
};
