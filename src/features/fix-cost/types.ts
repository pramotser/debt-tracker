export type Category = {
  id: string;
  name: string;
  color: string;
};

export type Template = {
  id: string;
  name: string;
  amount?: number;
  categoryId: string;
};

export type FixCostItem = {
  id: string;
  year: number;
  month: number;
  name: string;
  amount?: number;
  categoryId: string;
  paid: boolean;
};

export type MonthClose = {
  year: number;
  month: number;
  closed: boolean;
};

export type YearMonth = { year: number; month: number };
