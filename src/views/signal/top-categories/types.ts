export type SignalCategoryId = string;

export type SignalCategorySegment = {
  id: SignalCategoryId;
  label: string;
  count: number;
  percent?: number;
};

export type TopCategoriesData = {
  categories: SignalCategorySegment[];
};
