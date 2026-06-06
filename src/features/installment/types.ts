export type InstallmentStatus =
  | "active"
  | "near-end"
  | "completed"
  | "early-settlement";

export type InstallmentPlan = {
  id: string;
  icon: string;
  name: string;
  cardName: string;
  totalAmount: number;
  remainingAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  expectedEnd: string;
  status: InstallmentStatus;
  earlySettlementAmount?: number;
  closedDate?: string;
};

export type UpcomingPayment = {
  id: string;
  dueDate: string;
  icon: string;
  name: string;
  cardName: string;
  amount: number;
};
