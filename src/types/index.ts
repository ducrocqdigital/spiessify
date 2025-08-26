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

export interface PenaltyCatalog {
  id: string;
  name: string;
  category: PenaltyCatalogCategory;
  amount: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Penalty {
  id: string;
  member_id: string;
  penalty_type_id: string;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  member?: Member;
  penalty_type?: PenaltyCatalog;
}

export type PenaltyCatalogCategory = 'timing' | 'soziales' | 'abnahme' | 'maschieren' | 'sonstiges';

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

export const PENALTY_CATALOG_CATEGORIES = {
  timing: 'Timing',
  soziales: 'Soziales', 
  abnahme: 'Abnahme',
  maschieren: 'Maschieren',
  sonstiges: 'Sonstiges'
} as const;

// Legacy export for backward compatibility
export const PENALTY_CATEGORIES = PENALTY_CATALOG_CATEGORIES;

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