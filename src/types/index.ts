export interface Member {
  id: string;
  name: string;
  totalPenalties: number;
  totalAmount: number;
}

export interface Penalty {
  id: string;
  memberId: string;
  memberName: string;
  category: PenaltyCategory;
  amount: number;
  date: string;
  notes?: string;
}

export type PenaltyCategory = 'uniform' | 'marsch' | 'sonstiges';

export const PENALTY_CATEGORIES = {
  uniform: 'Uniform',
  marsch: 'Marsch',
  sonstiges: 'Sonstiges'
} as const;

export const PENALTY_AMOUNTS = {
  uniform: 5,
  marsch: 10,
  sonstiges: 15
} as const;