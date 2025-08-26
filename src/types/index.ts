export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  email?: string;
  phone?: string;
  rank: MemberRank;
  join_year?: number;
  birth_date?: string;
  profile_photo?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  totalPenalties?: number;
  totalAmount?: number;
}

export interface Penalty {
  id: string;
  member_id: string;
  category: PenaltyCategory;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  member?: Member;
}

export type PenaltyCategory = 'uniform' | 'marsch' | 'sonstiges';

export type MemberRank = 
  | 'rekrut'
  | 'schuetze' 
  | 'gastschuetze'
  | 'gefreiter'
  | 'obergefreiter'
  | 'unteroffizier'
  | 'feldwebel'
  | 'oberfeldwebel'
  | 'leutnant'
  | 'oberleutnant'
  | 'hauptmann'
  | 'major'
  | 'oberst';

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

export const MEMBER_RANKS = {
  rekrut: 'Rekrut',
  schuetze: 'Schütze',
  gastschuetze: 'Gastschütze',
  gefreiter: 'Gefreiter',
  obergefreiter: 'Obergefreiter',
  unteroffizier: 'Unteroffizier',
  feldwebel: 'Feldwebel',
  oberfeldwebel: 'Oberfeldwebel',
  leutnant: 'Leutnant',
  oberleutnant: 'Oberleutnant',
  hauptmann: 'Hauptmann',
  major: 'Major',
  oberst: 'Oberst'
} as const;